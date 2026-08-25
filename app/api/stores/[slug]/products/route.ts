import { NextRequest, NextResponse } from "next/server";
import { getStoreBySlug, listActiveProducts, createProduct } from "@/lib/repo";
import { requireStoreAdmin } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const store = await getStoreBySlug(params.slug);
  if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

  const products = await listActiveProducts(store.id);
  return NextResponse.json({ products });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const store = await requireStoreAdmin(params.slug);
  if (!store) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { name, description, price, compareAtPrice, imageUrl, variants } = body;

  if (!name || price === undefined || price === null) {
    return NextResponse.json(
      { error: "Nombre y precio son obligatorios" },
      { status: 400 }
    );
  }

  const parsedCompareAtPrice =
    compareAtPrice !== undefined && compareAtPrice !== null && compareAtPrice !== ""
      ? Number(compareAtPrice)
      : null;
  if (parsedCompareAtPrice !== null && !(parsedCompareAtPrice > Number(price))) {
    return NextResponse.json(
      { error: "El precio de oferta debe ser mayor al precio actual" },
      { status: 400 }
    );
  }

  const parsedVariants: { label: string; stock: number }[] =
    Array.isArray(variants) && variants.length > 0
      ? variants
          .filter((v: any) => v.label && v.label.trim())
          .map((v: any) => ({ label: v.label.trim(), stock: Number(v.stock) || 0 }))
      : [{ label: "Único", stock: Number(body.stock) || 0 }];

  const product = await createProduct({
    storeId: store.id,
    name,
    description: description || null,
    price: Number(price),
    compareAtPrice: parsedCompareAtPrice,
    imageUrl: imageUrl || null,
    variants: parsedVariants,
  });

  return NextResponse.json({ product });
}
