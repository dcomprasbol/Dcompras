// Punto Dcompras: acceso a datos de los puntos de retiro, sus encargados y
// el recorrido del paquete (vendedor lo deja → encargado lo recibe con foto
// → comprador lo retira con su código). Reglas puras en lib/pickupRules.ts.

import { sql, dbReady, newId, nowISO } from "@/lib/db";
import { getOrderById, updateOrderStatus, type Order } from "@/lib/repo";
import { addBusinessDays, generatePickupCode } from "@/lib/pickupRules";

export type PickupPoint = {
  id: string;
  name: string;
  city: string;
  address: string;
  reference: string | null;
  lat: number;
  lng: number;
  hours: string;
  fee: number;
  freeDays: number;
  storageFeePerDay: number;
  dropoffDays: number;
  active: boolean;
  createdAt: string;
};

export type PickupPointInput = Omit<PickupPoint, "id" | "createdAt">;

export async function listPickupPoints(opts: { activeOnly?: boolean } = {}): Promise<PickupPoint[]> {
  await dbReady;
  return opts.activeOnly
    ? sql<PickupPoint[]>`SELECT * FROM pickup_points WHERE active ORDER BY city, name`
    : sql<PickupPoint[]>`SELECT * FROM pickup_points ORDER BY active DESC, city, name`;
}

export async function getPickupPoint(id: string): Promise<PickupPoint | null> {
  await dbReady;
  const rows = await sql<PickupPoint[]>`SELECT * FROM pickup_points WHERE id = ${id}`;
  return rows[0] ?? null;
}

export async function createPickupPoint(input: PickupPointInput): Promise<PickupPoint> {
  await dbReady;
  const id = newId();
  await sql`
    INSERT INTO pickup_points (id, name, city, address, reference, lat, lng, hours, fee, free_days,
      storage_fee_per_day, dropoff_days, active, created_at)
    VALUES (${id}, ${input.name}, ${input.city}, ${input.address}, ${input.reference}, ${input.lat}, ${input.lng},
      ${input.hours}, ${input.fee}, ${input.freeDays}, ${input.storageFeePerDay}, ${input.dropoffDays},
      ${input.active}, ${nowISO()})
  `;
  return (await getPickupPoint(id))!;
}

export async function updatePickupPoint(id: string, input: PickupPointInput): Promise<void> {
  await dbReady;
  await sql`
    UPDATE pickup_points SET name = ${input.name}, city = ${input.city}, address = ${input.address},
      reference = ${input.reference}, lat = ${input.lat}, lng = ${input.lng}, hours = ${input.hours},
      fee = ${input.fee}, free_days = ${input.freeDays}, storage_fee_per_day = ${input.storageFeePerDay},
      dropoff_days = ${input.dropoffDays}, active = ${input.active}
    WHERE id = ${id}
  `;
}

// ---------- Encargados ----------

export async function listOperators(pointId: string): Promise<string[]> {
  await dbReady;
  const rows = await sql<{ email: string }[]>`
    SELECT email FROM pickup_operators WHERE point_id = ${pointId} ORDER BY email
  `;
  return rows.map((r) => r.email);
}

/** Reemplaza la lista de encargados de un punto (correos en minúscula). */
export async function setOperators(pointId: string, emails: string[]): Promise<void> {
  await dbReady;
  const clean = Array.from(new Set(emails.map((e) => e.trim().toLowerCase()).filter((e) => /.+@.+\..+/.test(e))));
  await sql.begin(async (tx) => {
    await tx`DELETE FROM pickup_operators WHERE point_id = ${pointId}`;
    for (const email of clean) {
      await tx`INSERT INTO pickup_operators (email, point_id, created_at) VALUES (${email}, ${pointId}, ${nowISO()})`;
    }
  });
}

export async function listPointsForOperator(email: string): Promise<PickupPoint[]> {
  await dbReady;
  return sql<PickupPoint[]>`
    SELECT p.* FROM pickup_points p
    JOIN pickup_operators o ON o.point_id = p.id
    WHERE o.email = ${email.toLowerCase()}
    ORDER BY p.name
  `;
}

export async function isOperatorOf(email: string, pointId: string): Promise<boolean> {
  await dbReady;
  const rows = await sql`
    SELECT 1 FROM pickup_operators WHERE email = ${email.toLowerCase()} AND point_id = ${pointId}
  `;
  return rows.length > 0;
}

// ---------- Pedidos en el punto ----------

export type PickupOrder = Order & { storeName: string; storeWhatsapp: string; storeSlug: string };

/** Pedidos de un punto que importan al encargado (sin los ya cerrados hace más de 7 días). */
export async function listPickupOrders(pointId: string): Promise<PickupOrder[]> {
  await dbReady;
  const rows = await sql<{ id: string; storeName: string; storeWhatsapp: string; storeSlug: string }[]>`
    SELECT o.id, s.name AS store_name, s.whatsapp AS store_whatsapp, s.slug AS store_slug
    FROM orders o JOIN stores s ON s.id = o.store_id
    WHERE o.pickup_point_id = ${pointId}
      AND (
        o.pickup_status IN ('esperando_vendedor', 'en_punto')
        OR COALESCE(o.pickup_picked_up_at, o.pickup_returned_at)::timestamptz >= now() - interval '7 days'
      )
    ORDER BY o.created_at DESC
    LIMIT 300
  `;
  const out: PickupOrder[] = [];
  for (const r of rows) {
    const order = await getOrderById(r.id);
    if (order) out.push({ ...order, storeName: r.storeName, storeWhatsapp: r.storeWhatsapp, storeSlug: r.storeSlug });
  }
  return out;
}

export class PickupError extends Error {}

/**
 * El encargado recibe el paquete del vendedor: queda la foto como evidencia,
 * se genera el código de retiro y arranca el plazo gratis de custodia. El
 * pedido pasa a "enviado" para el comprador y el vendedor.
 */
export async function receiveAtPoint(
  orderId: string,
  point: PickupPoint,
  operatorEmail: string,
  photoUrl: string
): Promise<{ code: string; deadline: string }> {
  const order = await getOrderById(orderId);
  if (!order || order.pickupPointId !== point.id) throw new PickupError("Este pedido no es de este punto");
  if (order.pickupStatus !== "esperando_vendedor") throw new PickupError("Este pedido ya fue recibido");
  if (!order.paidAt && order.paymentMethod === "qr") {
    throw new PickupError("Este pedido todavía no está pagado: no lo recibas hasta que el vendedor confirme el pago");
  }
  const code = generatePickupCode();
  const deadline = addBusinessDays(new Date(), point.freeDays).toISOString();
  const updated = await sql`
    UPDATE orders SET pickup_status = 'en_punto', pickup_code = ${code}, pickup_received_at = ${nowISO()},
      pickup_received_by = ${operatorEmail}, pickup_intake_photo = ${photoUrl}, pickup_deadline = ${deadline}
    WHERE id = ${orderId} AND pickup_status = 'esperando_vendedor'
    RETURNING id
  `;
  if (updated.length === 0) throw new PickupError("Este pedido ya fue recibido");
  if (["pendiente", "pagado", "en_preparacion"].includes(order.status)) {
    await updateOrderStatus(orderId, "enviado");
  }
  return { code, deadline };
}

/**
 * El comprador retira: tiene que dar el código correcto. Queda registrado
 * quién entregó, cuánto se cobró y (opcional) una foto. El pedido pasa a
 * "entregado"; el comprador después confirma "recibido" como siempre.
 */
export async function handOverAtPoint(
  orderId: string,
  point: PickupPoint,
  operatorEmail: string,
  code: string,
  collectedAmount: number,
  photoUrl: string | null
): Promise<void> {
  const order = await getOrderById(orderId);
  if (!order || order.pickupPointId !== point.id) throw new PickupError("Este pedido no es de este punto");
  if (order.pickupStatus !== "en_punto") throw new PickupError("Este pedido no está en custodia");
  if (!order.pickupCode || code.trim() !== order.pickupCode) {
    throw new PickupError("El código no coincide. Pídele al comprador el código de 4 dígitos de su seguimiento.");
  }
  const updated = await sql`
    UPDATE orders SET pickup_status = 'retirado', pickup_picked_up_at = ${nowISO()},
      pickup_delivered_by = ${operatorEmail}, pickup_collected_amount = ${collectedAmount},
      pickup_handover_photo = ${photoUrl}
    WHERE id = ${orderId} AND pickup_status = 'en_punto'
    RETURNING id
  `;
  if (updated.length === 0) throw new PickupError("Este pedido ya fue entregado");
  await updateOrderStatus(orderId, "entregado");
}

/** Nadie lo retiró a tiempo: el vendedor se lleva el paquete de vuelta. */
export async function returnToSeller(orderId: string, point: PickupPoint): Promise<void> {
  const order = await getOrderById(orderId);
  if (!order || order.pickupPointId !== point.id) throw new PickupError("Este pedido no es de este punto");
  if (order.pickupStatus !== "en_punto") throw new PickupError("Solo se puede devolver un paquete que está en custodia");
  await sql`
    UPDATE orders SET pickup_status = 'devuelto', pickup_returned_at = ${nowISO()}
    WHERE id = ${orderId} AND pickup_status = 'en_punto'
  `;
}
