import { NextRequest, NextResponse } from "next/server";
import {
  getStoreBySlug,
  listOrders,
  createOrderWithItems,
  updateOrderSipInfo,
  updateOrderInfinityInfo,
} from "@/lib/repo";
import { requireStoreAdmin, getCurrentUser } from "@/lib/auth";
import { DELIVERY_TYPES } from "@/lib/utils";
import { isValidLatLng } from "@/lib/geo";
import { generarQr, formatSipDate, isSipConfigured } from "@/lib/sip";
import { createPayment, isInfinityConfigured, normalizeQrImage } from "@/lib/infinityPayments";
import { calculateCommission } from "@/lib/commission";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const store = await requireStoreAdmin(params.slug);
  if (!store) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const orders = await listOrders(store.id);
  return NextResponse.json({ orders });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const store = await getStoreBySlug(params.slug);
  if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
  if (store.status !== "aprobada") {
    return NextResponse.json({ error: "Esta tienda todavía no está disponible" }, { status: 400 });
  }

  const body = await req.json();
  const {
    customerName,
    customerPhone,
    customerAddress,
    paymentMethod,
    items,
    deliveryType,
    deliveryLat,
    deliveryLng,
  } = body;

  if (!customerName || !customerPhone || !customerAddress) {
    return NextResponse.json(
      { error: "Nombre, teléfono y dirección son obligatorios" },
      { status: 400 }
    );
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
  }
  if (!["qr", "contra_entrega"].includes(paymentMethod)) {
    return NextResponse.json({ error: "Método de pago inválido" }, { status: 400 });
  }
  if (deliveryType !== undefined && !DELIVERY_TYPES.some((d) => d.value === deliveryType)) {
    return NextResponse.json({ error: "Tipo de entrega inválido" }, { status: 400 });
  }
  // Las coordenadas son opcionales (el comprador puede escribir solo la
  // dirección a mano), pero si vienen, tienen que ser un lat/lng real.
  const hasCoords = deliveryLat !== undefined && deliveryLat !== null;
  if (hasCoords && !isValidLatLng(Number(deliveryLat), Number(deliveryLng))) {
    return NextResponse.json({ error: "Ubicación inválida" }, { status: 400 });
  }

  // Si el comprador está logueado, el pedido queda asociado a su cuenta
  // para que lo vea después en /mis-pedidos — nunca se toma del body (eso
  // permitiría atribuirle el pedido a cualquier otra cuenta), siempre se lee
  // de la sesión real. El checkout como invitado sigue funcionando igual.
  const buyer = await getCurrentUser();

  try {
    const order = await createOrderWithItems(
      store.id,
      {
        customerName,
        customerPhone,
        customerAddress,
        deliveryType: deliveryType || DELIVERY_TYPES[0].value,
        deliveryLat: hasCoords ? Number(deliveryLat) : null,
        deliveryLng: hasCoords ? Number(deliveryLng) : null,
      },
      paymentMethod,
      items,
      buyer?.id ?? null
    );

    // Cobro centralizado: si la plataforma tiene un proveedor de cobro
    // configurado, generamos un QR/checkout dinámico para este pedido. La
    // plata entra a la cuenta de Dcompras, que se queda con la comisión
    // (lib/commission.ts) y liquida el resto al vendedor después (ver
    // /plataforma → Liquidaciones). La comisión se SUMA arriba de order.total
    // (lo que puso el vendedor) — el QR le pide al comprador ese extra, el
    // vendedor recibe el 100% de order.total sin descuentos. Si algo falla
    // acá (proveedor caído, todavía sin configurar, etc.) no reventamos el
    // pedido, pero tampoco le mostramos al comprador el QR que el vendedor
    // cargó en Cuenta — ese es solo para que Dcompras le liquide a él, nunca
    // para que le paguen directo (saltearía la comisión). El checkout le
    // pide en cambio coordinar el pago por WhatsApp con el vendedor (ese
    // caso no genera comisión ni liquidación: la plata nunca pasa por
    // Dcompras).
    //
    // Infinity Payments es el proveedor activo por ahora. SIP/BISA queda
    // intacto como respaldo (lib/sip.ts) por si en algún momento se retoma
    // esa integración — nunca se ejecutan los dos a la vez.
    let payment: {
      checkoutUrl: string | null;
      qrImage: string | null;
      amountCharged: number;
      commissionAmount: number;
      _debugCallback?: string;
      _debugPublicAppUrlEnv?: string | null;
      _debugOrigin?: string;
    } | null = null;

    if (paymentMethod === "qr" && isInfinityConfigured()) {
      try {
        const callback = `${process.env.PUBLIC_APP_URL || req.nextUrl.origin}/api/webhooks/infinity`;
        const { commissionAmount, totalToCharge } = calculateCommission(order.total, true);
        const result = await createPayment({
          amount: totalToCharge,
          currency: "BOB",
          description: `${store.name} - Pedido #${order.id.slice(-6).toUpperCase()}`,
          callbackUrl: callback,
          metadata: { ferioOrderId: order.id },
        });
        await updateOrderInfinityInfo(order.id, result.orderId);
        payment = {
          checkoutUrl: result.checkoutUrl ?? null,
          qrImage: normalizeQrImage(result.qrImageBase64),
          amountCharged: totalToCharge,
          commissionAmount,
          // TEMPORAL: sacar apenas se confirme por qué algunos pedidos
          // mandaron localhost:3000 como callback en vez del dominio real.
          _debugCallback: callback,
          _debugPublicAppUrlEnv: process.env.PUBLIC_APP_URL ?? null,
          _debugOrigin: req.nextUrl.origin,
        };
      } catch (err) {
        console.error(`No se pudo crear el pago de Infinity para el pedido ${order.id}:`, err);
      }
    } else {
      const platformApikeyServicio = process.env.SIP_APIKEY_SERVICIO;
      if (paymentMethod === "qr" && platformApikeyServicio && isSipConfigured()) {
        try {
          const callback = `${process.env.PUBLIC_APP_URL || req.nextUrl.origin}/api/webhooks/sip/confirmar-pago`;
          const vencimiento = new Date();
          vencimiento.setDate(vencimiento.getDate() + 2);
          const { commissionAmount, totalToCharge } = calculateCommission(order.total, true);
          const result = await generarQr({
            apikeyServicio: platformApikeyServicio,
            alias: order.id,
            callback,
            detalleGlosa: `${store.name} #${order.id.slice(-6).toUpperCase()}`,
            monto: totalToCharge,
            moneda: "BOB",
            fechaVencimiento: formatSipDate(vencimiento),
          });
          await updateOrderSipInfo(order.id, {
            sipIdQr: result.idQr,
            sipQrImage: result.imagenQr,
            sipBancoDestino: result.bancoDestino,
            sipCuentaDestino: result.cuentaDestino,
          });
          payment = {
            checkoutUrl: null,
            qrImage: normalizeQrImage(result.imagenQr),
            amountCharged: totalToCharge,
            commissionAmount,
          };
        } catch (err) {
          console.error(`No se pudo generar el QR de SIP para el pedido ${order.id}:`, err);
        }
      }
    }

    return NextResponse.json({ order, payment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "No se pudo crear el pedido" }, { status: 400 });
  }
}
