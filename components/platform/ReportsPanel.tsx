"use client";

import { useMemo, useState } from "react";
import { reportReasonLabel } from "@/lib/utils";

type Report = {
  id: string;
  storeId: string;
  storeName: string;
  storeSlug: string;
  productId: string | null;
  productName: string | null;
  orderId: string | null;
  orderCode: string | null;
  reason: string;
  message: string | null;
  reporterContact: string | null;
  status: string;
  createdAt: string;
};

type StoreInfo = { id: string; slug: string; name: string; whatsapp: string; status: string };

const REPORT_STATUS_COLORS: Record<string, string> = {
  abierto: "bg-amber-50 text-amber-700",
  revisado: "bg-jade-50 text-jade-700",
  descartado: "bg-gray-100 text-ink/50",
};

const CONFIRM_PHRASE = "D_compras_delete";

export default function ReportsPanel({
  initialReports,
  warningCounts,
  stores,
}: {
  initialReports: Report[];
  warningCounts: Record<string, number>;
  stores: StoreInfo[];
}) {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [storeState, setStoreState] = useState<Record<string, StoreInfo>>(
    Object.fromEntries(stores.map((s) => [s.id, s]))
  );
  const [warnings, setWarnings] = useState<Record<string, number>>(warningCounts);
  const [deleteModalStoreId, setDeleteModalStoreId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, Report[]>();
    for (const r of reports) {
      if (!map.has(r.storeId)) map.set(r.storeId, []);
      map.get(r.storeId)!.push(r);
    }
    // Tiendas con reportes abiertos primero, y entre esas, la que más
    // reportes abiertos tiene — la lista está para decidir dónde mirar
    // primero, no para leer en orden cronológico.
    return [...map.entries()].sort((a, b) => {
      const openA = a[1].filter((r) => r.status === "abierto").length;
      const openB = b[1].filter((r) => r.status === "abierto").length;
      return openB - openA;
    });
  }, [reports]);

  async function updateReportStatus(id: string, status: string) {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    await fetch(`/api/platform/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async function notifySeller(store: StoreInfo, storeReports: Report[]) {
    const reasons = [...new Set(storeReports.map((r) => reportReasonLabel(r.reason)))].join(", ");
    const msg = encodeURIComponent(
      `Hola ${store.name}, te escribimos desde Dcompras: recibimos reportes de compradores (${reasons}). Por favor revisá esto lo antes posible — si se repite, tu tienda puede ser suspendida.`
    );
    window.open(`https://wa.me/591${store.whatsapp.replace(/\D/g, "")}?text=${msg}`, "_blank");
    setWarnings((prev) => ({ ...prev, [store.id]: (prev[store.id] || 0) + 1 }));
    await fetch(`/api/platform/stores/${store.id}/warn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: `Motivos: ${reasons}` }),
    });
  }

  async function toggleSuspended(store: StoreInfo) {
    const nextStatus = store.status === "suspendida" ? "aprobada" : "suspendida";
    if (
      nextStatus === "suspendida" &&
      !window.confirm(`¿Suspender "${store.name}"? Su tienda pública deja de verse hasta que la reactives.`)
    ) {
      return;
    }
    setStoreState((prev) => ({ ...prev, [store.id]: { ...store, status: nextStatus } }));
    await fetch(`/api/platform/stores/${store.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
  }

  if (reports.length === 0) {
    return <p className="text-sm text-ink/50">Todavía no llegó ningún reporte.</p>;
  }

  return (
    <div className="space-y-4">
      {grouped.map(([storeId, storeReports]) => {
        const store = storeState[storeId];
        const openCount = storeReports.filter((r) => r.status === "abierto").length;
        if (!store) return null;
        return (
          <div key={storeId} className="animate-pop rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-ink">
                  {store.name} <span className="font-normal text-ink/40">/{store.slug}</span>
                </p>
                <p className="mt-0.5 flex flex-wrap gap-1.5 text-xs">
                  <span className={`rounded-full px-2 py-0.5 font-medium ${openCount > 0 ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-ink/40"}`}>
                    {openCount} reporte{openCount === 1 ? "" : "s"} abierto{openCount === 1 ? "" : "s"}
                  </span>
                  {(warnings[storeId] || 0) > 0 && (
                    <span className="rounded-full bg-coral-50 px-2 py-0.5 font-medium text-coral-700">
                      {warnings[storeId]} advertencia{warnings[storeId] === 1 ? "" : "s"}
                    </span>
                  )}
                  {store.status === "suspendida" && (
                    <span className="rounded-full bg-ink/80 px-2 py-0.5 font-medium text-white">Suspendida</span>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => notifySeller(store, storeReports)}
                  className="rounded-lg border border-amber-500 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"
                >
                  📣 Notificar al vendedor
                </button>
                <button
                  onClick={() => toggleSuspended(store)}
                  className="rounded-lg border border-ink/20 px-2.5 py-1 text-xs font-medium text-ink/70"
                >
                  {store.status === "suspendida" ? "▶ Reactivar tienda" : "⏸ Suspender tienda"}
                </button>
                <button
                  onClick={() => setDeleteModalStoreId(storeId)}
                  className="rounded-lg border border-coral-500 bg-coral-50 px-2.5 py-1 text-xs font-medium text-coral-600"
                >
                  🗑 Eliminar tienda
                </button>
              </div>
            </div>

            <div className="space-y-2 border-t border-ink/5 pt-3">
              {storeReports.map((r) => (
                <div key={r.id} className="rounded-xl bg-paper p-3">
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-ink">{reportReasonLabel(r.reason)}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${REPORT_STATUS_COLORS[r.status] || "bg-gray-100 text-ink/50"}`}>
                      {r.status}
                    </span>
                  </div>
                  {r.message && <p className="text-xs text-ink/60">{r.message}</p>}
                  {r.reporterContact && (
                    <p className="mt-1 text-[11px] text-ink/40">Contacto de quien reportó: {r.reporterContact}</p>
                  )}
                  <p className="mt-1 text-[11px] text-ink/35">
                    {new Date(r.createdAt).toLocaleString("es-BO")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.productId && (
                      <a
                        href={`/${store.slug}/producto/${r.productId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-ink/15 px-2 py-1 text-[11px] font-medium text-ink/60"
                      >
                        Ver producto ↗
                      </a>
                    )}
                    {r.orderId && (
                      <a
                        href={`/${store.slug}/pedido/${r.orderId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-ink/15 px-2 py-1 text-[11px] font-medium text-ink/60"
                      >
                        Ver pedido #{r.orderCode} ↗
                      </a>
                    )}
                    {r.status !== "revisado" && (
                      <button
                        onClick={() => updateReportStatus(r.id, "revisado")}
                        className="rounded-lg border border-jade-500 bg-jade-50 px-2 py-1 text-[11px] font-medium text-jade-700"
                      >
                        Marcar revisado
                      </button>
                    )}
                    {r.status !== "descartado" && (
                      <button
                        onClick={() => updateReportStatus(r.id, "descartado")}
                        className="rounded-lg border border-ink/15 px-2 py-1 text-[11px] font-medium text-ink/50"
                      >
                        Descartar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {deleteModalStoreId && storeState[deleteModalStoreId] && (
        <DeleteStoreModal
          store={storeState[deleteModalStoreId]}
          onClose={() => setDeleteModalStoreId(null)}
          onDeleted={() => {
            setStoreState((prev) => ({
              ...prev,
              [deleteModalStoreId]: { ...prev[deleteModalStoreId], status: "eliminada" },
            }));
            setDeleteModalStoreId(null);
          }}
        />
      )}
    </div>
  );
}

function DeleteStoreModal({
  store,
  onClose,
  onDeleted,
}: {
  store: StoreInfo;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [confirm1, setConfirm1] = useState("");
  const [confirm2, setConfirm2] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canDelete = confirm1 === CONFIRM_PHRASE && confirm2 === CONFIRM_PHRASE;

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/platform/stores/${store.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm1, confirm2 }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "No se pudo eliminar");
        setDeleting(false);
        return;
      }
      onDeleted();
    } catch {
      setError("Error de conexión");
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-5">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
        <h3 className="text-sm font-bold text-coral-600">Eliminar &quot;{store.name}&quot;</h3>
        <p className="mt-2 text-xs text-ink/60">
          Esto esconde la tienda de inmediato (dejan de verla los compradores), pero{" "}
          <strong>no borra sus datos</strong> — vas a poder ver su facturación en &quot;Tiendas
          eliminadas&quot; por 30 días, por si queda una liquidación pendiente.
        </p>
        <p className="mt-3 text-xs text-ink/60">
          Para confirmar, escribí <code className="rounded bg-paper px-1 py-0.5 font-mono">{CONFIRM_PHRASE}</code>{" "}
          dos veces:
        </p>
        <input
          value={confirm1}
          onChange={(e) => setConfirm1(e.target.value)}
          placeholder={CONFIRM_PHRASE}
          className="mt-2 w-full rounded-lg border border-ink/15 px-3 py-2 font-mono text-sm"
        />
        <input
          value={confirm2}
          onChange={(e) => setConfirm2(e.target.value)}
          placeholder={CONFIRM_PHRASE}
          className="mt-2 w-full rounded-lg border border-ink/15 px-3 py-2 font-mono text-sm"
        />
        {error && <p className="mt-2 text-xs text-coral-600">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleDelete}
            disabled={!canDelete || deleting}
            className="flex-1 rounded-full bg-coral-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deleting ? "Eliminando..." : "Eliminar definitivamente"}
          </button>
          <button
            onClick={onClose}
            className="rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-ink/60"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
