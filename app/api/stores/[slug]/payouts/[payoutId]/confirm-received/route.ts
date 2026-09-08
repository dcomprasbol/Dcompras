import { NextRequest, NextResponse } from "next/server";
import { requireStoreAdmin } from "@/lib/auth";
import { confirmPayoutReceived } from "@/lib/repo";

// El propio vendedor confirma, desde su billetera, que la plata del
// comprobante que subió el admin le llegó de verdad — recién acá la
// liquidación queda cerrada ('pagado') en el sistema. Solo se puede
// confirmar una liquidación de la propia tienda que esté en 'transferido'.
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string; payoutId: string } }
) {
  const store = await requireStoreAdmin(params.slug);
  if (!store) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const ok = await confirmPayoutReceived(params.payoutId, store.id);
  if (!ok) {
    return NextResponse.json(
      { error: "Esa liquidación no existe o todavía no fue transferida" },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
