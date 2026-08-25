import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth";
import { listAllSupportMessages } from "@/lib/repo";

export async function GET() {
  const admin = await requirePlatformAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const messages = await listAllSupportMessages();
  return NextResponse.json({ messages });
}
