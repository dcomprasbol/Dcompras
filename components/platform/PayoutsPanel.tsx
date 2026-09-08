"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
  status: "solicitado" | "transferido";
  reference: string | null;
  receiptImageUrl: string | null;
  paidAt: string | null;
};

function accountTypeLabel(value: string | null) {
  return BANK_ACCOUNT_TYPES.find((t) => t.value === value)?.label ?? value;
}

export default function PayoutsPanel({ initialPending }: { initialPending: PendingPayout[] }) {
  const [pending, setPending] = useState<PendingPayout[]>(initialPending);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reference, setReference] = useState("");
  const [receiptImageUrl, setReceiptImageUrl] = useState("");
  const [imageProcessing, setImageProcessing] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const open = pending.find((p) => p.id === openId) ?? null;

  function openDetail(payoutId: string) {
    setOpenId(payoutId);
    setReference("");
    setReceiptImageUrl("");
    setImageError(null);
  }

  function closeDetail() {
    setOpenId(null);
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
    // marcar como transferido, para no perder el rastro de una transferencia
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
        window.alert(data.error || "No se pudo marcar como transferido");
        return;
      }
      // Todavía no desaparece de la lista: sigue apareciendo, ahora como
      // "transferido", hasta que el propio vendedor confirme que le llegó
      // (recién ahí sale de listPendingPayoutRequests para siempre).
      setPending((prev) =>
        prev.map((p) =>
          p.id === payoutId
            ? {
                ...p,
                status: "transferido",
                reference: reference.trim() || null,
                receiptImageUrl: receiptImageUrl || null,
              }
            : p
        )
      );
      closeDetail();
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
    <>
      <div className="space-y-3">
        {pending.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => openDetail(row.id)}
            className="animate-pop w-full rounded-2xl border border-ink/5 bg-white p-4 text-left shadow-sm transition hover:border-jade-300 hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              {row.paymentQrImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={row.paymentQrImageUrl}
                  alt={`QR de ${row.storeName}`}
                  className="h-16 w-16 shrink-0 rounded-lg border border-ink/10 object-contain"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-ink">
                    {row.storeName} <span className="font-normal text-ink/40">/{row.storeSlug}</span>
                  </p>
                  {row.status === "transferido" && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                      Esperando confirmación del vendedor
                    </span>
                  )}
                </div>
                <p className="mt-0.5 font-mono text-lg font-bold text-jade-600">
                  {formatBs(row.netAmount)}
                </p>
                <p className="text-xs text-ink/50">
                  {row.orderCount} pedido{row.orderCount === 1 ? "" : "s"} en esta solicitud ·{" "}
                  {row.status === "transferido" ? "Ver comprobante" : "Ver detalle y marcar como transferido"} →
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Detalle de la solicitud: QR grande, datos bancarios, subir
          comprobante y marcar como transferido — todo en un panel aparte
          para no amontonar la lista con un formulario por fila. */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="payout-detail"
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDetail}
          >
            <motion.div
              className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-ink">
                    {open.storeName}{" "}
                    <span className="font-normal text-ink/40">/{open.storeSlug}</span>
                  </p>
                  <p className="mt-0.5 font-mono text-2xl font-bold text-jade-600">
                    {formatBs(open.netAmount)}
                  </p>
                  <p className="text-xs text-ink/50">
                    {open.orderCount} pedido{open.orderCount === 1 ? "" : "s"} en esta solicitud
                  </p>
                </div>
                <button
                  onClick={closeDetail}
                  aria-label="Cerrar"
                  className="shrink-0 text-xl leading-none text-ink/30 hover:text-ink"
                >
                  ×
                </button>
              </div>

              {open.paymentQrImageUrl && (
                <div className="mb-3 flex justify-center border border-ink/10 bg-paper p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={open.paymentQrImageUrl}
                    alt={`QR de ${open.storeName}`}
                    className="h-56 w-56 object-contain"
                  />
                </div>
              )}

              {open.bankAccountNumber ? (
                <p className="mb-3 rounded-lg bg-paper px-2.5 py-1.5 text-xs text-ink/60">
                  {open.bankName || "Banco no especificado"} ·{" "}
                  {accountTypeLabel(open.bankAccountType)} · {open.bankAccountNumber} ·{" "}
                  {open.bankAccountHolder || "titular no especificado"}
                </p>
              ) : open.paymentQrImageUrl ? (
                <p className="mb-3 rounded-lg bg-paper px-2.5 py-1.5 text-xs text-ink/50">
                  No cargó datos bancarios: pagale escaneando el QR de arriba.
                </p>
              ) : (
                <p className="mb-3 rounded-lg bg-coral-50 px-2.5 py-1.5 text-xs text-coral-700">
                  Sin datos bancarios ni QR cargados. Pedile al vendedor que complete uno de los
                  dos en su panel.
                </p>
              )}

              {open.status === "transferido" ? (
                // Ya se subió el comprobante — ahora es esperar a que el
                // vendedor lo confirme desde su billetera, nada más que
                // hacer acá.
                <div className="space-y-2 border-t border-ink/5 pt-3">
                  <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800">
                    ⏳ Esperando que el vendedor confirme que le llegó la plata.
                  </div>
                  {open.reference && (
                    <p className="text-xs text-ink/50">Referencia: {open.reference}</p>
                  )}
                  {open.receiptImageUrl && (
                    <a href={open.receiptImageUrl} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={open.receiptImageUrl}
                        alt="Comprobante"
                        className="h-40 w-40 cursor-zoom-in rounded-lg border border-ink/10 object-cover transition hover:opacity-90"
                      />
                    </a>
                  )}
                  <button
                    onClick={closeDetail}
                    className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm font-medium text-ink/60"
                  >
                    Cerrar
                  </button>
                </div>
              ) : (
                <div className="space-y-2 border-t border-ink/5 pt-3">
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
                  <p className="text-[11px] text-ink/40">
                    Esto no cierra la liquidación todavía — el vendedor tiene que confirmar desde
                    su billetera que le llegó la plata.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleConfirm(open.id)}
                      disabled={saving}
                      className="flex-1 rounded-lg bg-jade-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-jade-600 disabled:opacity-60"
                    >
                      {saving ? "Guardando..." : "Marcar como transferido"}
                    </button>
                    <button
                      onClick={closeDetail}
                      disabled={saving}
                      className="rounded-lg border border-ink/15 px-3 py-2 text-sm font-medium text-ink/60"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
