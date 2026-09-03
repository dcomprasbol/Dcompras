import RevealOnScroll from "./RevealOnScroll";

// Vista previa del panel real del vendedor (components/admin/AdminOrders.tsx
// y AdminEarnings.tsx) — mismos nombres de estado que usa el producto de
// verdad, con datos de ejemplo en vez de pedidos reales.
const ORDERS = [
  { code: "#DC-1042", name: "Valeria R.", total: "Bs 189,00", status: "Pagado", color: "bg-green-100 text-green-800" },
  { code: "#DC-1041", name: "Marco T.", total: "Bs 245,00", status: "En preparación", color: "bg-blue-100 text-blue-800" },
  { code: "#DC-1039", name: "Camila S.", total: "Bs 90,00", status: "Enviado", color: "bg-gray-200 text-ink/70" },
];

export default function DashboardPreview() {
  return (
    <section className="px-5 py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
        <RevealOnScroll>
          <span className="text-xs font-semibold uppercase tracking-widest text-jade-600">
            Gestión
          </span>
          <h2 className="mt-3 font-impact text-3xl uppercase leading-[0.95] tracking-tight text-ink md:text-5xl">
            Todos tus pedidos, en un solo lugar.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink/60 md:text-base">
            Estado de cada pedido, cuánto vendiste y qué te queda por cobrar, sin abrir el chat
            para acordarte quién ya pagó.
          </p>
        </RevealOnScroll>

        <RevealOnScroll delay={100}>
          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-lg shadow-ink/5">
            <div className="grid grid-cols-3 gap-px bg-ink/5">
              {[
                { label: "Ventas del mes", value: "Bs 4.180" },
                { label: "Pedidos", value: "27" },
                { label: "Ticket prom.", value: "Bs 155" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white px-3 py-3">
                  <p className="font-mono text-sm font-bold text-ink sm:text-base">{stat.value}</p>
                  <p className="mt-0.5 text-[10px] text-ink/40">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="divide-y divide-ink/5">
              {ORDERS.map((o) => (
                <div key={o.code} className="flex items-center justify-between gap-2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-ink">
                      {o.code} <span className="font-normal text-ink/40">· {o.name}</span>
                    </p>
                    <p className="font-mono text-xs text-ink/60">{o.total}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-medium ${o.color}`}>
                    {o.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
