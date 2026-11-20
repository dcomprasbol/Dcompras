import { NextRequest, NextResponse } from "next/server";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { getStoreBySlug, getOrderById, saveOrderPaymentReceipt } from "@/lib/repo";

// Pago coordinado: el comprador sube la captura de su transferencia desde
// el seguimiento (sin login: el id del pedido es un UUID imposible de
// adivinar, el mismo que ya da acceso al seguimiento). El comprobante tiene
// datos bancarios: se guarda en la base, no en el bucket público de fotos.
const MAX_RECEIPT_CHARS = 1_500_000; // ~1,1 MB de imagen

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string; orderId: string } }
) {
  const limited = await rateLimit(req, RATE_LIMITS.paymentReceipt, [params.orderId]);
  if (limited) return limited;

  const store = await getStoreBySlug(params.slug);
  const order = await getOrderById(params.orderId);
  if (!store || !order || order.storeId !== store.id) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }
  if (order.paymentMethod !== "qr" || order.status !== "pendiente") {
    return NextResponse.json({ error: "Este pedido ya no espera un pago" }, { status: 400 });
  }
  if (order.infinityOrderId || order.sipIdQr) {
    return NextResponse.json({ error: "Este pedido se confirma solo con el QR automático" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const receipt = body.receipt;
  if (typeof receipt !== "string" || !/^data:image\/(jpeg|png|webp);base64,/.test(receipt)) {
    return NextResponse.json({ error: "Sube una foto o captura del comprobante" }, { status: 400 });
  }
  if (receipt.length > MAX_RECEIPT_CHARS) {
    return NextResponse.json({ error: "La imagen es demasiado pesada" }, { status: 400 });
  }

  await saveOrderPaymentReceipt(order.id, receipt);
  return NextResponse.json({ ok: true });
}
