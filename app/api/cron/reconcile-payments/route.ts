import { NextRequest, NextResponse } from "next/server";
import { listStalePendingQrOrders, updateOrderStatus } from "@/lib/repo";
import { getPaymentStatus, InfinityError } from "@/lib/infinityPayments";
import { calculateCommission } from "@/lib/commission";

// Red de respaldo del webhook de Infinity: pasó dos veces que un pedido
// quedó pagado del lado de ellos pero "pendiente" para nosotros porque el
// webhook nunca llegó — una vez por una URL de callback vieja, otra porque
// el pago se confirmó como "manual-admin" desde SU panel, que no dispara
// ningún webhook. En vez de depender 100% de que la notificación llegue,
// este cron pregunta activamente por cada pedido QR pendiente hace rato.
//
// Programado en vercel.json. Protegido con CRON_SECRET (Vercel se lo manda
// solo si la variable de entorno CRON_SECRET está seteada — ver
// https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs).
const OLDER_THAN_MINUTES = 10;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  const pending = await listStalePendingQrOrders(OLDER_THAN_MINUTES);
  const results: Array<{ orderId: string; result: string }> = [];

  for (const order of pending) {
    if (!order.infinityOrderId) continue;
    try {
      const remote = await getPaymentStatus(order.infinityOrderId);
      if (remote.status !== "paid") {
        results.push({ orderId: order.id, result: `sigue ${remote.status}` });
        continue;
      }

      // Mismo chequeo de integridad que el webhook: el monto pagado tiene
      // que calzar con precio + comisión, si no queda para revisión manual.
      const { totalToCharge } = calculateCommission(order.total, true);
      if (Math.abs(remote.amount - totalToCharge) > 0.01) {
        console.error(
          `Reconciliación: pedido ${order.id} pagado en Infinity por ${remote.amount}, se esperaba ${totalToCharge} — no se marca solo.`
        );
        results.push({ orderId: order.id, result: "monto no calza, revisar a mano" });
        continue;
      }

      await updateOrderStatus(order.id, "pagado");
      results.push({ orderId: order.id, result: "marcado pagado" });
    } catch (err) {
      const msg = err instanceof InfinityError ? err.message : String(err);
      results.push({ orderId: order.id, result: `error consultando: ${msg}` });
    }
  }

  return NextResponse.json({ checked: pending.length, results });
}
