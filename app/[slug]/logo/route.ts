import { NextRequest, NextResponse } from "next/server";
import { getStoreBySlug } from "@/lib/repo";

// El logo de cada tienda como imagen con URL propia (/[slug]/logo). Los
// logos se guardan como data URL (base64) en la base, y eso no lo pueden
// leer WhatsApp/Facebook para la vista previa del link ni sirve bien como
// ícono de pestaña: necesitan una dirección http normal. Solo para tiendas
// aprobadas (las demás no son públicas).
export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const store = await getStoreBySlug(params.slug);
  if (!store || store.status !== "aprobada" || !store.logoUrl) {
    return new NextResponse("Not found", { status: 404 });
  }

  const match = store.logoUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
  if (!match) {
    // Logo guardado como URL externa: redirigimos a esa imagen.
    if (/^https?:\/\//i.test(store.logoUrl)) return NextResponse.redirect(store.logoUrl);
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(Buffer.from(match[2], "base64"), {
    headers: {
      "Content-Type": match[1],
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
