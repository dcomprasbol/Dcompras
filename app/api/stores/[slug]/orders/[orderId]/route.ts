import { NextRequest, NextResponse } from "next/server";
import { requireStoreAdmin } from "@/lib/auth";
import {
  getOrderById,
  updateOrderStatus,
  updateOrderEstimatedDelivery,
  markOrderReminderSent,
} from "@/lib/repo";
import { ORDER_STATUSES } from "@/lib/utils";

const VALID_STATUSES = ORDER_STATUSES.map((s) => s.value);

// Un pedido con QR no puede pasar a estos estados mientras siga 'pendiente'
// — primero tiene que quedar 'pagado' (por el webhook del gateway, o a mano
// si es un pago coordinado), y recién ahí el vendedor puede prepararlo o
// enviarlo. Contra entrega no entra acá: ese se paga al recibir, nunca
// antes, así que puede avanzar sin pasar por 'pagado'.
const REQUIRES_PAYMENT_FIRST = ["en_preparacion", "enviado", "entregado"];
// Con retiro en Punto Dcompras, "enviado" y "entregado" los marca el
// encargado del punto al recibir y entregar el paquete (lib/pickup.ts).
const PICKUP_MANAGED = ["enviado", "entregado"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string; orderId: string } }
) {
  const store = await requireStoreAdmin(params.slug);
  if (!store) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Toda modificación exige que el pedido sea de ESTA tienda (antes solo se
  // chequeaba para algunos estados: con el id de un pedido ajeno se podía
  // cambiar su estado desde otra tienda).
  const order = await getOrderById(params.orderId);
  if (!order || order.storeId !== store.id) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  const body = await req.json();
  const { status, estimatedDelivery, reminderSent } = body;

  // "Por cobrar": el vendedor mandó el recordatorio de pago por WhatsApp.
  if (reminderSent === true) {
    await markOrderReminderSent(order.id);
  }

  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    if (order.pickupPointId && PICKUP_MANAGED.includes(status)) {
      return NextResponse.json(
        {
          error:
            "En pedidos con retiro en Punto Dcompras, este estado lo marca el punto al recibir y entregar el paquete.",
        },
        { status: 400 }
      );
    }

    if (REQUIRES_PAYMENT_FIRST.includes(status) && order.paymentMethod === "qr" && order.status === "pendiente") {
      return NextResponse.json(
        {
          error:
            "Este pedido todavía no está pagado. Confirma el pago antes de prepararlo o enviarlo.",
        },
        { status: 400 }
      );
    }

    await updateOrderStatus(order.id, status);
  }

  // string vacío o null: el vendedor quiere borrar la fecha estimada.
  if (estimatedDelivery !== undefined) {
    await updateOrderEstimatedDelivery(order.id, estimatedDelivery || null);
  }

  return NextResponse.json({ ok: true });
}
