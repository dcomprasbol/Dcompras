import { NextRequest, NextResponse } from "next/server";
import { getStoreBySlug, getOrderById } from "@/lib/repo";

// Endpoint público (sin login) para que el checkout y la página de
// seguimiento consulten en vivo si el pago ya se confirmó — el id del
// pedido (un UUID imposible de adivinar) es la única "credencial", igual
// que confirm-received. Devuelve lo mínimo posible: nunca el nombre,
// teléfono o dirección del comprador, solo lo que hace falta para animar
// el estado del pago.
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; orderId: string } }
) {
  const store = await getStoreBySlug(params.slug);
  if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

  const order = await getOrderById(params.orderId);
  if (!order || order.storeId !== store.id) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ status: order.status, paidAt: order.paidAt });
}
