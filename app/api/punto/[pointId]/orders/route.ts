import { NextRequest, NextResponse } from "next/server";
import { requirePickupOperator } from "@/lib/auth";
import { listPickupOrders } from "@/lib/pickup";

// Pedidos de un Punto Dcompras, para su encargado (/punto). No incluye el
// comprobante de pago del comprador ni otros datos que el punto no necesita.
export async function GET(req: NextRequest, { params }: { params: { pointId: string } }) {
  const access = await requirePickupOperator(params.pointId);
  if (!access) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const orders = await listPickupOrders(params.pointId);
  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      code: o.id.slice(-6).toUpperCase(),
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      storeName: o.storeName,
      storeWhatsapp: o.storeWhatsapp,
      storeSlug: o.storeSlug,
      status: o.status,
      paymentMethod: o.paymentMethod,
      paid: Boolean(o.paidAt),
      paidAt: o.paidAt,
      pickupStatus: o.pickupStatus,
      pickupFee: o.pickupFee,
      pickupDeadline: o.pickupDeadline,
      pickupReceivedAt: o.pickupReceivedAt,
      pickupReceivedBy: o.pickupReceivedBy,
      pickupIntakePhoto: o.pickupIntakePhoto,
      pickupPickedUpAt: o.pickupPickedUpAt,
      pickupCollectedAmount: o.pickupCollectedAmount,
      pickupReturnedAt: o.pickupReturnedAt,
      createdAt: o.createdAt,
      items: o.items.map((i) => ({ label: i.label, quantity: i.quantity })),
    })),
  });
}
