import { NextRequest, NextResponse } from "next/server";
import { getStoreBySlug, getProductById, createStockNotification } from "@/lib/repo";

// Endpoint público (sin login) para "avisame cuando haya stock" — el
// comprador deja un contacto desde una talla/variante agotada. El vendedor
// los ve en su panel de productos (GET /api/stores/[slug]/notifications).
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string; productId: string } }
) {
  const store = await getStoreBySlug(params.slug);
  if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

  const product = await getProductById(params.productId);
  if (!product || product.storeId !== store.id) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const contact = String(body?.contact || "").trim();
  const variantId = body?.variantId ? String(body.variantId) : null;

  if (!contact) {
    return NextResponse.json({ error: "Deja un WhatsApp o email de contacto" }, { status: 400 });
  }
  if (variantId && !product.variants.some((v) => v.id === variantId)) {
    return NextResponse.json({ error: "Variante inválida" }, { status: 400 });
  }

  await createStockNotification({
    storeId: store.id,
    productId: product.id,
    variantId,
    contact,
  });

  return NextResponse.json({ ok: true });
}
