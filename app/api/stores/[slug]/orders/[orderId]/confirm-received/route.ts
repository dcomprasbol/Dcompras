import { NextRequest, NextResponse } from "next/server";
import { getStoreBySlug, getOrderById, updateOrderStatus } from "@/lib/repo";

// Endpoint público (sin login) para que el propio comprador confirme que le
// llegó su pedido, desde su link de seguimiento — el id del pedido (un UUID
// imposible de adivinar) es la única "credencial", igual que el resto del
// checkout público. Solo se puede confirmar un pedido que ya está 'enviado'
// — no se puede saltar directo de 'pendiente' a 'entregado' desde acá.
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

  if (order.status !== "enviado") {
    return NextResponse.json(
      { error: "Este pedido todavía no fue marcado como enviado" },
      { status: 400 }
    );
  }

  await updateOrderStatus(order.id, "entregado");

  return NextResponse.json({ ok: true });
}
