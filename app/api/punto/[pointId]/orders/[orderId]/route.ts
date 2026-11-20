import { NextRequest, NextResponse } from "next/server";
import { requirePickupOperator } from "@/lib/auth";
import { getOrderById } from "@/lib/repo";
import { handOverAtPoint, PickupError, receiveAtPoint, returnToSeller } from "@/lib/pickup";
import { amountToCollect } from "@/lib/pickupRules";
import { imageErrorResponse, persistImage } from "@/lib/storage";

// Acciones del encargado del punto sobre un pedido:
//   { action: "receive", photo }        → recibe el paquete del vendedor (foto obligatoria)
//   { action: "handover", code, photo?} → lo entrega al comprador con su código
//   { action: "return" }                → lo devuelve al vendedor (no lo retiraron)
export async function POST(
  req: NextRequest,
  { params }: { params: { pointId: string; orderId: string } }
) {
  const access = await requirePickupOperator(params.pointId);
  if (!access) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json().catch(() => ({}));

  try {
    if (body.action === "receive") {
      if (typeof body.photo !== "string" || !body.photo.startsWith("data:image/")) {
        return NextResponse.json({ error: "Saca una foto del paquete para registrar la recepción" }, { status: 400 });
      }
      const photoUrl = (await persistImage(body.photo, "pickup")) as string;
      const result = await receiveAtPoint(params.orderId, access.point, access.email, photoUrl);
      return NextResponse.json({ ok: true, ...result });
    }

    if (body.action === "handover") {
      const order = await getOrderById(params.orderId);
      if (!order) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
      // Lo que se cobra lo calcula el servidor (servicio + custodia por
      // atraso), nunca lo que mande el navegador.
      const due = amountToCollect(order.pickupFee ?? access.point.fee, access.point.storageFeePerDay, order.pickupDeadline);
      const photoUrl =
        typeof body.photo === "string" && body.photo.startsWith("data:image/")
          ? ((await persistImage(body.photo, "pickup")) as string)
          : null;
      await handOverAtPoint(params.orderId, access.point, access.email, String(body.code ?? ""), due.total, photoUrl);
      return NextResponse.json({ ok: true, collected: due.total });
    }

    if (body.action === "return") {
      await returnToSeller(params.orderId, access.point);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  } catch (err) {
    if (err instanceof PickupError) return NextResponse.json({ error: err.message }, { status: 400 });
    return imageErrorResponse(err);
  }
}
