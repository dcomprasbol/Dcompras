"use client";

import { useState } from "react";
import { formatBs, BANK_ACCOUNT_TYPES } from "@/lib/utils";

type PendingPayout = {
  storeId: string;
  storeName: string;
  storeSlug: string;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountHolder: string | null;
  bankAccountType: string | null;
  netAmount: number;
  orderCount: number;
};

function accountTypeLabel(value: string | null) {
  return BANK_ACCOUNT_TYPES.find((t) => t.value === value)?.label ?? value;
}

export default function PayoutsPanel({ initialPending }: { initialPending: PendingPayout[] }) {
  const [pending, setPending] = useState<PendingPayout[]>(initialPending);
  const [liquidatingId, setLiquidatingId] = useState<string | null>(null);

  async function handleLiquidar(storeId: string) {
    const row = pending.find((p) => p.storeId === storeId);
    if (!row) return;

    if (!row.bankAccountNumber) {
      window.alert(
        "Esta tienda todavía no cargó sus datos bancarios — pídele que los complete en su panel (Cuenta) antes de liquidar."
      );
      return;
    }

    const reference = window.prompt(
      `Vas a registrar que ya transferiste ${formatBs(row.netAmount)} a ${row.storeName} (${row.bankName || "banco no especificado"}, cuenta ${row.bankAccountNumber}).\n\nPega el número de comprobante de la transferencia:`
    );
    if (reference === null) return; // canceló

    setLiquidatingId(storeId);
    try {
      const res = await fetch("/api/platform/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, reference: reference.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        window.alert(data.error || "No se pudo registrar la liquidación");
        return;
      }
      setPending((prev) => prev.filter((p) => p.storeId !== storeId));
    } finally {
      setLiquidatingId(null);
    }
  }

  if (pending.length === 0) {
    return (
      <p className="text-sm text-ink/50">
        No hay saldos pendientes de liquidar por ahora.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {pending.map((row) => (
        <div key={row.storeId} className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-ink">
                {row.storeName} <span className="font-normal text-ink/40">/{row.storeSlug}</span>
              </p>
              <p className="mt-0.5 font-mono text-lg font-bold text-jade-600">
                {formatBs(row.netAmount)}
              </p>
              <p className="text-xs text-ink/50">
                {row.orderCount} pedido{row.orderCount === 1 ? "" : "s"} sin liquidar
              </p>
            </div>
            <button
              onClick={() => handleLiquidar(row.storeId)}
              disabled={liquidatingId === row.storeId}
              className="shrink-0 rounded-lg bg-jade-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-jade-600 disabled:opacity-60"
            >
              {liquidatingId === row.storeId ? "..." : "Liquidar"}
            </button>
          </div>

          {row.bankAccountNumber ? (
            <p className="rounded-lg bg-paper px-2.5 py-1.5 text-xs text-ink/60">
              {row.bankName || "Banco no especificado"} · {accountTypeLabel(row.bankAccountType)} ·{" "}
              {row.bankAccountNumber} · {row.bankAccountHolder || "titular no especificado"}
            </p>
          ) : (
            <p className="rounded-lg bg-coral-50 px-2.5 py-1.5 text-xs text-coral-700">
              Sin datos bancarios cargados todavía — no se puede liquidar hasta que la tienda los
              complete en su panel.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
