import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth";
import { updateStoreStatus } from "@/lib/repo";
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
