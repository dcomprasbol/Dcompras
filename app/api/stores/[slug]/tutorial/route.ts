import { NextRequest, NextResponse } from "next/server";
import { requireStoreAdmin } from "@/lib/auth";
import { markTutorialSeen } from "@/lib/repo";

// El vendedor terminó (o cerró después de empezar) el tutorial de bienvenida.
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const store = await requireStoreAdmin(params.slug);
  if (!store) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  await markTutorialSeen(store.id);
  return NextResponse.json({ ok: true });
}
