"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatBs, PAYOUT_PROCESSING_TIME } from "@/lib/utils";
import Icon from "@/components/Icon";
import PaymentsGuide, { PayoutSteps } from "@/components/admin/PaymentsGuide";

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

type View = "billetera" | "guia";

// La pestaña "Cómo funciona" se puede abrir directo con ?guia=1 (por
// ejemplo desde el link de "Datos y cobros").
function initialView(): View {
  if (typeof window === "undefined") return "billetera";
  return new URLSearchParams(window.location.search).get("guia") === "1" ? "guia" : "billetera";
}

export default function AdminEarnings({ slug }: { slug: string }) {
  const [view, setView] = useState<View>(initialView);
  const [pending, setPending] = useState<Pending | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [commissionPercent, setCommissionPercent] = useState(1);
  const [autoQrEnabled, setAutoQrEnabled] = useState(true);
  const [commissionPayer, setCommissionPayer] = useState<"comprador" | "vendedor">("comprador");
  // Sin el QR del vendedor no hay cómo transferirle: no se puede agendar
  // una liquidación (el servidor también lo bloquea, ver payouts/route.ts).
  const [hasPayoutQr, setHasPayoutQr] = useState(true);
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
    setAutoQrEnabled(earningsRes.autoQrEnabled ?? false);
    setCommissionPayer(earningsRes.commissionPayer === "vendedor" ? "vendedor" : "comprador");
    setHasPayoutQr(Boolean(storeRes.store?.paymentQrImageUrl));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [slug]);

  function changeView(next: View) {
    setView(next);
    const url = new URL(window.location.href);
    if (next === "guia") url.searchParams.set("guia", "1");
    else url.searchParams.delete("guia");
    window.history.replaceState(null, "", url.toString());
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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
    if (!window.confirm("¿Confirmas que este dinero ya llegó a tu cuenta o QR?")) return;
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
  const isNewToWallet = payouts.length === 0 && (!pending || pending.orderCount === 0);

  return (
    <div className="space-y-5">
      {/* Pestañas: billetera / guía */}
      <div className="grid grid-cols-2 gap-1 rounded-2xl border border-ink/5 bg-white p-1 shadow-sm" role="tablist">
        {(
          [
            { key: "billetera", label: "Mi billetera", icon: "wallet" },
            { key: "guia", label: "Cómo funciona", icon: "spark" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={view === t.key}
            onClick={() => changeView(t.key)}
            className={`relative flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition ${
              view === t.key ? "text-white" : "text-ink/60 hover:text-ink"
            }`}
          >
            {view === t.key && (
              <motion.span layoutId="wallet-tab" className="absolute inset-0 rounded-xl bg-ink" transition={{ type: "spring", stiffness: 380, damping: 32 }} />
            )}
            <span className="relative flex items-center gap-1.5">
              <Icon name={t.icon} mono className="h-4 w-4" />
              {t.label}
              {t.key === "guia" && isNewToWallet && view !== "guia" && (
                <span className="h-2 w-2 animate-pulse rounded-full bg-jade-500" aria-label="Nuevo" />
              )}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {view === "guia" ? (
          <motion.div key="guia" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <PaymentsGuide
              commissionPercent={commissionPercent}
              commissionPayer={commissionPayer}
              autoQrEnabled={autoQrEnabled}
              onGoToWallet={() => changeView("billetera")}
            />
          </motion.div>
        ) : (
          <motion.div key="billetera" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
            {!hasPayoutQr && (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <p className="font-semibold">
                  <Icon name="qr" mono className="mr-1.5 h-4 w-4" />
                  Carga tu QR para poder recibir tu dinero
                </p>
                <p className="mt-1 text-xs">
                  Te pagamos tus liquidaciones a ese QR. Mientras no lo cargues, no puedes agendar una liquidación (tu saldo
                  queda guardado, no se pierde).
                </p>
                <a
                  href="?tab=datos"
                  className="mt-2 inline-block rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Cargar mi QR →
                </a>
              </div>
            )}

            {/* Aviso destacado del QR automático: lleva a la guía. */}
            <button
              type="button"
              onClick={() => changeView("guia")}
              className="group flex w-full items-center gap-3 rounded-2xl border border-jade-100 bg-gradient-to-r from-jade-50 to-white p-4 text-left transition hover:border-jade-400"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-jade-500 text-white">
                <Icon name="qr" mono className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-ink">
                  {isNewToWallet ? "¿Primera vez? Mira cómo funciona en 1 minuto" : "QR automático: cobras sin revisar tu banco"}
                </span>
                <span className="block text-xs text-ink/55">
                  El banco confirma cada pago, así nadie te engaña con una captura. Y cada liquidación llega con su comprobante.
                </span>
              </span>
              <span className="text-jade-600 transition group-hover:translate-x-0.5">→</span>
            </button>

            {/* La "billetera": saldo disponible + botón para agendar. */}
            <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-ink">Tu saldo</h2>
                <span className="rounded-full bg-jade-50 px-2 py-0.5 text-[11px] font-semibold text-jade-700">
                  {commissionPayer === "vendedor" ? "Sin recargos para tus clientes" : "Te llega el 100% de tu precio"}
                </span>
              </div>
              {pending && pending.orderCount > 0 ? (
                <div className={`rounded-xl bg-paper p-3.5 ${justRequested ? "animate-confirm-pulse" : ""}`}>
                  <p className="font-mono text-3xl font-bold text-jade-600">
                    {formatBs(pending.netAmount)}
                  </p>
                  <p className="mt-1 text-xs text-ink/50">
                    {pending.orderCount} pedido{pending.orderCount === 1 ? "" : "s"} sin liquidar · Pago verificado de
                    estos pedidos: {formatBs(pending.commissionAmount)}.{" "}
                    {pending.netAmount < pending.grossAmount
                      ? "Ya está descontado lo que elegiste asumir; el resto lo pagaron tus clientes."
                      : "Lo pagaron tus clientes, no se te descuenta."}
                  </p>
                  <button
                    onClick={handleRequestPayout}
                    disabled={requesting || !hasPayoutQr || hasRequestedPayout}
                    className="mt-3 w-full rounded-xl bg-jade-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-jade-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {requesting
                      ? "Agendando..."
                      : hasRequestedPayout
                        ? "Ya tienes una liquidación en camino"
                        : !hasPayoutQr
                          ? "Carga tu QR para agendar la liquidación"
                          : `Agendar liquidación de ${formatBs(pending.netAmount)}`}
                  </button>
                  {!hasRequestedPayout && hasPayoutQr && (
                    <p className="mt-2 text-center text-[11px] text-ink/45">
                      Te transferimos normalmente en {PAYOUT_PROCESSING_TIME}, con comprobante.
                    </p>
                  )}
                  {error && <p className="mt-2 text-xs text-coral-600">{error}</p>}
                </div>
              ) : (
                <div className="rounded-xl bg-paper p-4 text-center">
                  <p className="font-mono text-2xl font-bold text-ink/30">{formatBs(0)}</p>
                  <p className="mt-1 text-sm text-ink/50">
                    Todavía no tienes ventas por QR automático sin liquidar. Cuando un cliente pague con
                    QR automático, el dinero aparece aquí.
                  </p>
                </div>
              )}
            </div>

            {(requested.length > 0 || transferred.length > 0) && (
              <div>
                <h2 className="mb-3 text-sm font-bold text-ink">Liquidaciones en curso</h2>
                <div className="space-y-2">
                  {requested.map((p) => (
                    <div key={p.id} className="animate-pop rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <p className="font-mono text-lg font-bold text-ink">{formatBs(p.netAmount)}</p>
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          <Icon name="clock" mono className="mr-1 h-3.5 w-3.5" />Preparando tu transferencia
                        </span>
                      </div>
                      <PayoutSteps current={1} />
                      <p className="mt-3 text-xs text-ink/50">
                        Agendada el {new Date(p.createdAt).toLocaleString("es-BO")}. Te avisamos cuando
                        hagamos la transferencia (normalmente en {PAYOUT_PROCESSING_TIME}).
                      </p>
                    </div>
                  ))}

                  {/* El admin ya transfirió y subió un comprobante, pero la
                      liquidación no cierra sola: el propio vendedor mira el
                      comprobante y confirma que de verdad le llegó la plata. */}
                  {transferred.map((p) => (
                    <div key={p.id} className="animate-pop rounded-2xl border border-jade-400 bg-jade-50 p-4">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <p className="font-mono text-lg font-bold text-jade-700">{formatBs(p.netAmount)}</p>
                        <span className="rounded-full bg-jade-100 px-2 py-0.5 text-xs font-medium text-jade-700">
                          ¡Te transferimos!
                        </span>
                      </div>
                      <PayoutSteps current={2} />
                      <div className="mt-3 flex gap-3">
                        {p.receiptImageUrl && (
                          <a href={p.receiptImageUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={p.receiptImageUrl}
                              alt="Comprobante de la transferencia"
                              className="h-28 w-28 cursor-zoom-in rounded-lg border border-ink/10 object-cover transition hover:opacity-90"
                            />
                          </a>
                        )}
                        <div className="text-xs text-ink/60">
                          {p.reference && (
                            <p className="mb-1">
                              Referencia: <span className="font-semibold text-ink">{p.reference}</span>
                            </p>
                          )}
                          <p>
                            Revisa en tu banco que te llegaron <span className="font-semibold text-ink">{formatBs(p.netAmount)}</span>.
                            Toca el comprobante para verlo grande.
                          </p>
                          <p className="mt-1 text-ink/45">
                            ¿No te llegó o no coincide? No confirmes y escríbenos en Ayuda.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleConfirmReceived(p.id)}
                        disabled={confirmingId === p.id}
                        className="mt-3 w-full rounded-xl bg-jade-600 px-3 py-3 text-sm font-semibold text-white transition hover:bg-jade-700 disabled:opacity-60"
                      >
                        {confirmingId === p.id ? "Confirmando..." : "Sí, ya me llegó el dinero"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="mb-3 text-sm font-bold text-ink">Historial de liquidaciones</h2>
              {paid.length === 0 ? (
                <p className="text-sm text-ink/50">Todavía no tienes liquidaciones cerradas.</p>
              ) : (
                <div className="space-y-2">
                  {paid.map((p) => (
                    <div key={p.id} className="animate-pop rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <p className="font-mono text-lg font-bold text-jade-600">
                          {formatBs(p.netAmount)}
                        </p>
                        <span className="rounded-full bg-jade-50 px-2 py-0.5 text-xs font-medium text-jade-700">
                          ✓ Pagado
                        </span>
                      </div>
                      <p className="text-xs text-ink/50">
                        Pago verificado: {formatBs(p.commissionAmount)}
                        {p.netAmount < p.grossAmount ? " (lo asumiste tú, ya descontado)" : " (lo pagaron tus clientes)"}
                      </p>
                      {p.reference && (
                        <p className="mt-1 text-xs text-ink/40">Referencia: {p.reference}</p>
                      )}
                      {p.receiptImageUrl && (
                        <a href={p.receiptImageUrl} target="_blank" rel="noopener noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.receiptImageUrl}
                            alt="Comprobante de la transferencia"
                            className="mt-2 h-20 w-20 cursor-zoom-in rounded-lg border border-ink/10 object-cover"
                          />
                        </a>
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
                Elige un período para ver qué vendiste por QR automático y cuánto generó, con el mismo
                criterio que tus liquidaciones (para que puedas cuadrarlo con tu banco).
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
