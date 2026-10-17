import { NextRequest, NextResponse } from "next/server";
import { requireStoreAdmin, getCurrentUser } from "@/lib/auth";
import { softDeleteStore } from "@/lib/repo";
import { SELLER_CLOSE_PHRASE, SELLER_CLOSE_REASONS } from "@/lib/utils";
import { sendStoreClosedBySellerEmail } from "@/lib/email";

// El vendedor cierra (elimina) su propia tienda desde su panel. Igual que en
// GitHub: tiene que escribir la frase dos veces, y antes contesta por qué se
// va (encuesta que ve el admin). Es un soft-delete (ver softDeleteStore):
// la tienda desaparece del público y el slug queda libre, así el mismo
// correo puede crear otra tienda cuando quiera; los datos de ventas quedan
// para que Dcompras le liquide lo pendiente.
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const store = await requireStoreAdmin(params.slug);
  if (!store || store.deletedAt) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const norm = (v: unknown) => (typeof v === "string" ? v.trim().toLowerCase() : "");
  if (norm(body.confirm1) !== SELLER_CLOSE_PHRASE || norm(body.confirm2) !== SELLER_CLOSE_PHRASE) {
    return NextResponse.json(
      { error: `Escribe "${SELLER_CLOSE_PHRASE}" en los dos campos para confirmar.` },
      { status: 400 }
    );
  }
  if (!SELLER_CLOSE_REASONS.some((r) => r.value === body.reason)) {
    return NextResponse.json({ error: "Elige un motivo." }, { status: 400 });
  }
  const detail = typeof body.detail === "string" ? body.detail.trim().slice(0, 1000) : "";
  if (body.reason === "otro" && detail.length < 3) {
    return NextResponse.json({ error: "Cuéntanos el motivo." }, { status: 400 });
  }

  await softDeleteStore(store.id, { by: "vendedor", reason: body.reason, note: detail || null });

  const user = await getCurrentUser();
  if (user?.email) await sendStoreClosedBySellerEmail(user.email, store.name.trim());

  return NextResponse.json({ ok: true });
}
