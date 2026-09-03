"use client";

import { useEffect, useState } from "react";
import { formatBs, ORDER_STATUSES, statusLabel, deliveryTypeLabel } from "@/lib/utils";

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
  items: OrderItem[];
};

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

export default function AdminOrders({ slug }: { slug: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [estimatedDrafts, setEstimatedDrafts] = useState<Record<string, string>>({});
  const [savingEstimate, setSavingEstimate] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [justChangedId, setJustChangedId] = useState<string | null>(null);

  async function loadOrders() {
    setLoading(true);
    const res = await fetch(`/api/stores/${slug}/orders`);
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, [slug]);

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
    // Confirma visualmente que el cambio de estado se guardó de verdad
    // (no solo el update optimista) — el badge pulsa un instante.
    setJustChangedId(orderId);
    setTimeout(() => setJustChangedId(null), 400);
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
      {orders.map((order) => (
        <div key={order.id} className="animate-pop rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-ink">
                #{order.id.slice(-6).toUpperCase()} · {order.customerName}
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
                  📍 Ver ubicación en el mapa
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
              {statusLabel(order.status)}
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
              {order.paymentMethod === "qr" ? "QR" : "Contra entrega"}
            </span>
            <span className="font-bold text-jade-600">{formatBs(order.total)}</span>
          </div>

          <div className="mb-3 flex flex-wrap gap-1.5">
            {ORDER_STATUSES.map((s) => {
              const blocked =
                order.paymentMethod === "qr" &&
                order.status === "pendiente" &&
                REQUIRES_PAYMENT_FIRST.includes(s.value);
              return (
                <button
                  key={s.value}
                  onClick={() => updateStatus(order.id, s.value)}
                  disabled={blocked}
                  title={blocked ? "Este pedido todavía no está pagado" : undefined}
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
          {order.paymentMethod === "qr" && order.status === "pendiente" && (
            <p className="mb-3 -mt-2 text-xs text-amber-600">
              ⏳ Esperando confirmación de pago. No se puede preparar ni enviar todavía.
            </p>
          )}
          {order.status === "recibido" && (order.rating || order.review) && (
            <div className="mb-3 border-t border-ink/5 pt-3">
              {order.rating && (
                <p className="text-sm text-amber-500">
                  {"★".repeat(order.rating)}
                  <span className="text-ink/15">{"★".repeat(5 - order.rating)}</span>
                </p>
              )}
              {order.review && <p className="mt-1 text-sm text-ink/60">"{order.review}"</p>}
            </div>
          )}

          {/* El cliente ve esto en su link de seguimiento apenas el pedido
              está "Enviado" — no es obligatorio, pero le da confianza. */}
          <div className="flex flex-wrap items-center gap-2 border-t border-ink/5 pt-3">
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
            <button
              onClick={() => copyTrackingLink(order.id)}
              className={`ml-auto rounded-lg border border-ink/15 px-2.5 py-1 text-xs font-medium text-ink/60 transition hover:border-ink/30 ${
                copiedId === order.id ? "animate-confirm-pulse border-jade-300 text-jade-600" : ""
              }`}
            >
              {copiedId === order.id ? "¡Copiado! ✓" : "🔗 Copiar link de seguimiento"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
