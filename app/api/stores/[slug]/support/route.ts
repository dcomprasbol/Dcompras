import { NextRequest, NextResponse } from "next/server";
import { requireStoreAdmin } from "@/lib/auth";
import { createSupportMessage, listSupportMessagesByStore } from "@/lib/repo";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const store = await requireStoreAdmin(params.slug);
  if (!store) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const messages = await listSupportMessagesByStore(store.id);
  return NextResponse.json({ messages });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const store = await requireStoreAdmin(params.slug);
  if (!store) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { subject, message } = body;

  if (!subject || !message) {
    return NextResponse.json(
      { error: "Asunto y mensaje son obligatorios" },
      { status: 400 }
    );
  }

  const created = await createSupportMessage({
    storeId: store.id,
    subject: String(subject).slice(0, 200),
    message: String(message).slice(0, 4000),
  });

  return NextResponse.json({ message: created });
}
