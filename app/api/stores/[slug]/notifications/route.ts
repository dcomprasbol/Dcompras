import { NextResponse } from "next/server";
import { requireStoreAdmin } from "@/lib/auth";
import { listStockNotificationsByStore } from "@/lib/repo";

// Para el panel del vendedor: quién dejó su contacto pidiendo que le avisen
// cuando haya stock (ver AddToCartForm → NotifyMeForm).
export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const store = await requireStoreAdmin(params.slug);
  if (!store) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const notifications = await listStockNotificationsByStore(store.id);
  return NextResponse.json({ notifications });
}
