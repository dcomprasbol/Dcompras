import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth";
import { listAllStores } from "@/lib/repo";

export async function GET() {
  const admin = await requirePlatformAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const stores = await listAllStores();
  return NextResponse.json({ stores });
}
