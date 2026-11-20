"use client";

// Edición de precios en lote: elegir productos → elegir operación y
// redondeo → ver el antes/después → aplicar. Cada lote queda en un
// historial con "Deshacer". Pensado para el vendedor que re-precia cada
// semana por el dólar.

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "@/components/Icon";
import { formatBs, thumbUrl } from "@/lib/utils";
import { BULK_OPS, ROUNDINGS, type BulkOp, type Rounding } from "@/lib/bulkPricing";
import { tagLabel } from "@/lib/productTags";

type P = { id: string; name: string; price: number; compareAtPrice: number | null; imageUrl: string | null; tags?: string[] };
type PreviewRow = {
  productId: string;
  name: string;
  oldPrice: number;
  oldCompareAt: number | null;
  newPrice: number;
  newCompareAt: number | null;
  changed: boolean;
};
type Batch = { batchId: string; description: string; createdAt: string; count: number; reverted: boolean };

export default function BulkPriceEditor({
  slug,
  products,
  onClose,
  onApplied,
}: {
  slug: string;
  products: P[];
  onClose: () => void;
  onApplied: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tagFilter, setTagFilter] = useState<string>("todas");
  const [op, setOp] = useState<BulkOp>("pct_up");
  const [value, setValue] = useState("10");
  const [rounding, setRounding] = useState<Rounding>("end9");
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastBatch, setLastBatch] = useState<{ id: string; count: number } | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);

  const opInfo = BULK_OPS.find((o) => o.value === op)!;

  async function loadBatches() {
    const d = await fetch(`/api/stores/${slug}/products/bulk`).then((r) => r.json()).catch(() => ({}));
    setBatches(d.batches || []);
  }
  useEffect(() => {
    loadBatches();
  }, [slug]);

  // Filtro por etiqueta (las mismas del formulario de producto).
  const allTags = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of products) {
      for (const t of p.tags || []) {
        const label = tagLabel(t);
        if (label) m.set(t, label);
      }
    }
    return Array.from(m.entries());
  }, [products]);
  const visible = tagFilter === "todas" ? products : products.filter((p) => p.tags?.includes(tagFilter));
  const allVisibleSelected = visible.length > 0 && visible.every((p) => selected.has(p.id));

  function toggle(id: string) {
    setPreview(null);
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleAllVisible() {
    setPreview(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visible.forEach((p) => next.delete(p.id));
      else visible.forEach((p) => next.add(p.id));
      return next;
    });
  }

  async function run(apply: boolean) {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/stores/${slug}/products/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: Array.from(selected),
          op,
          value: opInfo.needsValue ? Number(value) : 0,
          rounding,
          preview: !apply,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || "No se pudo calcular");
        return;
      }
      if (apply) {
        setLastBatch({ id: d.batchId, count: d.applied });
        setPreview(null);
        setSelected(new Set());
        onApplied();
        loadBatches();
      } else {
        setPreview(d.rows);
      }
    } finally {
      setBusy(false);
    }
  }

  async function revert(batchId: string) {
    if (!window.confirm("¿Volver estos productos al precio que tenían antes de este cambio?")) return;
    setBusy(true);
    try {
      await fetch(`/api/stores/${slug}/products/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revertBatchId: batchId }),
      });
      if (lastBatch?.id === batchId) setLastBatch(null);
      onApplied();
      loadBatches();
    } finally {
      setBusy(false);
    }
  }

  const changedCount = preview?.filter((r) => r.changed).length ?? 0;

  return (
    <div className="mb-4 rounded-2xl border border-jade-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-ink">Editar precios en lote</h2>
          <p className="text-xs text-ink/50">
            Elige productos, la operación y mira cómo quedan antes de aplicar. Siempre puedes deshacer.
          </p>
        </div>
        <button type="button" onClick={onClose} className="text-xs font-medium text-ink/50 hover:text-ink">
          Cerrar
        </button>
      </div>

      <AnimatePresence>
        {lastBatch && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-3 flex items-center justify-between gap-2 rounded-xl bg-jade-50 px-3 py-2 text-xs text-jade-700"
          >
            <span>
              <Icon name="check" mono className="mr-1 h-3.5 w-3.5" />
              Listo: cambiaste el precio de {lastBatch.count} producto{lastBatch.count === 1 ? "" : "s"}.
            </span>
            <button type="button" onClick={() => revert(lastBatch.id)} className="font-semibold underline" disabled={busy}>
              Deshacer
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Productos */}
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink/40">1. Productos ({selected.size} elegidos)</p>
      {allTags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {[["todas", "Todos"] as [string, string], ...allTags].map(([v, l]) => (
            <button
              key={v}
              type="button"
              onClick={() => setTagFilter(v)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                tagFilter === v ? "bg-ink text-white" : "bg-paper text-ink/60"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      )}
      <div className="max-h-56 overflow-y-auto rounded-xl border border-ink/10">
        <label className="flex cursor-pointer items-center gap-2 border-b border-ink/5 bg-paper px-3 py-2 text-xs font-semibold text-ink/70">
          <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} />
          Seleccionar todos{tagFilter !== "todas" ? " los de esta etiqueta" : ""} ({visible.length})
        </label>
        {visible.map((p) => (
          <label key={p.id} className="flex cursor-pointer items-center gap-2.5 border-b border-ink/5 px-3 py-1.5 last:border-0">
            <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
            <span className="h-8 w-8 shrink-0 overflow-hidden rounded bg-paper">
              {p.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbUrl(p.imageUrl)} alt="" className="h-full w-full object-cover" />
              )}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-ink">{p.name}</span>
            <span className="shrink-0 font-mono text-xs text-ink/60">{formatBs(p.price)}</span>
          </label>
        ))}
      </div>

      {/* 2. Operación */}
      <p className="mb-1.5 mt-4 text-xs font-semibold uppercase tracking-wide text-ink/40">2. ¿Qué cambio?</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <select
          value={op}
          onChange={(e) => {
            setOp(e.target.value as BulkOp);
            setPreview(null);
          }}
          className="rounded-lg border border-ink/15 px-2.5 py-2 text-sm sm:col-span-1"
        >
          {BULK_OPS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {opInfo.needsValue && (
          <div className="flex items-center rounded-lg border border-ink/15 px-2.5">
            {opInfo.unit === "Bs" && <span className="text-sm text-ink/40">Bs</span>}
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setPreview(null);
              }}
              className="w-full bg-transparent px-1.5 py-2 text-sm outline-none"
            />
            {opInfo.unit === "%" && <span className="text-sm text-ink/40">%</span>}
          </div>
        )}
        {op !== "remove_offer" && (
          <select
            value={rounding}
            onChange={(e) => {
              setRounding(e.target.value as Rounding);
              setPreview(null);
            }}
            className="rounded-lg border border-ink/15 px-2.5 py-2 text-sm"
          >
            {ROUNDINGS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-coral-600">{error}</p>}

      {/* 3. Vista previa */}
      {!preview ? (
        <button
          type="button"
          onClick={() => run(false)}
          disabled={busy || selected.size === 0}
          className="mt-4 w-full rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {busy ? "Calculando..." : `Ver cómo quedan (${selected.size})`}
        </button>
      ) : (
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink/40">3. Revisa antes de aplicar</p>
          <div className="max-h-64 overflow-y-auto rounded-xl border border-ink/10">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-paper text-left text-ink/50">
                <tr>
                  <th className="px-3 py-2 font-semibold">Producto</th>
                  <th className="px-2 py-2 text-right font-semibold">Antes</th>
                  <th className="px-3 py-2 text-right font-semibold">Después</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((r) => (
                  <tr key={r.productId} className={`border-t border-ink/5 ${r.changed ? "" : "text-ink/35"}`}>
                    <td className="max-w-[10rem] truncate px-3 py-1.5">{r.name}</td>
                    <td className="px-2 py-1.5 text-right font-mono">
                      {formatBs(r.oldPrice)}
                      {r.oldCompareAt != null && r.oldCompareAt > r.oldPrice && (
                        <span className="block text-[10px] line-through">{formatBs(r.oldCompareAt)}</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono font-bold text-ink">
                      {r.changed ? (
                        <>
                          {formatBs(r.newPrice)}
                          {r.newCompareAt != null && (
                            <span className="block text-[10px] font-normal text-coral-600 line-through">{formatBs(r.newCompareAt)}</span>
                          )}
                        </>
                      ) : (
                        <span className="font-normal">sin cambio</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-ink/45">Los pedidos que ya te hicieron mantienen su precio.</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="rounded-xl border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink/70"
            >
              Cambiar algo
            </button>
            <button
              type="button"
              onClick={() => run(true)}
              disabled={busy || changedCount === 0}
              className="rounded-xl bg-jade-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-jade-600 disabled:opacity-40"
            >
              {busy ? "Aplicando..." : `Aplicar a ${changedCount}`}
            </button>
          </div>
        </div>
      )}

      {/* Historial con deshacer */}
      {batches.length > 0 && (
        <details className="group mt-4 border-t border-ink/5 pt-3">
          <summary className="cursor-pointer list-none text-xs font-semibold text-ink/50 hover:text-ink">
            <span className="inline-block transition group-open:rotate-90">
              <Icon name="chevron" className="h-3 w-3" />
            </span>{" "}
            Últimos cambios en lote
          </summary>
          <div className="mt-2 space-y-1.5">
            {batches.map((b) => (
              <div key={b.batchId} className="flex items-center justify-between gap-2 rounded-lg bg-paper px-3 py-2 text-xs">
                <span className="min-w-0">
                  <span className="font-semibold text-ink">{b.description}</span>
                  <span className="text-ink/50">
                    {" "}
                    · {b.count} producto{b.count === 1 ? "" : "s"} · {new Date(b.createdAt).toLocaleString("es-BO")}
                  </span>
                </span>
                {b.reverted ? (
                  <span className="shrink-0 text-ink/40">Deshecho</span>
                ) : (
                  <button type="button" onClick={() => revert(b.batchId)} disabled={busy} className="shrink-0 font-semibold text-jade-600">
                    Deshacer
                  </button>
                )}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
