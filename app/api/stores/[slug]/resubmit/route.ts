import { NextRequest, NextResponse } from "next/server";
import { requireStoreAdmin } from "@/lib/auth";
import { resubmitStoreForReview } from "@/lib/repo";

// El dueño de una tienda rechazada pide una "segunda revisión": vuelve a la
// cola de aprobación de /plataforma sin tener que recrear todo de cero.
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const store = await requireStoreAdmin(params.slug);
  if (!store) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (store.status !== "rechazada") {
    return NextResponse.json(
      { error: "Solo se puede pedir una nueva revisión si la tienda fue rechazada" },
      { status: 400 }
    );
  }

  const ok = await resubmitStoreForReview(store.id);
  if (!ok) {
    return NextResponse.json({ error: "No se pudo enviar a revisión" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
