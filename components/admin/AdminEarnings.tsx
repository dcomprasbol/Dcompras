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
  status: string;
  reference: string | null;
  paidAt: string | null;
};

export default function AdminEarnings({ slug }: { slug: string }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [commissionPercent, setCommissionPercent] = useState(1);
  const [hasBankInfo, setHasBankInfo] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/stores/${slug}/earnings`).then((r) => r.json()),
      fetch(`/api/stores/${slug}`).then((r) => r.json()),
    ]).then(([earnings, storeData]) => {
      setPending(earnings.pending);
      setPayouts(earnings.payouts || []);
      setCommissionPercent(earnings.commissionPercent ?? 1);
      setHasBankInfo(Boolean(storeData.store?.bankAccountNumber));
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <p className="text-sm text-ink/50">Cargando...</p>;

  return (
    <div className="space-y-5">
      {!hasBankInfo && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          📋 Todavía no cargaste tus datos bancarios — sin eso no te podemos liquidar lo que
          vendas por QR.{" "}
          <span className="font-medium">Agrégalos en la pestaña Cuenta.</span>
        </div>
      )}

      <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
        <h2 className="mb-1 text-sm font-bold text-ink">Saldo pendiente de liquidar</h2>
        <p className="mb-3 text-xs text-ink/50">
          Por cada venta pagada con QR automático, Dcompras le suma {commissionPercent}% al
          comprador — a vos te llega el 100% de tu precio, sin descuentos. Nada de comisión en
          pedidos contra entrega — esos nunca pasan por Dcompras.
        </p>
        {pending && pending.orderCount > 0 ? (
          <div className="rounded-xl bg-paper p-3.5">
            <p className="font-mono text-2xl font-bold text-jade-600">
              {formatBs(pending.netAmount)}
            </p>
            <p className="mt-1 text-xs text-ink/50">
              {pending.orderCount} pedido{pending.orderCount === 1 ? "" : "s"} · Comisión que pagó
              el comprador (no se te descuenta): {formatBs(pending.commissionAmount)}
            </p>
          </div>
        ) : (
          <p className="text-sm text-ink/50">
            No tienes saldo pendiente — todavía no hay ventas por QR automático sin liquidar.
          </p>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-bold text-ink">Historial de liquidaciones</h2>
        {payouts.length === 0 ? (
          <p className="text-sm text-ink/50">Todavía no te liquidamos ninguna venta.</p>
        ) : (
          <div className="space-y-2">
            {payouts.map((p) => (
              <div key={p.id} className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
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
                {p.paidAt && (
                  <p className="text-xs text-ink/40">
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
