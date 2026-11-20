import { NextRequest, NextResponse } from "next/server";
import { requireStoreAdmin } from "@/lib/auth";
import { requestPayout } from "@/lib/repo";

// El vendedor agenda su liquidación desde su "billetera" (AdminEarnings) —
// junta todo su saldo pagado-y-no-liquidado en una solicitud que el admin
// de plataforma va a ver en /plataforma y confirmar con un comprobante.
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const store = await requireStoreAdmin(params.slug);
  if (!store) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Las liquidaciones se pagan al QR del vendedor: sin QR cargado no hay
  // cómo transferirle, así que no se puede agendar (aunque tenga datos
  // bancarios). Mejor frenar acá con un mensaje claro que dejar la
  // solicitud varada en /plataforma.
  if (!store.paymentQrImageUrl) {
    return NextResponse.json(
      { error: "Carga tu QR en «Datos y cobros» antes de agendar una liquidación: ahí te pagamos." },
      { status: 400 }
    );
  }

  try {
    const payout = await requestPayout(store.id);
    return NextResponse.json({ payout });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "No se pudo agendar la liquidación" },
      { status: 400 }
    );
  }
}
