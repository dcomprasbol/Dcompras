"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { SELLER_CLOSE_PHRASE, SELLER_CLOSE_REASONS } from "@/lib/utils";

// "Zona de peligro" del panel: el vendedor elimina su tienda. Dos pasos:
// 1) por qué se va (encuesta: opciones fijas + "otro" con texto), 2) escribir
// "eliminar cuenta" dos veces, como GitHub. Después puede crear otra tienda
// con el mismo correo cuando quiera.
export default function CloseStoreSection({ slug, storeName }: { slug: string; storeName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-8 rounded-2xl border border-coral-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold text-coral-600">Zona de peligro</h2>
      <p className="mt-1 text-xs text-ink/55">
        Si eliminas tu tienda, deja de verse de inmediato y tus clientes ya no podrán hacer pedidos.
        Si tienes ganancias pendientes, igual te las liquidamos. Más adelante puedes crear una tienda
        nueva con este mismo correo.
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-2 rounded-full border border-coral-500 px-4 py-2 text-sm font-semibold text-coral-600 transition hover:bg-coral-50"
      >
        <Icon name="trash" mono className="h-4 w-4" />
        Eliminar mi tienda
      </button>
      {open && <CloseStoreModal slug={slug} storeName={storeName} onClose={() => setOpen(false)} />}
    </div>
  );
}

function CloseStoreModal({ slug, storeName, onClose }: { slug: string; storeName: string; onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [reason, setReason] = useState<string>("");
  const [detail, setDetail] = useState("");
  const [confirm1, setConfirm1] = useState("");
  const [confirm2, setConfirm2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reasonOk = reason !== "" && (reason !== "otro" || detail.trim().length >= 3);
  const matches = (v: string) => v.trim().toLowerCase() === SELLER_CLOSE_PHRASE;
  const confirmOk = matches(confirm1) && matches(confirm2);

  async function handleClose() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/stores/${slug}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, detail, confirm1, confirm2 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "No se pudo eliminar la tienda");
        setLoading(false);
        return;
      }
      router.push("/crear-tienda?eliminada=1");
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Paso {step} de 2</p>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-ink/40 hover:text-ink">
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>
        <h3 className="mt-2 font-display text-lg font-bold text-ink">Eliminar &quot;{storeName}&quot;</h3>

        {step === 1 ? (
          <>
            <p className="mt-1 text-sm text-ink/60">
              Antes de irte, ¿nos cuentas por qué? Nos ayuda a mejorar Dcompras.
            </p>
            <div className="mt-4 space-y-2" role="radiogroup" aria-label="Motivo">
              {SELLER_CLOSE_REASONS.map((r) => (
                <label
                  key={r.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
                    reason === r.value ? "border-jade-500 bg-jade-50 text-ink" : "border-ink/10 text-ink/70 hover:border-ink/25"
                  }`}
                >
                  <input
                    type="radio"
                    name="close-reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="accent-jade-600"
                  />
                  {r.label}
                </label>
              ))}
            </div>
            {reason && (
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder={reason === "otro" ? "Cuéntanos el motivo (obligatorio)" : "¿Algo más que quieras contarnos? (opcional)"}
                rows={3}
                maxLength={1000}
                className="mt-3 w-full rounded-xl border border-ink/15 px-3 py-2 text-sm focus:border-jade-500 focus:outline-none"
              />
            )}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!reasonOk}
                className="flex-1 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continuar
              </button>
              <button type="button" onClick={onClose} className="rounded-full border border-ink/15 px-4 py-2.5 text-sm font-medium text-ink/60">
                Cancelar
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mt-3 rounded-xl bg-coral-50 p-3 text-sm text-coral-700">
              Esta acción no se puede deshacer. Tu tienda dejará de verse y tus clientes no podrán hacer
              pedidos.
            </div>
            <p className="mt-4 text-sm text-ink/70">
              Para confirmar, escribe <code className="rounded bg-paper px-1.5 py-0.5 font-mono text-ink">{SELLER_CLOSE_PHRASE}</code> dos veces:
            </p>
            <input
              value={confirm1}
              onChange={(e) => setConfirm1(e.target.value)}
              placeholder={SELLER_CLOSE_PHRASE}
              autoComplete="off"
              className="mt-2 w-full rounded-xl border border-ink/15 px-3 py-2 font-mono text-sm focus:border-coral-500 focus:outline-none"
            />
            <input
              value={confirm2}
              onChange={(e) => setConfirm2(e.target.value)}
              placeholder={SELLER_CLOSE_PHRASE}
              autoComplete="off"
              className="mt-2 w-full rounded-xl border border-ink/15 px-3 py-2 font-mono text-sm focus:border-coral-500 focus:outline-none"
            />
            {error && <p className="mt-2 text-sm text-coral-600">{error}</p>}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={!confirmOk || loading}
                className="flex-1 rounded-full bg-coral-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "Eliminando..." : "Eliminar mi tienda"}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={loading}
                className="rounded-full border border-ink/15 px-4 py-2.5 text-sm font-medium text-ink/60"
              >
                Atrás
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
