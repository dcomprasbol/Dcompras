import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth";
import { listPendingPayoutRequests } from "@/lib/repo";

// Liquidaciones que un vendedor pidió (ver POST /api/stores/[slug]/payouts)
// y siguen esperando que el admin transfiera y confirme — ver
// app/api/platform/payouts/[payoutId]/confirm/route.ts para ese paso.
export async function GET() {
  const admin = await requirePlatformAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const pending = await listPendingPayoutRequests();
  return NextResponse.json({ pending });
}
