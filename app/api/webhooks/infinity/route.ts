import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getOrderByInfinityOrderId, updateOrderStatus } from "@/lib/repo";
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
    // TEMPORAL (sacar apenas se confirme el problema): un webhook real llegó
    // pagado de verdad (PAY-1787776767595ae0e50f8, Bs 1.01) pero el pedido
    // nunca se marcó 'pagado' — sospecha es que esta verificación de firma
    // está rechazando en silencio (responde 401, pero eso puede figurar como
    // "entregado" del lado de Infinity si solo miran que hubo respuesta).
    // Esto no expone el secreto: un HMAC es de un solo sentido, ver el
    // resultado no permite reconstruir INFINITY_WEBHOOK_SECRET.
    const secret = process.env.INFINITY_WEBHOOK_SECRET;
    const expected = secret
      ? "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex")
      : "(falta INFINITY_WEBHOOK_SECRET)";
    console.error("Webhook de Infinity: firma inválida", {
      headerRecibido: signature,
      firmaEsperada: expected,
      largoBody: rawBody.length,
      todosLosHeaders: Object.fromEntries(req.headers.entries()),
    });
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
  // según el evento — probamos ambos. También reenviamos nuestro propio id
  // de pedido como metadata al crear el pago (ver orders/route.ts), como
  // respaldo si alguna vez cambia el nombre del campo.
  const infinityOrderId: string | undefined =
    body.orderId || body.data?.orderId || body.metadata?.ferioOrderId;

  if (!infinityOrderId) {
    console.error("Webhook de Infinity sin orderId identificable:", rawBody);
    return NextResponse.json({ received: true });
  }

  const order = await getOrderByInfinityOrderId(infinityOrderId);
  if (!order) {
    console.error(`Webhook de Infinity: no se encontró pedido para orderId ${infinityOrderId}`);
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
