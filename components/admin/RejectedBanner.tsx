"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RejectedBanner({
  slug,
  rejectionNote,
}: {
  slug: string;
  rejectionNote: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"resubmit" | "delete" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResubmit() {
    setError(null);
    setLoading("resubmit");
    const res = await fetch(`/api/stores/${slug}/resubmit`, { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo enviar a revisión");
      setLoading(null);
      return;
    }
    router.refresh();
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setError(null);
    setLoading("delete");
    const res = await fetch(`/api/stores/${slug}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo eliminar la tienda");
      setLoading(null);
      return;
    }
    router.push("/crear-tienda");
    router.refresh();
  }

  return (
    <div className="mb-5 rounded-2xl border border-coral-300 bg-coral-50 px-4 py-3 text-sm text-coral-700">
      <p className="font-medium">❌ Tu tienda fue rechazada y no es visible al público.</p>

      {rejectionNote && (
        <p className="mt-1.5 text-coral-600">
          <strong>Motivo:</strong> {rejectionNote}
        </p>
      )}

      <p className="mt-2 text-coral-600">
        Corrige lo que haga falta en Configuración (por ejemplo, tus redes sociales) y pide una
        nueva revisión, o empieza de cero con otra tienda.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleResubmit}
          disabled={loading !== null}
          className="rounded-lg bg-coral-500 px-3 py-1.5 text-xs font-semibold text-white transition disabled:opacity-60"
        >
          {loading === "resubmit" ? "Enviando..." : "Solicitar nueva revisión"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading !== null}
          className="rounded-lg border border-coral-300 px-3 py-1.5 text-xs font-medium text-coral-700 transition disabled:opacity-60"
        >
          {loading === "delete"
            ? "Eliminando..."
            : confirmDelete
              ? "¿Seguro? Toca de nuevo para confirmar"
              : "Empezar de nuevo con otra tienda"}
        </button>
      </div>

      {error && <p className="mt-2 text-xs">{error}</p>}
    </div>
  );
}
