import { NextRequest, NextResponse } from "next/server";
import { getStoreBySlug, getOrderById, confirmOrderReceived } from "@/lib/repo";

// Endpoint público (sin login) para que el propio comprador confirme que le
// llegó su pedido, desde su link de seguimiento — el id del pedido (un UUID
// imposible de adivinar) es la única "credencial", igual que el resto del
// checkout público. Solo se puede confirmar un pedido que el vendedor ya
// marcó como 'entregado' — no se puede saltar directo desde otro estado.
// Calificación (1-5) y comentario son opcionales.
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string; orderId: string } }
) {
  const store = await getStoreBySlug(params.slug);
  if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

  const order = await getOrderById(params.orderId);
  if (!order || order.storeId !== store.id) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  if (order.status !== "entregado") {
    return NextResponse.json(
      { error: "Este pedido todavía no fue marcado como entregado" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const ratingRaw = body?.rating;
  const rating =
    typeof ratingRaw === "number" && Number.isInteger(ratingRaw) && ratingRaw >= 1 && ratingRaw <= 5
      ? ratingRaw
      : null;
  const review = typeof body?.review === "string" && body.review.trim() ? body.review.trim().slice(0, 500) : null;

  const ok = await confirmOrderReceived(order.id, { rating, review });
  if (!ok) {
    return NextResponse.json(
      { error: "Este pedido todavía no fue marcado como entregado" },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
