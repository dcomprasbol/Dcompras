import { NextRequest, NextResponse } from "next/server";
import { requireStoreAdmin } from "@/lib/auth";
import { setProductActive, updateProduct, getProductById, deleteProduct } from "@/lib/repo";
import { MAX_PRODUCT_IMAGES } from "@/lib/utils";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string; productId: string } }
) {
  const store = await requireStoreAdmin(params.slug);
  if (!store) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const product = await getProductById(params.productId);
  if (!product || product.storeId !== store.id) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  const body = await req.json();
  const { active, name, description, price, compareAtPrice, imageUrl, images } = body;
  const parsedImages: string[] | undefined = Array.isArray(images)
    ? images.filter((u: unknown) => typeof u === "string" && u).slice(0, MAX_PRODUCT_IMAGES)
    : undefined;

  if (active !== undefined) {
    await setProductActive(params.productId, Boolean(active));
  }

  const nextPrice = price !== undefined ? Number(price) : product.price;
  let nextCompareAtPrice: number | null | undefined;
  if (compareAtPrice !== undefined) {
    nextCompareAtPrice =
      compareAtPrice === null || compareAtPrice === "" ? null : Number(compareAtPrice);
    if (nextCompareAtPrice !== null && !(nextCompareAtPrice > nextPrice)) {
      return NextResponse.json(
        { error: "El precio de oferta debe ser mayor al precio actual" },
        { status: 400 }
      );
    }
  }

  await updateProduct(params.productId, {
    ...(name !== undefined ? { name } : {}),
    ...(description !== undefined ? { description: description || null } : {}),
    ...(price !== undefined ? { price: nextPrice } : {}),
    ...(nextCompareAtPrice !== undefined ? { compareAtPrice: nextCompareAtPrice } : {}),
    // Si viene "images" manda esa galería completa (y define la portada);
    // si no, se puede seguir mandando "imageUrl" suelto para no romper a
    // ningún otro caller que no conozca el campo nuevo.
    ...(parsedImages !== undefined ? { images: parsedImages } : imageUrl !== undefined ? { imageUrl: imageUrl || null } : {}),
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string; productId: string } }
) {
  const store = await requireStoreAdmin(params.slug);
  if (!store) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await deleteProduct(params.productId);

  return NextResponse.json({ ok: true });
}
