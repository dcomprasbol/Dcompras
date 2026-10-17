"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Icon from "@/components/Icon";
import StoreCard from "@/components/directory/StoreCard";
import { STORE_CATEGORIES } from "@/lib/utils";
import { normalizeCategory } from "@/lib/categoryVisuals";
import type { PublicStore } from "@/lib/repo";

// Buscador del directorio público: texto libre (nombre, frase, ciudad) +
// filtro por rubro. Las tarjetas se reacomodan con animación al filtrar.
function normalize(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function PublicStoreBrowser({
  stores,
  initialCategory = "todas",
}: {
  stores: PublicStore[];
  initialCategory?: string;
}) {
  const reduce = useReducedMotion();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory);

  const counts = useMemo(() => {
    const c: Record<string, number> = { todas: stores.length };
    for (const s of stores) {
      const k = normalizeCategory(s.category);
      c[k] = (c[k] || 0) + 1;
    }
    return c;
  }, [stores]);

  const visible = useMemo(() => {
    const q = normalize(query.trim());
    return stores.filter((s) => {
      if (category !== "todas" && normalizeCategory(s.category) !== category) return false;
      if (!q) return true;
      return [s.name, s.tagline ?? "", s.city ?? ""].some((f) => normalize(f).includes(q));
    });
  }, [stores, query, category]);

  const chips = [{ value: "todas", label: "Todas" }, ...STORE_CATEGORIES.filter((c) => counts[c.value])];

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <label className="relative block w-full md:max-w-sm">
          <span className="sr-only">Buscar tiendas</span>
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden="true">
            <path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, ciudad o lo que venden…"
            className="w-full border border-ink/15 bg-white py-3 pl-10 pr-4 text-sm text-ink placeholder:text-ink/40 focus:border-ink focus:outline-none"
          />
        </label>
        <p className="font-mono text-xs text-ink/45">
          {visible.length} de {stores.length} tienda{stores.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="-mx-5 mt-4 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-2">
          {chips.map((c) => {
            const active = category === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                aria-pressed={active}
                className={`relative flex items-center gap-1.5 border px-3.5 py-2 text-xs font-semibold transition ${
                  active ? "border-ink text-white" : "border-ink/15 bg-white text-ink/60 hover:border-ink/40 hover:text-ink"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="chip-bg"
                    className="absolute inset-0 bg-ink"
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">{c.label}</span>
                <span className={`relative font-mono text-[10px] ${active ? "text-jade-400" : "text-ink/35"}`}>{counts[c.value] || 0}</span>
              </button>
            );
          })}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="mt-10 flex flex-col items-center border border-dashed border-ink/15 bg-white px-6 py-14 text-center">
          <Icon name="bag" className="h-8 w-8 text-ink/30" />
          <p className="mt-3 text-sm font-semibold text-ink">No encontramos tiendas con esa búsqueda</p>
          <button type="button" onClick={() => { setQuery(""); setCategory("todas"); }} className="mt-2 text-sm font-semibold text-jade-600 hover:underline">
            Ver todas las tiendas
          </button>
        </div>
      ) : (
        <motion.ul layout={!reduce} className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false} mode="popLayout">
            {visible.map((s, i) => (
              <motion.li
                key={s.slug}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduce ? undefined : { opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 260, damping: 26, delay: reduce ? 0 : Math.min(i, 8) * 0.04 }}
              >
                <StoreCard store={s} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}
