import { NextRequest, NextResponse } from "next/server";
import { getStoreBySlug, getProductById, getOrderById, createReport } from "@/lib/repo";
import { PRODUCT_REPORT_REASONS, ORDER_REPORT_REASONS } from "@/lib/utils";

const VALID_REASONS = [...PRODUCT_REPORT_REASONS, ...ORDER_REPORT_REASONS].map((r) => r.value);

// Endpoint público (sin login): cualquiera puede reportar un producto
// (ilegal, sospechoso) o un pedido puntual (no llegó, defectuoso) — ver
// ReportButton. Nunca bloquea nada, solo deja el reporte para que el admin
// de plataforma lo revise en /plataforma (ReportsPanel).
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const store = await getStoreBySlug(params.slug);
  if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { productId, orderId, reason, message, contact } = body;

  if (!VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: "Motivo inválido" }, { status: 400 });
  }
  if (!productId && !orderId) {
    return NextResponse.json({ error: "Falta indicar qué se reporta" }, { status: 400 });
  }

  // Validamos que lo que se reporta sea de verdad de ESTA tienda — evita
  // que alguien arme un reporte contra un producto/pedido de otra tienda
  // mandando el slug equivocado a propósito.
  if (productId) {
    const product = await getProductById(productId);
    if (!product || product.storeId !== store.id) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }
  }
  if (orderId) {
    const order = await getOrderById(orderId);
    if (!order || order.storeId !== store.id) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }
  }

  await createReport({
    storeId: store.id,
    productId: productId || null,
    orderId: orderId || null,
    reason,
    message: typeof message === "string" ? message.trim().slice(0, 500) || null : null,
    reporterContact: typeof contact === "string" ? contact.trim().slice(0, 200) || null : null,
  });

  return NextResponse.json({ ok: true });
}
