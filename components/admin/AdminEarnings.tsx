"use client";

import { useEffect, useState } from "react";
import { formatBs } from "@/lib/utils";

type Pending = { grossAmount: number; commissionAmount: number; netAmount: number; orderCount: number };
type Payout = {
  id: string;
  periodStart: string;
  periodEnd: string;
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  status: "solicitado" | "pagado" | string;
  reference: string | null;
  receiptImageUrl: string | null;
  paidAt: string | null;
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

  const hasRequestedPayout = payouts.some((p) => p.status === "solicitado");

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

  if (loading) return <p className="text-sm text-ink/50">Cargando...</p>;

  const requested = payouts.filter((p) => p.status === "solicitado");
  const paid = payouts.filter((p) => p.status === "pagado");

  return (
    <div className="space-y-5">
      {!hasBankInfo && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          📋 Todavía no cargaste tu QR ni tus datos bancarios — sin uno de los dos no podés agendar
          una liquidación. <span className="font-medium">Agrégalos en la pestaña Cuenta.</span>
        </div>
      )}

      {/* La "billetera": saldo disponible + botón para agendar. */}
      <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
        <h2 className="mb-1 text-sm font-bold text-ink">Tu billetera</h2>
        <p className="mb-3 text-xs text-ink/50">
          Por cada venta pagada con QR automático, Dcompras le suma {commissionPercent}% al
          comprador — a vos te llega el 100% de tu precio, sin descuentos. Nada de comisión en
          pedidos contra entrega — esos nunca pasan por Dcompras.
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
            No tenés saldo pendiente — todavía no hay ventas por QR automático sin liquidar.
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
                {p.paidAt && (
                  <p className="mt-1 text-xs text-ink/40">
                    {new Date(p.paidAt).toLocaleString("es-BO")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
