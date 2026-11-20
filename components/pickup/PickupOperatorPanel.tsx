"use client";

// Panel del encargado del Punto Dcompras, pensado para usarse con el
// celular en el mostrador:
//   1. Por recibir: el vendedor trae el paquete → foto obligatoria → queda en custodia.
//   2. En custodia: el comprador viene → dicta su código de 4 dígitos → se cobra el servicio → entregado.
//      Si se pasó el plazo, se puede devolver al vendedor.
//   3. Historial: lo entregado/devuelto en los últimos 7 días.
// El encargado NUNCA ve el código de retiro: lo tiene que dar el comprador
// (así nadie puede retirar un paquete ajeno sabiendo solo el nombre).

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "@/components/Icon";
import { fileToResizedDataUrl, formatBs } from "@/lib/utils";
import { amountToCollect, daysOverdue, whatsappNumber } from "@/lib/pickupRules";

type Point = {
  id: string;
  name: string;
  city: string;
  address: string;
  hours: string;
  fee: number;
  storageFeePerDay: number;
};

type PickupOrder = {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  storeName: string;
  storeWhatsapp: string;
  storeSlug: string;
  paid: boolean;
  paymentMethod: string;
  pickupStatus: string;
  pickupFee: number | null;
  pickupDeadline: string | null;
  pickupReceivedAt: string | null;
  pickupReceivedBy: string | null;
  pickupIntakePhoto: string | null;
  pickupPickedUpAt: string | null;
  pickupCollectedAmount: number | null;
  pickupReturnedAt: string | null;
  createdAt: string;
  items: { label: string; quantity: number }[];
};

type Tab = "recibir" | "custodia" | "historial";
type Modal = { kind: "receive" | "handover"; order: PickupOrder } | null;

function fmt(iso: string) {
  return new Date(iso).toLocaleString("es-BO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function PickupOperatorPanel({ points, email }: { points: Point[]; email: string }) {
  const [pointId, setPointId] = useState(points[0]?.id ?? "");
  const point = points.find((p) => p.id === pointId) ?? points[0];
  const [orders, setOrders] = useState<PickupOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("recibir");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!pointId) return;
    setLoading(true);
    const d = await fetch(`/api/punto/${pointId}/orders`).then((r) => r.json()).catch(() => ({}));
    setOrders(d.orders || []);
    setLoading(false);
  }, [pointId]);

  useEffect(() => {
    load();
  }, [load]);

  const byTab = useMemo(() => {
    const q = query.trim().toUpperCase();
    const match = (o: PickupOrder) =>
      !q || o.code.includes(q.replace("#", "")) || o.customerName.toUpperCase().includes(q) || o.storeName.toUpperCase().includes(q);
    return {
      recibir: orders.filter((o) => o.pickupStatus === "esperando_vendedor" && match(o)),
      custodia: orders.filter((o) => o.pickupStatus === "en_punto" && match(o)),
      historial: orders.filter((o) => (o.pickupStatus === "retirado" || o.pickupStatus === "devuelto") && match(o)),
    };
  }, [orders, query]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function doReturn(o: PickupOrder) {
    if (!window.confirm(`¿El vendedor de ${o.storeName} ya se llevó el paquete #${o.code}?`)) return;
    const res = await fetch(`/api/punto/${pointId}/orders/${o.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "return" }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) return window.alert(d.error || "No se pudo registrar");
    showToast(`#${o.code} devuelto al vendedor`);
    load();
  }

  if (!point) return null;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "recibir", label: "Por recibir", count: byTab.recibir.length },
    { key: "custodia", label: "En custodia", count: byTab.custodia.length },
    { key: "historial", label: "Historial", count: byTab.historial.length },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-4">
      {/* Punto */}
      <div className="rounded-2xl bg-ink p-4 text-white">
        <p className="text-[11px] font-bold uppercase tracking-wider text-jade-400">Punto Dcompras</p>
        {points.length > 1 ? (
          <select
            value={pointId}
            onChange={(e) => setPointId(e.target.value)}
            className="mt-1 w-full rounded-lg bg-white/10 px-2 py-1.5 text-base font-bold text-white"
          >
            {points.map((p) => (
              <option key={p.id} value={p.id} className="text-ink">
                {p.name} · {p.city}
              </option>
            ))}
          </select>
        ) : (
          <p className="mt-0.5 text-lg font-bold">{point.name}</p>
        )}
        <p className="mt-0.5 text-xs text-white/60">
          {point.address}, {point.city} · {point.hours}
        </p>
        <p className="mt-2 text-[11px] text-white/40">Encargado: {email}</p>
      </div>

      {/* Buscar */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por código de pedido (#A1B2C3), cliente o tienda"
        className="mt-4 w-full rounded-xl border border-ink/15 bg-white px-3 py-3 text-sm"
      />

      {/* Pestañas */}
      <div className="mt-3 grid grid-cols-3 gap-1 rounded-2xl border border-ink/5 bg-white p-1 shadow-sm">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-xl py-2.5 text-sm font-semibold transition ${tab === t.key ? "bg-ink text-white" : "text-ink/60"}`}
          >
            {t.label}
            {t.count > 0 && <span className={`ml-1 ${tab === t.key ? "text-jade-400" : "text-ink/40"}`}>({t.count})</span>}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {loading && <p className="text-sm text-ink/50">Cargando...</p>}

        {!loading && tab === "recibir" && (
          <>
            <p className="text-xs text-ink/50">
              Cuando el vendedor traiga un paquete: búscalo por su código, revisa que esté cerrado y saca una foto.
            </p>
            {byTab.recibir.length === 0 && <Empty text="No hay paquetes por recibir." />}
            {byTab.recibir.map((o) => (
              <OrderCard key={o.id} order={o}>
                {o.paid || o.paymentMethod !== "qr" ? (
                  <button
                    type="button"
                    onClick={() => setModal({ kind: "receive", order: o })}
                    className="w-full rounded-xl bg-jade-500 px-4 py-3 text-sm font-bold text-white"
                  >
                    <Icon name="box" mono className="mr-1.5 h-4 w-4" />
                    Recibir paquete (con foto)
                  </button>
                ) : (
                  <p className="rounded-xl bg-amber-50 px-3 py-2 text-center text-xs font-semibold text-amber-800">
                    Todavía no está pagado: no lo recibas.
                  </p>
                )}
              </OrderCard>
            ))}
          </>
        )}

        {!loading && tab === "custodia" && (
          <>
            <p className="text-xs text-ink/50">
              Cuando venga el comprador: pídele su código de 4 dígitos (está en su seguimiento) y su nombre.
            </p>
            {byTab.custodia.length === 0 && <Empty text="No hay paquetes en custodia." />}
            {byTab.custodia.map((o) => {
              const due = amountToCollect(o.pickupFee ?? point.fee, point.storageFeePerDay, o.pickupDeadline);
              const overdue = o.pickupDeadline ? daysOverdue(o.pickupDeadline) : 0;
              const trackUrl = typeof window !== "undefined" ? `${window.location.origin}/${o.storeSlug}/pedido/${o.id}` : "";
              const buyerMsg =
                `Hola ${o.customerName.split(" ")[0]} 👋 Tu pedido #${o.code} de ${o.storeName} ya está en el ${point.name} ` +
                `(${point.address}, ${point.hours}). Tu código de retiro está en tu seguimiento: ${trackUrl}\n` +
                `Al retirar pagas ${formatBs(due.total)}.`;
              return (
                <OrderCard key={o.id} order={o}>
                  <div
                    className={`mb-2 flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs ${
                      overdue > 0 ? "bg-coral-50 text-coral-600" : "bg-paper text-ink/60"
                    }`}
                  >
                    <span>
                      {o.pickupDeadline &&
                        (overdue > 0
                          ? `Venció hace ${overdue} día${overdue === 1 ? "" : "s"} · custodia ${formatBs(due.storage)}`
                          : `Retiro gratis hasta ${fmt(o.pickupDeadline)}`)}
                    </span>
                    <span className="shrink-0 font-bold text-ink">Cobrar {formatBs(due.total)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={`https://wa.me/${whatsappNumber(o.customerPhone)}?text=${encodeURIComponent(buyerMsg)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-green-500 px-3 py-2.5 text-center text-xs font-bold text-green-700"
                    >
                      Avisar al comprador
                    </a>
                    <button
                      type="button"
                      onClick={() => setModal({ kind: "handover", order: o })}
                      className="rounded-xl bg-ink px-3 py-2.5 text-xs font-bold text-white"
                    >
                      Entregar con código
                    </button>
                  </div>
                  {overdue > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <a
                        href={`https://wa.me/${whatsappNumber(o.storeWhatsapp)}?text=${encodeURIComponent(
                          `Hola, el pedido #${o.code} (${o.customerName}) no se retiró a tiempo del ${point.name}. Puedes pasar a recogerlo en ${point.address} (${point.hours}).`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl border border-ink/15 px-3 py-2 text-center text-xs font-semibold text-ink/70"
                      >
                        Avisar al vendedor
                      </a>
                      <button
                        type="button"
                        onClick={() => doReturn(o)}
                        className="rounded-xl border border-coral-500 px-3 py-2 text-xs font-semibold text-coral-600"
                      >
                        Devuelto al vendedor
                      </button>
                    </div>
                  )}
                </OrderCard>
              );
            })}
          </>
        )}

        {!loading && tab === "historial" && (
          <>
            {byTab.historial.length === 0 && <Empty text="Sin movimientos en los últimos 7 días." />}
            {byTab.historial.map((o) => (
              <OrderCard key={o.id} order={o}>
                <p className="text-xs text-ink/60">
                  {o.pickupStatus === "retirado"
                    ? `Entregado ${o.pickupPickedUpAt ? fmt(o.pickupPickedUpAt) : ""} · cobrado ${formatBs(o.pickupCollectedAmount ?? 0)}`
                    : `Devuelto al vendedor ${o.pickupReturnedAt ? fmt(o.pickupReturnedAt) : ""}`}
                </p>
              </OrderCard>
            ))}
          </>
        )}
      </div>

      <AnimatePresence>
        {modal && (
          <ActionModal
            key={modal.order.id + modal.kind}
            modal={modal}
            point={point}
            onClose={() => setModal(null)}
            onDone={(msg) => {
              setModal(null);
              showToast(msg);
              load();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-xl bg-jade-500 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed border-ink/15 bg-white p-6 text-center text-sm text-ink/50">{text}</p>;
}

function OrderCard({ order: o, children }: { order: PickupOrder; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start gap-3">
        {o.pickupIntakePhoto && (
          <a href={o.pickupIntakePhoto} target="_blank" rel="noopener noreferrer" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={o.pickupIntakePhoto} alt="Foto de recepción" className="h-16 w-16 rounded-lg border border-ink/10 object-cover" />
          </a>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-mono text-lg font-bold text-ink">#{o.code}</p>
          <p className="text-sm font-semibold text-ink">{o.customerName}</p>
          <p className="text-xs text-ink/50">
            Tienda: {o.storeName} · {o.items.reduce((s, i) => s + i.quantity, 0)} artículo(s)
          </p>
          {o.pickupReceivedAt && (
            <p className="text-[11px] text-ink/40">
              Recibido {fmt(o.pickupReceivedAt)} por {o.pickupReceivedBy}
            </p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function ActionModal({
  modal,
  point,
  onClose,
  onDone,
}: {
  modal: NonNullable<Modal>;
  point: Point;
  onClose: () => void;
  onDone: (msg: string) => void;
}) {
  const o = modal.order;
  const [photo, setPhoto] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const due = amountToCollect(o.pickupFee ?? point.fee, point.storageFeePerDay, o.pickupDeadline);

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setPhoto(await fileToResizedDataUrl(file));
    } catch (err: any) {
      setError(err?.message || "No se pudo leer la foto");
    }
  }

  async function submit() {
    setError(null);
    if (modal.kind === "receive" && !photo) return setError("Saca la foto del paquete primero");
    if (modal.kind === "handover" && !/^\d{4}$/.test(code)) return setError("El código tiene 4 dígitos");
    setBusy(true);
    try {
      const res = await fetch(`/api/punto/${point.id}/orders/${o.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          modal.kind === "receive" ? { action: "receive", photo } : { action: "handover", code, photo }
        ),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d.error || "No se pudo registrar");
        return;
      }
      onDone(
        modal.kind === "receive"
          ? `#${o.code} recibido. Avísale al comprador desde «En custodia».`
          : `#${o.code} entregado. Cobraste ${formatBs(d.collected ?? due.total)}.`
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40 }}
        animate={{ y: 0 }}
        exit={{ y: 40 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl bg-white p-5 sm:rounded-3xl"
      >
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink/40">
              {modal.kind === "receive" ? "Recibir del vendedor" : "Entregar al comprador"}
            </p>
            <p className="font-mono text-xl font-bold text-ink">#{o.code}</p>
            <p className="text-sm text-ink/70">
              {o.customerName} · {o.storeName}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-ink/40" aria-label="Cerrar">
            <Icon name="x" mono className="h-5 w-5" />
          </button>
        </div>

        {modal.kind === "receive" && (
          <ol className="mb-3 space-y-1 text-xs text-ink/60">
            <li>1. Revisa que el paquete esté cerrado y tenga escrito «#{o.code}».</li>
            <li>2. Saca una foto donde se vea el paquete y el código.</li>
          </ol>
        )}

        {modal.kind === "handover" && (
          <>
            <div className="mb-3 rounded-xl bg-paper p-3 text-center">
              <p className="text-[11px] uppercase tracking-wide text-ink/40">Cobrar al comprador</p>
              <p className="font-mono text-2xl font-bold text-ink">{formatBs(due.total)}</p>
              {due.storage > 0 && (
                <p className="text-[11px] text-ink/50">
                  Servicio {formatBs(due.fee)} + custodia {formatBs(due.storage)} ({due.overdueDays} día{due.overdueDays === 1 ? "" : "s"} de atraso)
                </p>
              )}
            </div>
            <label className="mb-1 block text-xs font-semibold text-ink/70" htmlFor="pickup-code">
              Código de retiro que te dicta el comprador
            </label>
            <input
              id="pickup-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              autoComplete="off"
              placeholder="• • • •"
              className="mb-3 w-full rounded-xl border-2 border-ink/15 px-3 py-3 text-center font-mono text-3xl font-bold tracking-[0.5em] focus:border-jade-500 focus:outline-none"
            />
          </>
        )}

        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink/20 px-3 py-3 text-sm font-semibold text-ink/70">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="Foto" className="h-28 w-full rounded-lg object-cover" />
          ) : (
            <>
              <Icon name="spark" className="h-4 w-4" />
              {modal.kind === "receive" ? "Sacar foto del paquete (obligatoria)" : "Foto de la entrega (opcional)"}
            </>
          )}
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhoto} />
        </label>
        {photo && (
          <button type="button" onClick={() => setPhoto(null)} className="mt-1 w-full text-center text-xs text-ink/50">
            Sacar otra foto
          </button>
        )}

        {error && <p className="mt-3 text-center text-sm text-coral-600">{error}</p>}

        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="mt-4 w-full rounded-xl bg-jade-500 px-4 py-3.5 text-base font-bold text-white disabled:opacity-50"
        >
          {busy ? "Guardando..." : modal.kind === "receive" ? "Confirmar recepción" : `Cobré ${formatBs(due.total)} y entregué`}
        </button>
      </motion.div>
    </motion.div>
  );
}
