import { NextRequest, NextResponse } from "next/server";
import { requireStoreAdmin } from "@/lib/auth";
import { getPendingBalance, listPayoutsByStore } from "@/lib/repo";
import { commissionPercent } from "@/lib/commission";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const store = await requireStoreAdmin(params.slug);
  if (!store) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const [pending, payouts] = await Promise.all([
    getPendingBalance(store.id),
    listPayoutsByStore(store.id),
  ]);

  return NextResponse.json({ pending, payouts, commissionPercent: commissionPercent() });
}
