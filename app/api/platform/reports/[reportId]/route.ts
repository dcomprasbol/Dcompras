import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth";
import { updateReportStatus } from "@/lib/repo";

const VALID_STATUSES = ["abierto", "revisado", "descartado"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { reportId: string } }
) {
  const admin = await requirePlatformAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { status } = body;
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  await updateReportStatus(params.reportId, status);
  return NextResponse.json({ ok: true });
}
