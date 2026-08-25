import Link from "next/link";
import { formatBs } from "@/lib/utils";

type TopStore = { slug: string; name: string; total: number; orders: number };

const MEDALS = ["🥇", "🥈", "🥉"];

export default function TopStores({ stores }: { stores: TopStore[] }) {
  return (
    <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-bold text-ink">Tiendas con más ventas</h2>
      {stores.length === 0 ? (
        <p className="text-sm text-ink/50">Todavía no hay pedidos registrados.</p>
      ) : (
        <ul className="space-y-2">
          {stores.map((store, i) => (
            <li key={store.slug}>
              <Link
                href={`/admin/${store.slug}`}
                className="flex items-center justify-between rounded-xl px-2 py-1.5 text-sm transition hover:bg-paper"
              >
                <span className="flex items-center gap-2 text-ink/80">
                  <span className="w-5 text-center">{MEDALS[i] || `#${i + 1}`}</span>
                  {store.name}
                </span>
                <span className="text-right font-mono text-xs text-ink/50">
                  {formatBs(store.total)}
                  <br />
                  {store.orders} pedido{store.orders === 1 ? "" : "s"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
