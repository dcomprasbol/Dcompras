import { formatBs } from "@/lib/utils";

type DailySales = { date: string; total: number; orders: number };

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("es-BO", { day: "numeric", month: "short", timeZone: "UTC" });
}

export default function SalesChart({ data }: { data: DailySales[] }) {
  const max = Math.max(1, ...data.map((d) => d.total));

  return (
    <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-sm font-bold text-ink">
        Ventas de los últimos {data.length} días
      </h2>
      <div className="flex h-40 items-end gap-1">
        {data.map((d) => {
          const heightPct = d.total > 0 ? Math.max(4, (d.total / max) * 100) : 0;
          return (
            <div key={d.date} className="group relative flex h-full flex-1 items-end">
              <div className="pointer-events-none absolute -top-2 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-xs text-white group-hover:block">
                {formatBs(d.total)} · {d.orders} pedido{d.orders === 1 ? "" : "s"}
                <br />
                {formatDayLabel(d.date)}
              </div>
              <div
                className="w-full rounded-t-md bg-jade-400 transition group-hover:bg-jade-500"
                style={{ height: `${heightPct}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1 text-[10px] text-ink/40">
        {data.map((d, i) => (
          <div key={d.date} className="flex-1 text-center">
            {i === 0 || i === data.length - 1 || i % Math.ceil(data.length / 6) === 0
              ? formatDayLabel(d.date)
              : ""}
          </div>
        ))}
      </div>
    </div>
  );
}
