import { NextRequest, NextResponse } from "next/server";
import { requireStoreAdmin } from "@/lib/auth";
import { getPendingBalance, listPayoutsByStore, getStoreSalesStats } from "@/lib/repo";
import { commissionPercent } from "@/lib/commission";
import { isAutoQrEnabled } from "@/lib/paymentConfig";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const store = await requireStoreAdmin(params.slug);
  if (!store) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const [pending, payouts, stats] = await Promise.all([
    getPendingBalance(store.id),
    listPayoutsByStore(store.id),
    getStoreSalesStats(store.id),
  ]);

  return NextResponse.json({
    pending,
    payouts,
    commissionPercent: commissionPercent(),
    // La guía de la billetera lo usa para no prometer el QR automático si
    // no está activo.
    autoQrEnabled: isAutoQrEnabled(),
    commissionPayer: store.commissionPayer,
    stats,
  });
}
