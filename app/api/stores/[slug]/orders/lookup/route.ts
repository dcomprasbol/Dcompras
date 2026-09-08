import { NextRequest, NextResponse } from "next/server";
import { getStoreBySlug, listOrdersByPhone } from "@/lib/repo";

// Endpoint público (sin login), pensado para /[slug]/mi-pedido: un comprador
// que hizo el pedido como invitado y perdió el link de seguimiento (cerró la
// pestaña, cambió de celular, etc.) escribe el teléfono que usó al pedir y
// acá le devolvemos sus últimos pedidos en ESTA tienda para que entre al
// seguimiento de cualquiera. Nunca devolvemos nombre, dirección ni teléfono
// — nada que no supiera ya el propio comprador — solo lo justo para que
// reconozca cuál pedido es cuál.
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const store = await getStoreBySlug(params.slug);
  if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const phone = typeof body.phone === "string" ? body.phone : "";
  if (phone.replace(/\D/g, "").length < 6) {
    return NextResponse.json({ error: "Ingresa el teléfono que usaste al hacer el pedido" }, { status: 400 });
  }

  const orders = await listOrdersByPhone(store.id, phone);
  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      code: o.id.slice(-6).toUpperCase(),
      createdAt: o.createdAt,
      status: o.status,
      total: o.total,
      paymentMethod: o.paymentMethod,
    })),
  });
}
