import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth";
import { createStoreWarning } from "@/lib/repo";

// Deja registrada una amonestación cada vez que el admin usa "Notificar al
// vendedor" desde un reporte — el link de WhatsApp en sí lo abre el propio
// navegador del admin (ReportsPanel), esto solo guarda la cuenta de
// advertencias por tienda.
export async function POST(
  req: NextRequest,
  { params }: { params: { storeId: string } }
) {
  const admin = await requirePlatformAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 300) || null : null;

  await createStoreWarning(params.storeId, note);
  return NextResponse.json({ ok: true });
}
