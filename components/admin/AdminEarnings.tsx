"use client";

import { useEffect, useState } from "react";
import { formatBs } from "@/lib/utils";

type Pending = { grossAmount: number; commissionAmount: number; netAmount: number; orderCount: number };
type SalesReportProduct = { label: string; quantity: number; total: number };
type SalesReport = { grossAmount: number; orderCount: number; products: SalesReportProduct[] };

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}
function firstDayOfMonthISODate(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
type Payout = {
  id: string;
  periodStart: string;
  periodEnd: string;
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  status: "solicitado" | "transferido" | "pagado" | string;
  reference: string | null;
  receiptImageUrl: string | null;
  paidAt: string | null;
  confirmedAt: string | null;
  createdAt: string;
};

export default function AdminEarnings({ slug }: { slug: string }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [commissionPercent, setCommissionPercent] = useState(1);
  const [hasBankInfo, setHasBankInfo] = useState(true);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justRequested, setJustRequested] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [reportFrom, setReportFrom] = useState(firstDayOfMonthISODate());
  const [reportTo, setReportTo] = useState(todayISODate());
  const [report, setReport] = useState<SalesReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  async function load() {
    const [earningsRes, storeRes] = await Promise.all([
      fetch(`/api/stores/${slug}/earnings`).then((r) => r.json()),
      fetch(`/api/stores/${slug}`).then((r) => r.json()),
    ]);
    setPending(earningsRes.pending);
    setPayouts(earningsRes.payouts || []);
    setCommissionPercent(earningsRes.commissionPercent ?? 1);
    setHasBankInfo(Boolean(storeRes.store?.bankAccountNumber || storeRes.store?.paymentQrImageUrl));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [slug]);

  const hasRequestedPayout = payouts.some(
    (p) => p.status === "solicitado" || p.status === "transferido"
  );

  async function handleViewReport() {
    setReportError(null);
    setReportLoading(true);
    try {
      const res = await fetch(
        `/api/stores/${slug}/earnings/report?from=${reportFrom}&to=${reportTo}`
      );
      const data = await res.json();
      if (!res.ok) {
        setReportError(data.error || "No se pudo generar el reporte");
        setReport(null);
        return;
      }
      setReport(data.report);
    } catch {
      setReportError("Error de conexión");
    } finally {
      setReportLoading(false);
    }
  }

  async function handleRequestPayout() {
    setError(null);
    setRequesting(true);
    try {
      const res = await fetch(`/api/stores/${slug}/payouts`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo agendar la liquidación");
        return;
      }
      await load();
      setJustRequested(true);
      setTimeout(() => setJustRequested(false), 500);
    } finally {
      setRequesting(false);
    }
  }

  // El vendedor mira el comprobante y confirma que de verdad le llegó la
  // plata — recién ahí la liquidación pasa a "Pagado" en el historial. Sin
  // este paso, cerrar la liquidación dependía solo de que el admin dijera
  // que transfirió.
  async function handleConfirmReceived(payoutId: string) {
    if (!window.confirm("¿Confirmás que ya te llegó esta plata a tu cuenta o QR?")) return;
    setConfirmingId(payoutId);
    try {
      const res = await fetch(`/api/stores/${slug}/payouts/${payoutId}/confirm-received`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        window.alert(data.error || "No se pudo confirmar");
        return;
      }
      await load();
    } finally {
      setConfirmingId(null);
    }
  }

  if (loading) return <p className="text-sm text-ink/50">Cargando...</p>;

  const requested = payouts.filter((p) => p.status === "solicitado");
  const transferred = payouts.filter((p) => p.status === "transferido");
  const paid = payouts.filter((p) => p.status === "pagado");

  return (
    <div className="space-y-5">
      {!hasBankInfo && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          📋 Todavía no cargaste tu QR: sin eso no podés agendar una liquidación.{" "}
          <span className="font-medium">Agrégalo en la pestaña Cuenta.</span>
        </div>
      )}

      {/* La "billetera": saldo disponible + botón para agendar. */}
      <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
        <h2 className="mb-1 text-sm font-bold text-ink">Tu billetera</h2>
        <p className="mb-3 text-xs text-ink/50">
          Por cada venta pagada con QR automático, Dcompras le suma {commissionPercent}% al
          comprador: a vos te llega el 100% de tu precio, sin descuentos. Nada de comisión en
          pedidos contra entrega, esos nunca pasan por Dcompras.
        </p>
        {pending && pending.orderCount > 0 ? (
          <div className={`rounded-xl bg-paper p-3.5 ${justRequested ? "animate-confirm-pulse" : ""}`}>
            <p className="font-mono text-2xl font-bold text-jade-600">
              {formatBs(pending.netAmount)}
            </p>
            <p className="mt-1 text-xs text-ink/50">
              {pending.orderCount} pedido{pending.orderCount === 1 ? "" : "s"} sin liquidar ·
              Comisión que pagó el comprador (no se te descuenta): {formatBs(pending.commissionAmount)}
            </p>
            <button
              onClick={handleRequestPayout}
              disabled={requesting || !hasBankInfo || hasRequestedPayout}
              className="mt-3 w-full rounded-xl bg-jade-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-jade-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {requesting
                ? "Agendando..."
                : hasRequestedPayout
                  ? "Ya tenés una liquidación en camino"
                  : "Agendar liquidación"}
            </button>
            {error && <p className="mt-2 text-xs text-coral-600">{error}</p>}
          </div>
        ) : (
          <p className="text-sm text-ink/50">
            No tenés saldo pendiente, todavía no hay ventas por QR automático sin liquidar.
          </p>
        )}
      </div>

      {requested.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-bold text-ink">En camino</h2>
          <div className="space-y-2">
            {requested.map((p) => (
              <div key={p.id} className="animate-pop rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <p className="font-mono text-lg font-bold text-amber-700">
                    {formatBs(p.netAmount)}
                  </p>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    ⏳ Esperando transferencia
                  </span>
                </div>
                <p className="text-xs text-amber-700/70">
                  Agendada el {new Date(p.createdAt).toLocaleString("es-BO")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* El admin ya dijo que transfirió y subió un comprobante, pero la
          liquidación no cierra sola: hace falta que el propio vendedor mire
          el comprobante y confirme que de verdad le llegó la plata. */}
      {transferred.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-bold text-ink">Confirmá que te llegó</h2>
          <div className="space-y-2">
            {transferred.map((p) => (
              <div key={p.id} className="animate-pop rounded-2xl border border-jade-300 bg-jade-50 p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="font-mono text-lg font-bold text-jade-700">
                    {formatBs(p.netAmount)}
                  </p>
                  <span className="rounded-full bg-jade-100 px-2 py-0.5 text-xs font-medium text-jade-800">
                    Admin dice que ya transfirió
                  </span>
                </div>
                {p.reference && (
                  <p className="text-xs text-ink/50">Referencia: {p.reference}</p>
                )}
                {p.receiptImageUrl && (
                  <a href={p.receiptImageUrl} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.receiptImageUrl}
                      alt="Comprobante de pago"
                      className="mt-2 h-40 w-40 cursor-zoom-in rounded-lg border border-ink/10 object-cover transition hover:opacity-90"
                    />
                  </a>
                )}
                <p className="mt-2 text-xs text-ink/50">
                  Revisá el comprobante (hacé clic para verlo más grande) y confirmá solo si de
                  verdad ya te llegó la plata a tu cuenta o QR.
                </p>
                <button
                  onClick={() => handleConfirmReceived(p.id)}
                  disabled={confirmingId === p.id}
                  className="mt-3 w-full rounded-lg bg-jade-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-jade-700 disabled:opacity-60"
                >
                  {confirmingId === p.id ? "Confirmando..." : "Sí, ya me llegó la plata"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-bold text-ink">Historial de liquidaciones</h2>
        {paid.length === 0 ? (
          <p className="text-sm text-ink/50">Todavía no te liquidamos ninguna venta.</p>
        ) : (
          <div className="space-y-2">
            {paid.map((p) => (
              <div key={p.id} className="animate-pop rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <p className="font-mono text-lg font-bold text-jade-600">
                    {formatBs(p.netAmount)}
                  </p>
                  <span className="rounded-full bg-jade-50 px-2 py-0.5 text-xs font-medium text-jade-700">
                    Pagado
                  </span>
                </div>
                <p className="text-xs text-ink/50">
                  Comisión que pagó el comprador (no se te descontó): {formatBs(p.commissionAmount)}
                </p>
                {p.reference && (
                  <p className="mt-1 text-xs text-ink/40">Comprobante: {p.reference}</p>
                )}
                {p.receiptImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.receiptImageUrl}
                    alt="Comprobante de pago"
                    className="mt-2 h-20 w-20 rounded-lg border border-ink/10 object-cover"
                  />
                )}
                {p.confirmedAt && (
                  <p className="mt-1 text-xs text-ink/40">
                    Confirmaste que te llegó el{" "}
                    {new Date(p.confirmedAt).toLocaleString("es-BO")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reporte de ventas por período: a propósito solo muestra lo que
          generó y qué productos vendió (control de inventario/ventas), sin
          comisión ni neto — eso ya se ve arriba en la billetera. */}
      <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
        <h2 className="mb-1 text-sm font-bold text-ink">Reporte de ventas</h2>
        <p className="mb-3 text-xs text-ink/50">
          Elegí un período para ver qué vendiste por QR automático y cuánto generó, con el mismo
          criterio que tus liquidaciones (para que puedas cuadrarlo).
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink/60">Desde</label>
            <input
              type="date"
              value={reportFrom}
              onChange={(e) => setReportFrom(e.target.value)}
              className="rounded-lg border border-ink/15 px-2.5 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink/60">Hasta</label>
            <input
              type="date"
              value={reportTo}
              onChange={(e) => setReportTo(e.target.value)}
              className="rounded-lg border border-ink/15 px-2.5 py-1.5 text-sm"
            />
          </div>
          <button
            onClick={handleViewReport}
            disabled={reportLoading}
            className="rounded-lg bg-jade-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-jade-600 disabled:opacity-60"
          >
            {reportLoading ? "Generando..." : "Ver reporte"}
          </button>
        </div>
        {reportError && <p className="mt-2 text-xs text-coral-600">{reportError}</p>}

        {report && (
          <div className="animate-pop mt-4 border-t border-ink/10 pt-4">
            {report.orderCount === 0 ? (
              <p className="text-sm text-ink/50">
                No hubo ventas por QR automático en ese período.
              </p>
            ) : (
              <>
                <div className="text-center">
                  <p className="font-mono text-2xl font-bold text-jade-600">
                    {formatBs(report.grossAmount)}
                  </p>
                  <p className="text-[11px] uppercase tracking-wide text-ink/40">
                    Generado en {report.orderCount} pedido{report.orderCount === 1 ? "" : "s"}
                  </p>
                </div>
                <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-ink/40">
                  Productos vendidos
                </p>
                <div className="max-h-60 space-y-1 overflow-y-auto text-sm text-ink/70">
                  {report.products.map((p) => (
                    <div key={p.label} className="flex items-center justify-between gap-3">
                      <span className="min-w-0 flex-1 truncate">
                        {p.quantity}x {p.label}
                      </span>
                      <span className="shrink-0 font-mono text-ink">{formatBs(p.total)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
