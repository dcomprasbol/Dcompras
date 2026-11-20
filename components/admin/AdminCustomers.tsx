"use client";

// "Mis clientes": la lista se arma sola con los pedidos. Filtros listos
// (mejores clientes, los que no compran hace rato, los que aceptan
// novedades) y "Mensaje a un grupo": se escribe una vez y se abren los
// chats de a uno con el mensaje ya pegado. Solo a quienes marcaron en el
// checkout que quieren recibir novedades — es lo correcto, y además evita
// que WhatsApp bloquee el número del vendedor por spam.

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "@/components/Icon";
import { formatBs } from "@/lib/utils";
import { whatsappNumber } from "@/lib/pickupRules";

type Customer = {
  phone: string;
  name: string;
  orders: number;
  totalSpent: number;
  firstOrderAt: string;
  lastOrderAt: string;
  optIn: boolean;
  topItems: string[];
};

type Filter = "todos" | "mejores" | "recurrentes" | "inactivos" | "novedades";

const INACTIVE_DAYS = 60;
const DAY = 24 * 60 * 60 * 1000;

export default function AdminCustomers({ slug }: { slug: string }) {
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [filter, setFilter] = useState<Filter>("todos");
  const [query, setQuery] = useState("");
  const [composing, setComposing] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [now] = useState(() => Date.now());

  useEffect(() => {
    fetch(`/api/stores/${slug}/customers`)
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers || []));
  }, [slug]);

  const bestThreshold = useMemo(() => {
    if (!customers || customers.length === 0) return Infinity;
    // "Mejores" = el 20% que más compró (al menos 1).
    const sorted = [...customers].sort((a, b) => b.totalSpent - a.totalSpent);
    return sorted[Math.max(0, Math.ceil(sorted.length * 0.2) - 1)].totalSpent;
  }, [customers]);

  const daysSince = (iso: string) => Math.floor((now - new Date(iso).getTime()) / DAY);

  const filters: { key: Filter; label: string; test: (c: Customer) => boolean; hint: string }[] = [
    { key: "todos", label: "Todos", test: () => true, hint: "Todas las personas que te compraron." },
    { key: "mejores", label: "Mejores clientes", test: (c) => c.totalSpent >= bestThreshold, hint: "El 20% que más te compró. Cuídalos: un mensaje personal hace la diferencia." },
    { key: "recurrentes", label: "Compran seguido", test: (c) => c.orders >= 2, hint: "Te compraron 2 veces o más." },
    { key: "inactivos", label: `Sin comprar +${INACTIVE_DAYS} días`, test: (c) => daysSince(c.lastOrderAt) > INACTIVE_DAYS, hint: "Hace rato que no vuelven. Una novedad o una oferta puede traerlos de vuelta." },
    { key: "novedades", label: "Aceptan novedades", test: (c) => c.optIn, hint: "Marcaron en el checkout que quieren enterarse de lo nuevo." },
  ];
  const active = filters.find((f) => f.key === filter)!;

  const list = useMemo(() => {
    if (!customers) return [];
    const q = query.trim().toLowerCase();
    return customers.filter(
      (c) => active.test(c) && (!q || c.name.toLowerCase().includes(q) || c.phone.includes(q.replace(/\D/g, "") || "\u0000"))
    );
  }, [customers, filter, query, bestThreshold]);

  const reachable = list.filter((c) => c.optIn);

  function openChat(c: Customer, text: string) {
    const personalized = text.replace(/\{nombre\}/gi, c.name.split(" ")[0]);
    window.open(`https://wa.me/${whatsappNumber(c.phone)}?text=${encodeURIComponent(personalized)}`, "_blank");
    setSent((prev) => new Set(prev).add(c.phone));
  }

  if (!customers) return <p className="text-sm text-ink/50">Cargando clientes...</p>;
  if (customers.length === 0) {
    return (
      <div className="rounded-2xl border border-ink/5 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-semibold text-ink">Todavía no tienes clientes</p>
        <p className="mt-1 text-sm text-ink/50">
          Cuando te compren, aquí vas a ver quién te compra, cuánto y qué le gusta, para volver a venderle.
        </p>
      </div>
    );
  }

  const totalOptIn = customers.filter((c) => c.optIn).length;

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Clientes", value: String(customers.length) },
          { label: "Compran seguido", value: String(customers.filter((c) => c.orders >= 2).length) },
          { label: "Aceptan novedades", value: String(totalOptIn) },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-ink/5 bg-white p-3 text-center shadow-sm">
            <p className="font-mono text-xl font-bold text-ink">{s.value}</p>
            <p className="text-[11px] text-ink/50">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => {
                setFilter(f.key);
                setSent(new Set());
              }}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                filter === f.key ? "bg-ink text-white" : "bg-paper text-ink/60 hover:text-ink"
              }`}
            >
              {f.label} ({customers.filter(f.test).length})
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink/50">{active.hint}</p>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o teléfono"
          className="mt-3 w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => setComposing((v) => !v)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-600"
        >
          <Icon name="megaphone" mono className="h-4 w-4" />
          {composing ? "Cerrar mensaje" : `Mensaje a este grupo (${reachable.length})`}
        </button>
      </div>

      {/* Mensaje a un grupo */}
      <AnimatePresence>
        {composing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-green-200 bg-white p-4 shadow-sm">
              <label className="text-xs font-semibold text-ink/70" htmlFor="group-msg">
                Escribe tu mensaje una vez
              </label>
              <textarea
                id="group-msg"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Hola {nombre} 👋 Llegó colección nueva 🔥 Mírala aquí: ..."
                className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
              />
              <p className="text-[11px] text-ink/45">
                Usa <span className="font-mono">{"{nombre}"}</span> y se reemplaza por el nombre de cada cliente.
              </p>
              {reachable.length === 0 ? (
                <p className="mt-3 rounded-xl bg-paper px-3 py-2 text-xs text-ink/60">
                  Nadie de este grupo aceptó recibir novedades todavía. Cuando tus clientes marquen la casilla en el
                  checkout, van a aparecer aquí.
                </p>
              ) : (
                <>
                  <p className="mt-3 text-xs text-ink/60">
                    Toca cada uno para abrir el chat con el mensaje listo ({sent.size} de {reachable.length} enviados):
                  </p>
                  <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                    {reachable.map((c) => (
                      <button
                        key={c.phone}
                        type="button"
                        disabled={!message.trim()}
                        onClick={() => openChat(c, message)}
                        className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-xs transition disabled:opacity-40 ${
                          sent.has(c.phone) ? "border-jade-400 bg-jade-50 text-jade-700" : "border-ink/15 hover:border-green-400"
                        }`}
                      >
                        <span className="truncate font-semibold">{c.name}</span>
                        <span className="shrink-0">{sent.has(c.phone) ? "✓ Enviado" : "Abrir chat →"}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {list.length > reachable.length && (
                <p className="mt-2 text-[11px] text-ink/40">
                  {list.length - reachable.length} cliente(s) de este grupo no aceptaron novedades: no les escribimos en grupo.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista */}
      <div className="space-y-2">
        {list.map((c) => {
          const days = daysSince(c.lastOrderAt);
          return (
            <div key={c.phone} className="rounded-2xl border border-ink/5 bg-white p-3.5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-1.5 text-sm font-bold text-ink">
                    {c.name}
                    {c.totalSpent >= bestThreshold && (
                      <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">⭐ Top</span>
                    )}
                    {c.optIn && (
                      <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">Acepta novedades</span>
                    )}
                  </p>
                  <p className="text-xs text-ink/50">
                    {c.orders} compra{c.orders === 1 ? "" : "s"} · {formatBs(c.totalSpent)} · última hace {days} día{days === 1 ? "" : "s"}
                  </p>
                  {c.topItems.length > 0 && (
                    <p className="mt-0.5 truncate text-[11px] text-jade-700">Compra: {c.topItems.join(" · ")}</p>
                  )}
                </div>
                <a
                  href={`https://wa.me/${whatsappNumber(c.phone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-lg border border-ink/15 px-2.5 py-1.5 text-xs font-semibold text-ink/70 hover:border-green-400"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          );
        })}
        {list.length === 0 && <p className="text-sm text-ink/50">Nadie coincide con este filtro.</p>}
      </div>
    </div>
  );
}
