"use client";

import { useMemo, useState } from "react";
import { categoryLabel, formatBs } from "@/lib/utils";
import Icon from "@/components/Icon";
import { DeleteStoreModal, SuspendStoreModal } from "@/components/platform/StoreModerationModals";

// Directorio de todas las tiendas (menos las eliminadas) para el admin:
// buscar, filtrar por estado y abrir la tienda con un clic en otra pestaña.
// Las que no están aprobadas igual se pueden abrir: el layout de la tienda
// deja pasar al admin de plataforma con un aviso de "vista de administrador".

export type DirectoryStore = {
  id: string;
  slug: string;
  name: string;
  ownerName: string | null;
  city: string | null;
  category: string | null;
  status: string;
  themeColor: string;
  logoUrl: string | null;
  createdAt: string;
  whatsapp: string | null;
  suspensionNote: string | null;
  products: number;
  orders: number;
  sales: number;
};

const STATUS: Record<string, { label: string; className: string }> = {
  aprobada: { label: "Aprobada", className: "bg-jade-50 text-jade-700" },
  pendiente: { label: "Pendiente", className: "bg-amber-50 text-amber-600" },
  rechazada: { label: "Rechazada", className: "bg-coral-50 text-coral-600" },
  suspendida: { label: "Suspendida", className: "bg-ink/5 text-ink/60" },
};

const FILTERS = ["todas", "aprobada", "pendiente", "rechazada", "suspendida"] as const;
type Filter = (typeof FILTERS)[number];

const FILTER_LABEL: Record<Filter, string> = {
  todas: "Todas",
  aprobada: "Aprobadas",
  pendiente: "Pendientes",
  rechazada: "Rechazadas",
  suspendida: "Suspendidas",
};

function normalize(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function StoreDirectory({ stores: initialStores }: { stores: DirectoryStore[] }) {
  const [stores, setStores] = useState(initialStores);
  const [suspendId, setSuspendId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("todas");

  const counts = useMemo(() => {
    const c: Record<string, number> = { todas: stores.length };
    for (const s of stores) c[s.status] = (c[s.status] || 0) + 1;
    return c;
  }, [stores]);

  const visible = useMemo(() => {
    const q = normalize(query.trim());
    return stores.filter((s) => {
      if (filter !== "todas" && s.status !== filter) return false;
      if (!q) return true;
      return [s.name, s.slug, s.city ?? "", s.ownerName ?? "", categoryLabel(s.category)]
        .some((field) => normalize(field).includes(q));
    });
  }, [stores, query, filter]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, link, ciudad o dueño…"
          className="w-full rounded-xl border border-ink/10 bg-paper px-3.5 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-jade-500 focus:outline-none sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.filter((f) => f === "todas" || counts[f]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                filter === f ? "bg-ink text-white" : "bg-paper text-ink/60 hover:text-ink"
              }`}
            >
              {FILTER_LABEL[f]} <span className="opacity-60">{counts[f] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink/50">
          {stores.length === 0 ? "Todavía no hay tiendas registradas." : "Ninguna tienda coincide con la búsqueda."}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((s) => {
            const status = STATUS[s.status] ?? { label: s.status, className: "bg-ink/5 text-ink/60" };
            return (
              <li key={s.id} className="flex flex-col overflow-hidden rounded-xl border border-ink/5 bg-paper transition hover:border-ink/15 hover:bg-white hover:shadow-sm">
                <a
                  href={`/${s.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-1 flex-col p-3.5"
                >
                  <div className="flex items-start gap-3">
                    {s.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.logoUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                        style={{ backgroundColor: s.themeColor }}
                        aria-hidden="true"
                      >
                        {s.name.trim().charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">{s.name}</p>
                      <p className="truncate text-xs text-ink/40">/{s.slug}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.className}`}>
                      {status.label}
                    </span>
                  </div>

                  <p className="mt-2.5 truncate text-xs text-ink/50">
                    {[s.city, categoryLabel(s.category)].filter(Boolean).join(" · ")}
                  </p>
                  <p className="mt-1 font-mono text-xs text-ink/60">
                    {s.products} producto{s.products === 1 ? "" : "s"} · {s.orders} pedido
                    {s.orders === 1 ? "" : "s"} · {formatBs(s.sales)}
                  </p>

                  <div className="mt-auto flex items-center justify-between pt-3 text-xs">
                    <span className="text-ink/35">
                      Desde {new Date(s.createdAt).toLocaleDateString("es-BO")}
                    </span>
                    <span className="font-semibold text-jade-600 group-hover:underline">
                      Ver tienda ↗
                    </span>
                  </div>
                  {s.status === "suspendida" && s.suspensionNote && (
                    <p className="mt-2 line-clamp-2 rounded-lg bg-ink/5 px-2 py-1.5 text-[11px] text-ink/60">
                      Motivo: {s.suspensionNote}
                    </p>
                  )}
                </a>
                <div className="flex border-t border-ink/5 text-xs font-semibold">
                  {(s.status === "aprobada" || s.status === "suspendida") && (
                    <button
                      type="button"
                      onClick={() => setSuspendId(s.id)}
                      className="flex flex-1 items-center justify-center gap-1.5 py-2 text-ink/60 transition hover:bg-ink/5 hover:text-ink"
                    >
                      <Icon name={s.status === "suspendida" ? "play" : "pause"} mono className="h-3 w-3" />
                      {s.status === "suspendida" ? "Reactivar" : "Suspender"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDeleteId(s.id)}
                    className="flex flex-1 items-center justify-center gap-1.5 border-l border-ink/5 py-2 text-coral-600 transition hover:bg-coral-50"
                  >
                    <Icon name="trash" mono className="h-3.5 w-3.5" />
                    Eliminar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {suspendId && stores.find((x) => x.id === suspendId) && (
        <SuspendStoreModal
          store={stores.find((x) => x.id === suspendId)!}
          onClose={() => setSuspendId(null)}
          onChanged={(status, note) =>
            setStores((prev) => prev.map((x) => (x.id === suspendId ? { ...x, status, suspensionNote: note } : x)))
          }
        />
      )}
      {deleteId && stores.find((x) => x.id === deleteId) && (
        <DeleteStoreModal
          store={stores.find((x) => x.id === deleteId)!}
          onClose={() => {
            // Recién al cerrar la sacamos de la lista, así se puede leer el resultado del correo.
            setStores((prev) => prev.filter((x) => !(x.id === deleteId && x.status === "eliminada")));
            setDeleteId(null);
          }}
          onDeleted={() =>
            setStores((prev) => prev.map((x) => (x.id === deleteId ? { ...x, status: "eliminada" } : x)))
          }
        />
      )}
    </div>
  );
}
