import { NextRequest, NextResponse } from "next/server";
import { commissionPercent, PAYMENT_FEE_LABEL } from "@/lib/commission";
import { isAutoQrEnabled } from "@/lib/paymentConfig";
import { getStoreBySlug } from "@/lib/repo";
import { listPickupPoints } from "@/lib/pickup";

// Endpoint público (sin auth, lo llama el checkout de cualquier tienda): si
// el cobro automático está activo, cuánto es el pago verificado, QUIÉN lo
// paga en esta tienda (?slug=) y qué Puntos Dcompras están disponibles —
// así el checkout muestra el total real ANTES de crear el pedido. No expone
// ningún secreto, solo configuración pública.
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  const store = slug ? await getStoreBySlug(slug) : null;
  const points = await listPickupPoints({ activeOnly: true });
  return NextResponse.json({
    autoQrEnabled: isAutoQrEnabled(),
    commissionPercent: commissionPercent(),
    feeLabel: PAYMENT_FEE_LABEL,
    commissionPayer: store?.commissionPayer ?? "comprador",
    pickupPoints: points.map((p) => ({
      id: p.id,
      name: p.name,
      city: p.city,
      address: p.address,
      reference: p.reference,
      hours: p.hours,
      fee: p.fee,
      freeDays: p.freeDays,
      dropoffDays: p.dropoffDays,
      lat: p.lat,
      lng: p.lng,
    })),
  });
}
