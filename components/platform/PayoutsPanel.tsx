"use client";

import { useRef, useState } from "react";
import { formatBs, BANK_ACCOUNT_TYPES, fileToResizedDataUrl } from "@/lib/utils";

type PendingPayout = {
  id: string; // id del payout, no de la tienda
  storeId: string;
  storeName: string;
  storeSlug: string;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountHolder: string | null;
  bankAccountType: string | null;
  paymentQrImageUrl: string | null;
  netAmount: number;
  orderCount: number;
};

function accountTypeLabel(value: string | null) {
  return BANK_ACCOUNT_TYPES.find((t) => t.value === value)?.label ?? value;
}

export default function PayoutsPanel({ initialPending }: { initialPending: PendingPayout[] }) {
  const [pending, setPending] = useState<PendingPayout[]>(initialPending);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [reference, setReference] = useState("");
  const [receiptImageUrl, setReceiptImageUrl] = useState("");
  const [imageProcessing, setImageProcessing] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function openConfirm(payoutId: string) {
    setConfirmingId(payoutId);
    setReference("");
    setReceiptImageUrl("");
    setImageError(null);
  }

  function closeConfirm() {
    setConfirmingId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError(null);
    setImageProcessing(true);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setReceiptImageUrl(dataUrl);
    } catch {
      setImageError("No se pudo procesar esa imagen, intenta con otra foto");
    } finally {
      setImageProcessing(false);
    }
  }

  async function handleConfirm(payoutId: string) {
    // El comprobante (foto o número de referencia) es lo único que prueba
    // que la plata salió de verdad — sin al menos uno de los dos no se deja
    // cerrar la liquidación, para no perder el rastro de una transferencia
    // real por apuro.
    if (!receiptImageUrl && !reference.trim()) {
      setImageError("Subí una foto del comprobante o escribí el número de referencia");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/platform/payouts/${payoutId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: reference.trim() || null,
          receiptImageUrl: receiptImageUrl || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        window.alert(data.error || "No se pudo confirmar la liquidación");
        return;
      }
      // La fila se achica y desaparece en vez de saltar de golpe — confirma
      // visualmente que quedó cerrada la liquidación.
      setConfirmedId(payoutId);
      closeConfirm();
      setTimeout(() => {
        setPending((prev) => prev.filter((p) => p.id !== payoutId));
        setConfirmedId(null);
      }, 280);
    } finally {
      setSaving(false);
    }
  }

  if (pending.length === 0) {
    return (
      <p className="text-sm text-ink/50">
        No hay liquidaciones solicitadas por ahora. Los vendedores las agendan desde su billetera.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {pending.map((row) => (
        <div
          key={row.id}
          className={`animate-pop rounded-2xl border border-ink/5 bg-white p-4 shadow-sm ${
            confirmedId === row.id ? "animate-shrink-out" : ""
          }`}
        >
          <div className="flex items-start gap-4">
            {row.paymentQrImageUrl && (
              // El QR de cobro de la tienda sirve igual para pagarle: cualquier
              // billetera/banco que lo escanee manda la plata a esa cuenta.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={row.paymentQrImageUrl}
                alt={`QR de ${row.storeName}`}
                className="h-20 w-20 shrink-0 rounded-lg border border-ink/10 object-contain"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-ink">
                    {row.storeName} <span className="font-normal text-ink/40">/{row.storeSlug}</span>
                  </p>
                  <p className="mt-0.5 font-mono text-lg font-bold text-jade-600">
                    {formatBs(row.netAmount)}
                  </p>
                  <p className="text-xs text-ink/50">
                    {row.orderCount} pedido{row.orderCount === 1 ? "" : "s"} en esta solicitud
                  </p>
                </div>
                {confirmingId !== row.id && (
                  <button
                    onClick={() => openConfirm(row.id)}
                    className="shrink-0 rounded-lg bg-jade-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-jade-600"
                  >
                    Marcar como pagado
                  </button>
                )}
              </div>

              {row.bankAccountNumber ? (
                <p className="rounded-lg bg-paper px-2.5 py-1.5 text-xs text-ink/60">
                  {row.bankName || "Banco no especificado"} · {accountTypeLabel(row.bankAccountType)} ·{" "}
                  {row.bankAccountNumber} · {row.bankAccountHolder || "titular no especificado"}
                </p>
              ) : row.paymentQrImageUrl ? (
                <p className="rounded-lg bg-paper px-2.5 py-1.5 text-xs text-ink/50">
                  No cargó datos bancarios: pagale escaneando el QR de al lado.
                </p>
              ) : (
                <p className="rounded-lg bg-coral-50 px-2.5 py-1.5 text-xs text-coral-700">
                  Sin datos bancarios ni QR cargados. Pedile al vendedor que complete uno de los
                  dos en su panel.
                </p>
              )}
            </div>
          </div>

          {confirmingId === row.id && (
            <div className="mt-3 space-y-2 border-t border-ink/5 pt-3">
              <label className="block text-xs font-medium text-ink/60">
                Foto del comprobante de la transferencia
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full rounded-lg border border-ink/15 px-3 py-2 text-xs file:mr-3 file:rounded-full file:border-0 file:bg-jade-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-jade-700"
              />
              {imageProcessing && <p className="text-xs text-ink/50">Procesando imagen...</p>}
              {receiptImageUrl && !imageProcessing && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={receiptImageUrl}
                  alt="Comprobante"
                  className="h-20 w-20 rounded-lg border border-ink/10 object-cover"
                />
              )}
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Número de referencia (opcional si subís foto)"
                className="w-full rounded-lg border border-ink/15 px-3 py-2 text-xs"
              />
              {imageError && <p className="text-xs text-coral-600">{imageError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => handleConfirm(row.id)}
                  disabled={saving}
                  className="rounded-lg bg-jade-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-jade-600 disabled:opacity-60"
                >
                  {saving ? "Guardando..." : "Confirmar pago"}
                </button>
                <button
                  onClick={closeConfirm}
                  disabled={saving}
                  className="rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink/60"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
