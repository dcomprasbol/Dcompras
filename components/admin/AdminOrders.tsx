"use client";

import { useEffect, useMemo, useState } from "react";
import { formatBs, ORDER_STATUSES, statusLabel, deliveryTypeLabel } from "@/lib/utils";
import { dropoffDeadline, pickupStatusLabel, whatsappNumber } from "@/lib/pickupRules";
import Icon, { Rating } from "@/components/Icon";

type OrderItem = {
  id: string;
  label: string;
  quantity: number;
  unitPrice: number;
};

type Order = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryType: string;
  deliveryLat: number | null;
  deliveryLng: number | null;
  paymentMethod: string;
  status: string;
  total: number;
  estimatedDelivery: string | null;
  rating: number | null;
  review: string | null;
  createdAt: string;
  paidAt: string | null;
  infinityOrderId: string | null;
  sipIdQr: string | null;
  reminderSentAt: string | null;
  paymentAmountUnique: number | null;
  paymentReceiptUrl: string | null;
  paymentReceiptAt: string | null;
  pickupPointId: string | null;
  pickupStatus: string | null;
  pickupDeadline: string | null;
  items: OrderItem[];
};

type PickupPointInfo = { id: string; name: string; address: string; city: string; hours: string; dropoffDays?: number };

const STATUS_COLORS: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  pagado: "bg-green-100 text-green-800",
  en_preparacion: "bg-blue-100 text-blue-800",
  enviado: "bg-gray-200 text-ink/70",
  entregado: "bg-emerald-100 text-emerald-800",
  recibido: "bg-jade-100 text-jade-700",
};

// Espejo de REQUIRES_PAYMENT_FIRST en
// app/api/stores/[slug]/orders/[orderId]/route.ts — acá es solo para
// deshabilitar el botón antes de gastar un roundtrip; el servidor es el que
// de verdad lo bloquea aunque alguien fuerce el fetch a mano.
const REQUIRES_PAYMENT_FIRST = ["en_preparacion", "enviado", "entregado"];
// En pedidos con retiro en Punto Dcompras, "Enviado" y "Entregado" los
// marca el encargado del punto (al recibir y al entregar), no el vendedor.
const PICKUP_MANAGED = ["enviado", "entregado"];

// "Por cobrar": pedidos con QR sin pagar hace más de 1 hora (y menos de 7
// días: más viejos ya no vale la pena recordar).
const REMIND_AFTER_MS = 60 * 60 * 1000;
const REMIND_UNTIL_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_DROPOFF_DAYS = 2;

function orderCode(id: string) {
  return id.slice(-6).toUpperCase();
}

function isCoordinated(o: Order) {
  return o.paymentMethod === "qr" && !o.infinityOrderId && !o.sipIdQr;
}

export default function AdminOrders({ slug }: { slug: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [points, setPoints] = useState<PickupPointInfo[]>([]);
  const [storeName, setStoreName] = useState("");
  const [loading, setLoading] = useState(true);
  const [estimatedDrafts, setEstimatedDrafts] = useState<Record<string, string>>({});
  const [savingEstimate, setSavingEstimate] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [justChangedId, setJustChangedId] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  async function loadOrders() {
    setLoading(true);
    const [ordersRes, cfg, storeRes] = await Promise.all([
      fetch(`/api/stores/${slug}/orders`).then((r) => r.json()),
      fetch(`/api/platform/payment-config?slug=${encodeURIComponent(slug)}`).then((r) => r.json()).catch(() => ({})),
      fetch(`/api/stores/${slug}`).then((r) => r.json()).catch(() => ({})),
    ]);
    setOrders(ordersRes.orders || []);
    setPoints(cfg.pickupPoints || []);
    setStoreName(storeRes.store?.name || "");
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, [slug]);

  const toCollect = useMemo(
    () =>
      orders.filter((o) => {
        if (o.paymentMethod !== "qr" || o.status !== "pendiente") return false;
        const age = now - new Date(o.createdAt).getTime();
        return age >= REMIND_AFTER_MS && age <= REMIND_UNTIL_MS;
      }),
    [orders, now]
  );

  // Ventas recuperadas este mes: pedidos que se pagaron DESPUÉS de mandarles
  // el recordatorio.
  const recovered = useMemo(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    return orders
      .filter(
        (o) =>
          o.reminderSentAt &&
          o.paidAt &&
          new Date(o.paidAt) > new Date(o.reminderSentAt) &&
          new Date(o.paidAt) >= monthStart
      )
      .reduce((s, o) => s + Number(o.total), 0);
  }, [orders]);

  async function updateStatus(orderId: string, status: string) {
    const previous = orders.find((o) => o.id === orderId)?.status;
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    const res = await fetch(`/api/stores/${slug}/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      // El servidor rechazó el cambio (ej: pedido con QR todavía no pagado)
      // — deshacemos el update optimista y avisamos por qué.
      const data = await res.json().catch(() => ({}));
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: previous! } : o)));
      window.alert(data.error || "No se pudo cambiar el estado del pedido");
      return;
    }
    if (status === "pagado") {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, paidAt: o.paidAt ?? new Date().toISOString() } : o)));
    }
    // Confirma visualmente que el cambio de estado se guardó de verdad
    // (no solo el update optimista) — el badge pulsa un instante.
    setJustChangedId(orderId);
    setTimeout(() => setJustChangedId(null), 400);
  }

  function sendReminder(order: Order) {
    const link = `${window.location.origin}/${slug}/pedido/${order.id}`;
    const items = order.items.map((i) => `${i.quantity}x ${i.label}`).join(", ");
    const amount = order.paymentAmountUnique ?? order.total;
    const msg =
      `Hola ${order.customerName.split(" ")[0]} 👋 Tu pedido #${orderCode(order.id)} en ${storeName || "nuestra tienda"} ` +
      `(${items}, ${formatBs(amount)}) todavía está esperando el pago. Puedes completarlo aquí: ${link}\n` +
      `Si tienes alguna duda, escríbeme por aquí 🙂`;
    window.open(`https://wa.me/${whatsappNumber(order.customerPhone)}?text=${encodeURIComponent(msg)}`, "_blank");
    const sentAt = new Date().toISOString();
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, reminderSentAt: sentAt } : o)));
    fetch(`/api/stores/${slug}/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reminderSent: true }),
    });
  }

  async function confirmCoordinatedPayment(order: Order) {
    const ok = window.confirm(
      `¿Ya revisaste en la app de tu banco que entraron ${formatBs(order.paymentAmountUnique ?? order.total)}?\n\nUna captura se puede editar: confirma solo si viste el dinero en tu cuenta.`
    );
    if (ok) await updateStatus(order.id, "pagado");
  }

  async function saveEstimatedDelivery(orderId: string) {
    const value = estimatedDrafts[orderId] ?? "";
    setSavingEstimate(orderId);
    try {
      await fetch(`/api/stores/${slug}/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estimatedDelivery: value }),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, estimatedDelivery: value || null } : o))
      );
    } finally {
      setSavingEstimate(null);
    }
  }

  function copyTrackingLink(orderId: string) {
    const url = `${window.location.origin}/${slug}/pedido/${orderId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(orderId);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }

  if (loading) return <p className="text-sm text-ink/50">Cargando pedidos...</p>;
  if (orders.length === 0)
    return <p className="text-sm text-ink/50">Todavía no recibiste pedidos.</p>;

  return (
    <div className="space-y-3">
      {(toCollect.length > 0 || recovered > 0) && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-ink">
              <Icon name="bell" className="mr-1.5 h-4 w-4" />
              Por cobrar {toCollect.length > 0 && <span className="text-amber-700">({toCollect.length})</span>}
            </h2>
            {recovered > 0 && (
              <span className="rounded-full bg-jade-500 px-2.5 py-1 text-[11px] font-bold text-white">
                Este mes recuperaste {formatBs(recovered)} con recordatorios
              </span>
            )}
          </div>
          {toCollect.length > 0 ? (
            <>
              <p className="mt-1 text-xs text-ink/55">
                Pedidos que tu cliente armó pero todavía no pagó. Un recordatorio amable recupera muchas de estas ventas.
              </p>
              <div className="mt-3 space-y-2">
                {toCollect.map((o) => (
                  <div key={o.id} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">
                        #{orderCode(o.id)} · {o.customerName}
                      </p>
                      <p className="text-xs text-ink/50">
                        {formatBs(o.paymentAmountUnique ?? o.total)} · hace {timeAgo(now - new Date(o.createdAt).getTime())}
                        {o.reminderSentAt && (
                          <span className="text-jade-700"> · recordado {timeAgo(now - new Date(o.reminderSentAt).getTime())} atrás</span>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => sendReminder(o)}
                      className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                        o.reminderSentAt ? "border border-ink/15 text-ink/60" : "bg-green-500 text-white hover:bg-green-600"
                      }`}
                    >
                      {o.reminderSentAt ? "Recordar otra vez" : "Recordar por WhatsApp"}
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-1 text-xs text-ink/55">No tienes pedidos sin pagar pendientes de recordar.</p>
          )}
        </div>
      )}

      {orders.map((order) => {
        const coordinated = isCoordinated(order) && order.status === "pendiente";
        const point = order.pickupPointId ? points.find((p) => p.id === order.pickupPointId) : null;
        const isPickup = Boolean(order.pickupPointId);
        return (
        <div key={order.id} className="animate-pop rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-ink">
                #{orderCode(order.id)} · {order.customerName}
              </p>
              <p className="text-xs text-ink/50">
                {order.customerPhone} · {deliveryTypeLabel(order.deliveryType)}: {order.customerAddress}
              </p>
              {order.deliveryLat != null && order.deliveryLng != null && (
                <a
                  href={`https://www.google.com/maps?q=${order.deliveryLat},${order.deliveryLng}`}
                  target="_blank"
                  className="text-xs font-medium text-jade-600 underline"
                >
                  <Icon name="pin" className="mr-1 h-3.5 w-3.5" />Ver ubicación en el mapa
                </a>
              )}
              <p className="text-xs text-ink/40">
                {new Date(order.createdAt).toLocaleString("es-BO")}
              </p>
            </div>
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[order.status]} ${
                justChangedId === order.id ? "animate-confirm-pulse" : ""
              }`}
            >
              {order.paymentReceiptAt && order.status === "pendiente" ? "Pago por verificar" : statusLabel(order.status)}
            </span>
          </div>

          <div className="mb-2 space-y-0.5 border-t border-ink/5 pt-2 text-sm text-ink/70">
            {order.items.map((item) => (
              <p key={item.id}>
                {item.quantity}x {item.label} · {formatBs(item.unitPrice * item.quantity)}
              </p>
            ))}
          </div>

          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-ink/50">
              Pago:{" "}
              {order.paymentMethod === "qr" ? (isCoordinated(order) ? "QR coordinado" : "QR automático") : "Contra entrega"}
            </span>
            <span className="font-bold text-jade-600">{formatBs(order.total)}</span>
          </div>

          {/* Pago coordinado: qué buscar en el banco y el comprobante del comprador. */}
          {coordinated && (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-semibold text-amber-800">Busca en tu banco esta transferencia:</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-white p-2">
                  <p className="text-[10px] uppercase tracking-wide text-ink/40">Monto exacto</p>
                  <p className="font-mono text-base font-bold text-ink">{formatBs(order.paymentAmountUnique ?? order.total)}</p>
                </div>
                <div className="rounded-lg bg-white p-2">
                  <p className="text-[10px] uppercase tracking-wide text-ink/40">Glosa</p>
                  <p className="font-mono text-base font-bold text-ink">{orderCode(order.id)}</p>
                </div>
              </div>
              {order.paymentReceiptUrl ? (
                <div className="mt-3 flex gap-3">
                  <a href={order.paymentReceiptUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={order.paymentReceiptUrl}
                      alt="Comprobante que subió el cliente"
                      className="h-24 w-24 cursor-zoom-in rounded-lg border border-ink/10 object-cover"
                    />
                  </a>
                  <div className="text-xs text-ink/60">
                    <p className="font-semibold text-ink">Tu cliente subió su comprobante.</p>
                    <p className="mt-1 text-coral-600">
                      <Icon name="alert" mono className="mr-1 h-3.5 w-3.5" />
                      Antes de enviar, confirma en tu app del banco que el dinero llegó. Las capturas se pueden falsificar.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-xs text-amber-800/80">
                  Cuando tu cliente pague, puede subir su comprobante desde su seguimiento y lo verás aquí.
                </p>
              )}
              <button
                type="button"
                onClick={() => confirmCoordinatedPayment(order)}
                className="mt-3 w-full rounded-lg bg-jade-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-jade-600"
              >
                Ya lo vi en mi banco: marcar como pagado
              </button>
            </div>
          )}

          {/* Retiro en Punto Dcompras: a dónde llevarlo y hasta cuándo. */}
          {isPickup && (
            <div className="mb-3 rounded-xl border border-ink/10 bg-paper p-3 text-xs text-ink/70">
              <p className="font-semibold text-ink">
                <Icon name="pin" className="mr-1 h-3.5 w-3.5" />
                Retiro en Punto Dcompras{point ? `: ${point.name}` : ""}
                <span className="ml-1.5 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-ink/60">
                  {pickupStatusLabel(order.pickupStatus)}
                </span>
              </p>
              {order.pickupStatus === "esperando_vendedor" &&
                (order.paidAt || order.paymentMethod !== "qr" ? (
                  <>
                    <p className="mt-1">
                      Lleva el paquete
                      {point ? ` a ${point.address}, ${point.city} (${point.hours})` : " al punto"} antes del{" "}
                      <span className="font-semibold text-ink">
                        {dropoffDeadline(order.paidAt ?? order.createdAt, point?.dropoffDays ?? DEFAULT_DROPOFF_DAYS).toLocaleDateString("es-BO", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </span>
                      .
                    </p>
                    <p className="mt-1">
                      Escribe en el paquete: <span className="font-mono font-bold text-ink">#{orderCode(order.id)} · {order.customerName}</span>
                    </p>
                  </>
                ) : (
                  <p className="mt-1">Cuando el pedido esté pagado, lo llevas al punto.</p>
                ))}
              {order.pickupStatus === "en_punto" && <p className="mt-1">El punto ya lo recibió. Le avisamos al cliente para que lo retire.</p>}
              {order.pickupStatus === "devuelto" && <p className="mt-1">No lo retiraron a tiempo: pasa a recogerlo por el punto.</p>}
            </div>
          )}

          <div className="mb-3 flex flex-wrap gap-1.5">
            {ORDER_STATUSES.map((s) => {
              const blockedByPayment =
                order.paymentMethod === "qr" &&
                order.status === "pendiente" &&
                REQUIRES_PAYMENT_FIRST.includes(s.value);
              const blockedByPickup = isPickup && PICKUP_MANAGED.includes(s.value);
              const blocked = blockedByPayment || blockedByPickup;
              return (
                <button
                  key={s.value}
                  onClick={() => updateStatus(order.id, s.value)}
                  disabled={blocked}
                  title={
                    blockedByPickup
                      ? "Lo marca el Punto Dcompras al recibir y entregar el paquete"
                      : blockedByPayment
                        ? "Este pedido todavía no está pagado"
                        : undefined
                  }
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                    order.status === s.value
                      ? "border-jade-500 bg-jade-50 text-jade-600"
                      : blocked
                        ? "cursor-not-allowed border-ink/10 text-ink/25"
                        : "border-ink/15 text-ink/50"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          {order.paymentMethod === "qr" && order.status === "pendiente" && !coordinated && (
            <p className="mb-3 -mt-2 text-xs text-amber-600">
              <Icon name="clock" mono className="mr-1 h-3.5 w-3.5" />Esperando confirmación de pago. No se puede preparar ni enviar todavía.
            </p>
          )}
          {order.status === "recibido" && (order.rating || order.review) && (
            <div className="mb-3 border-t border-ink/5 pt-3">
              {order.rating && (
                <p className="text-sm text-ink">
                  <Rating value={order.rating} />
                </p>
              )}
              {order.review && <p className="mt-1 text-sm text-ink/60">"{order.review}"</p>}
            </div>
          )}

          {/* El cliente ve esto en su link de seguimiento apenas el pedido
              está "Enviado" — no es obligatorio, pero le da confianza. */}
          <div className="flex flex-wrap items-center gap-2 border-t border-ink/5 pt-3">
            {!isPickup && (
              <>
                <label className="text-xs font-medium text-ink/60">Llega estimado el</label>
                <input
                  type="date"
                  value={estimatedDrafts[order.id] ?? order.estimatedDelivery ?? ""}
                  onChange={(e) =>
                    setEstimatedDrafts((prev) => ({ ...prev, [order.id]: e.target.value }))
                  }
                  className="rounded-lg border border-ink/15 px-2 py-1 text-xs"
                />
                <button
                  onClick={() => saveEstimatedDelivery(order.id)}
                  disabled={savingEstimate === order.id}
                  className="rounded-lg border border-ink/15 px-2.5 py-1 text-xs font-medium text-ink/60 transition hover:border-ink/30 disabled:opacity-50"
                >
                  {savingEstimate === order.id ? "..." : "Guardar"}
                </button>
              </>
            )}
            <button
              onClick={() => copyTrackingLink(order.id)}
              className={`ml-auto rounded-lg border border-ink/15 px-2.5 py-1 text-xs font-medium text-ink/60 transition hover:border-ink/30 ${
                copiedId === order.id ? "animate-confirm-pulse border-jade-400 text-jade-600" : ""
              }`}
            >
              {copiedId === order.id ? (
                <>
                  ¡Copiado! <Icon name="check" mono className="ml-1 h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  <Icon name="link" className="mr-1 h-3.5 w-3.5" />
                  Copiar link de seguimiento
                </>
              )}
            </button>
          </div>
        </div>
        );
      })}
    </div>
  );
}

function timeAgo(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  return `${d} día${d === 1 ? "" : "s"}`;
}
