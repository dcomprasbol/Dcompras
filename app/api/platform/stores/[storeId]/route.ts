import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth";
import { updateStoreStatus, softDeleteStore } from "@/lib/repo";
import { STORE_STATUSES } from "@/lib/utils";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { storeId: string } }
) {
  const admin = await requirePlatformAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { status, note } = body;

  if (!STORE_STATUSES.some((s) => s.value === status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }
  await updateStoreStatus(params.storeId, status, note ?? null);

  return NextResponse.json({ ok: true });
}

// Borrado de moderación (no confundir con el DELETE de
// /api/stores/[slug], que es el propio vendedor rechazado empezando de
// cero). Este es soft-delete — ver softDeleteStore en lib/repo.ts. Pide la
// misma frase de confirmación DOS VECES que ya validó el modal del lado
// del cliente (DeleteStoreModal) — se vuelve a chequear acá porque nunca
// hay que confiar solo en la validación del navegador para una acción tan
// destructiva.
const CONFIRM_PHRASE = "D_compras_delete";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { storeId: string } }
) {
  const admin = await requirePlatformAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (body.confirm1 !== CONFIRM_PHRASE || body.confirm2 !== CONFIRM_PHRASE) {
    return NextResponse.json({ error: "Confirmación incorrecta" }, { status: 400 });
  }

  await softDeleteStore(params.storeId);
  return NextResponse.json({ ok: true });
}
