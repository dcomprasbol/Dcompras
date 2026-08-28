import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth";
import { confirmPayout } from "@/lib/repo";

// El admin de plataforma marca una liquidación solicitada como pagada,
// adjuntando el comprobante (imagen y/o referencia de la transferencia real
// que hizo a mano — ver components/platform/PayoutsPanel.tsx).
export async function POST(
  req: NextRequest,
  { params }: { params: { payoutId: string } }
) {
  const admin = await requirePlatformAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { reference, receiptImageUrl } = body;

  try {
    const payout = await confirmPayout(params.payoutId, {
      reference: reference || null,
      receiptImageUrl: receiptImageUrl || null,
    });
    return NextResponse.json({ payout });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "No se pudo confirmar la liquidación" },
      { status: 400 }
    );
  }
}
