"use client";

import { useState } from "react";
import { PRODUCT_REPORT_REASONS, ORDER_REPORT_REASONS } from "@/lib/utils";

// Botón de "reportar" reutilizable — un mismo componente para la ficha de
// producto (reason: ilegal/sospechoso/otro) y para el seguimiento de un
// pedido (reason: no llegó/defectuoso/otro). No pide cuenta ni login:
// cualquiera puede reportar, y el admin de plataforma revisa todo junto en
// /plataforma (ver lib/repo.ts → createReport / listAllReports).
export default function ReportButton({
  slug,
  type,
  productId,
  orderId,
  label,
}: {
  slug: string;
  type: "product" | "order";
  productId?: string;
  orderId?: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reasons = type === "product" ? PRODUCT_REPORT_REASONS : ORDER_REPORT_REASONS;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) {
      setError("Elegí un motivo");
      return;
    }
    setError(null);
    setSending(true);
    try {
      const res = await fetch(`/api/stores/${slug}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, orderId, reason, message, contact }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "No se pudo enviar el reporte");
        return;
      }
      setDone(true);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return <p className="text-xs text-ink/40">Gracias, un administrador lo va a revisar.</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-ink/35 underline decoration-dotted hover:text-coral-600"
      >
        {label}
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-2 max-w-sm space-y-2 border border-ink/10 bg-white p-3 text-left"
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-ink/70">Motivo</label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border border-ink/15 px-2 py-1.5 text-xs"
        >
          <option value="">Elegí un motivo</option>
          {reasons.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ink/70">Detalle (opcional)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          maxLength={500}
          className="w-full border border-ink/15 px-2 py-1.5 text-xs"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ink/70">
          Tu contacto (opcional, por si el admin necesita más info)
        </label>
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className="w-full border border-ink/15 px-2 py-1.5 text-xs"
        />
      </div>
      {error && <p className="text-xs text-coral-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={sending}
          className="bg-coral-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
        >
          {sending ? "Enviando..." : "Enviar reporte"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 py-1.5 text-xs font-medium text-ink/50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
