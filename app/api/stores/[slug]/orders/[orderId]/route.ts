import { NextRequest, NextResponse } from "next/server";
import { requireStoreAdmin } from "@/lib/auth";
import { getOrderById, updateOrderStatus, updateOrderEstimatedDelivery } from "@/lib/repo";
import { ORDER_STATUSES } from "@/lib/utils";

const VALID_STATUSES = ORDER_STATUSES.map((s) => s.value);

// Un pedido con QR no puede pasar a estos estados mientras siga 'pendiente'
// — primero tiene que quedar 'pagado' (por el webhook del gateway, o a mano
// si cayó al QR estático), y recién ahí el vendedor puede prepararlo o
// enviarlo. Contra entrega no entra acá: ese se paga al recibir, nunca
// antes, así que puede avanzar sin pasar por 'pagado'.
const REQUIRES_PAYMENT_FIRST = ["en_preparacion", "enviado", "entregado"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string; orderId: string } }
) {
  const store = await requireStoreAdmin(params.slug);
  if (!store) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { status, estimatedDelivery } = body;

  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    if (REQUIRES_PAYMENT_FIRST.includes(status)) {
      const order = await getOrderById(params.orderId);
      if (!order || order.storeId !== store.id) {
        return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
      }
      if (order.paymentMethod === "qr" && order.status === "pendiente") {
        return NextResponse.json(
          {
            error:
              "Este pedido todavía no está pagado. Confirma el pago antes de prepararlo o enviarlo.",
          },
          { status: 400 }
        );
      }
    }

    await updateOrderStatus(params.orderId, status);
  }

  // string vacío o null: el vendedor quiere borrar la fecha estimada.
  if (estimatedDelivery !== undefined) {
    await updateOrderEstimatedDelivery(params.orderId, estimatedDelivery || null);
  }

  return NextResponse.json({ ok: true });
}
