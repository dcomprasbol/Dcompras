import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth";
import { updateSupportMessageStatus } from "@/lib/repo";

const VALID_STATUSES = ["abierto", "resuelto"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { messageId: string } }
) {
  const admin = await requirePlatformAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { status } = body;
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  await updateSupportMessageStatus(params.messageId, status);
  return NextResponse.json({ ok: true });
}
