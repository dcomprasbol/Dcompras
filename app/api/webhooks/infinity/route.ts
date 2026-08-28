import { NextRequest, NextResponse } from "next/server";
import { getOrderByInfinityOrderId, getOrderById, updateOrderInfinityInfo, updateOrderStatus } from "@/lib/repo";
import { verifyWebhookSignature } from "@/lib/infinityPayments";
import { calculateCommission } from "@/lib/commission";

// Endpoint que Infinity Payments llama cuando confirma un pago (evento
// payment.completed) — ver "5. Webhooks" en la documentación.
//
// Seguridad: la firma HMAC (X-Infinity-Signature) con INFINITY_WEBHOOK_SECRET
// es lo único que nos dice que esta llamada vino de verdad de Infinity y no
// de cualquiera que adivine la URL — sin eso, cualquiera podría pegarle a
// este endpoint y marcar pedidos como pagados sin que haya entrado plata.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-infinity-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  let body: any;
  try {
    body = JSON.parse(rawBody || "{}");
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // Solo nos importa la confirmación de pago; cualquier otro evento lo
  // reconocemos con 200 para que Infinity no lo reintente, pero no hacemos
  // nada con él.
  if (body.event !== "payment.completed" || body.status !== "paid") {
    return NextResponse.json({ received: true });
  }

  // El orderId de Infinity puede venir en el nivel raíz o adentro de data,
  // según el evento.
  const infinityOrderId: string | undefined = body.orderId || body.data?.orderId;
  const ferioOrderId: string | undefined = body.metadata?.ferioOrderId;

  if (!infinityOrderId && !ferioOrderId) {
    console.error("Webhook de Infinity sin ningún id identificable:", rawBody);
    return NextResponse.json({ received: true });
  }

  // Buscamos primero por infinity_order_id (el vínculo que dejó orders/route.ts
  // al crear el pago). Si ese lookup falla — por ejemplo, porque
  // updateOrderInfinityInfo no llegó a guardarlo por algún error transitorio —
  // probamos con nuestro propio id de pedido, que viaja en metadata.ferioOrderId
  // desde el momento en que se creó el pago. Antes esto era un "||" que nunca
  // llegaba a probar el segundo id si el primer lookup simplemente no
  // encontraba nada (no fallaba, solo devolvía null), así que el fallback en
  // la práctica nunca se ejecutaba.
  let order = infinityOrderId ? await getOrderByInfinityOrderId(infinityOrderId) : null;

  if (!order && ferioOrderId) {
    order = await getOrderById(ferioOrderId);
    if (order && infinityOrderId) {
      // Encontrado por el id propio pero sin el vínculo guardado — lo
      // completamos ahora para que el próximo webhook (o cualquier otra
      // consulta por infinity_order_id) ya lo encuentre directo.
      console.warn(
        `Webhook de Infinity: pedido ${ferioOrderId} encontrado por metadata, faltaba el vínculo con infinityOrderId=${infinityOrderId} — completando.`
      );
      await updateOrderInfinityInfo(ferioOrderId, infinityOrderId);
    }
  }

  if (!order) {
    console.error(
      `Webhook de Infinity: no se encontró pedido (infinityOrderId=${infinityOrderId ?? "-"}, ferioOrderId=${ferioOrderId ?? "-"})`
    );
    return NextResponse.json({ received: true });
  }

  // Idempotencia: si ya está pagado, no hay nada más que hacer (Infinity
  // puede reintentar o mandar duplicados).
  if (order.status === "pagado") {
    return NextResponse.json({ received: true });
  }

  // Chequeo de integridad: el monto pagado tiene que calzar con lo que le
  // pedimos a Infinity al generar el QR (order.total + comisión — ver
  // lib/commission.ts), no con order.total a secas: este pedido llegó por
  // getOrderByInfinityOrderId, o sea que sí pasó por Dcompras. Si no calza,
  // no lo marcamos pagado — queda para revisión manual.
  const { totalToCharge } = calculateCommission(order.total, true);
  const amount = Number(body.amount);
  if (Number.isFinite(amount) && Math.abs(amount - totalToCharge) > 0.01) {
    console.error(
      `Webhook de Infinity para el pedido ${order.id}: monto ${amount} no coincide con lo esperado ${totalToCharge}`
    );
    return NextResponse.json({ received: true });
  }

  await updateOrderStatus(order.id, "pagado");

  return NextResponse.json({ received: true });
}
