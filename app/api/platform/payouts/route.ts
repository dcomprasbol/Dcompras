import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth";
import { listStoresPendingPayouts, createPayout } from "@/lib/repo";

export async function GET() {
  const admin = await requirePlatformAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const pending = await listStoresPendingPayouts();
  return NextResponse.json({ pending });
}

// Registra una liquidación que YA se hizo a mano (transferencia bancaria
// real fuera del sistema) — junta los pedidos pagados-y-no-liquidados de la
// tienda y los marca como incluidos, con el comprobante como referencia.
export async function POST(req: NextRequest) {
  const admin = await requirePlatformAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { storeId, reference } = body;
  if (!storeId) {
    return NextResponse.json({ error: "Falta storeId" }, { status: 400 });
  }

  try {
    const payout = await createPayout(storeId, reference || null);
    return NextResponse.json({ payout });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "No se pudo registrar la liquidación" },
      { status: 400 }
    );
  }
}
