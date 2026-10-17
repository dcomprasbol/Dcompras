import { NextRequest, NextResponse } from "next/server";
import { getProductById, getStoreById } from "@/lib/repo";

// Foto de portada de un producto como imagen con URL propia. Las fotos
// subidas se guardan como data URL (base64, ~180 KB cada una) dentro de la
// base: meterlas en el HTML de un listado de muchas tiendas lo volvería
// pesadísimo. Con esta ruta el navegador las pide aparte, de a una, con
// carga diferida y caché. Solo productos activos de tiendas aprobadas.
export async function GET(_req: NextRequest, { params }: { params: { productId: string } }) {
  const product = await getProductById(params.productId);
  if (!product || !product.active || !product.imageUrl) return new NextResponse("Not found", { status: 404 });
  const store = await getStoreById(product.storeId);
  if (!store || store.status !== "aprobada" || store.deletedAt) return new NextResponse("Not found", { status: 404 });

  const match = product.imageUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
  if (!match) {
    if (/^https?:\/\//i.test(product.imageUrl)) return NextResponse.redirect(product.imageUrl);
    return new NextResponse("Not found", { status: 404 });
  }
  return new NextResponse(Buffer.from(match[2], "base64"), {
    headers: {
      "Content-Type": match[1],
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
