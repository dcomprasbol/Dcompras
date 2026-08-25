import { NextResponse } from "next/server";
import { isInfinityConfigured } from "@/lib/infinityPayments";
import { isSipConfigured } from "@/lib/sip";
import { commissionPercent } from "@/lib/commission";

// Endpoint público (sin auth, lo llama el checkout de cualquier tienda) que
// dice si el cobro automático de la plataforma está activo y qué comisión
// aplica — así el checkout puede mostrarle al comprador el total real
// (precio + comisión) ANTES de crear el pedido, en vez de sorprenderlo con
// un QR que pide más de lo que vio en pantalla. No expone ningún secreto,
// solo estos dos valores de configuración (ver lib/commission.ts).
export async function GET() {
  const platformApikeyServicio = process.env.SIP_APIKEY_SERVICIO;
  const autoQrEnabled = isInfinityConfigured() || Boolean(platformApikeyServicio && isSipConfigured());
  return NextResponse.json({ autoQrEnabled, commissionPercent: commissionPercent() });
}
