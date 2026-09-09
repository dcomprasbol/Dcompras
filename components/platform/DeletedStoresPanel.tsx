import { formatBs } from "@/lib/utils";

type DeletedStoreSummary = {
  id: string;
  slug: string;
  name: string;
  deletedAt: string;
  pendingBalance: { grossAmount: number; netAmount: number; orderCount: number };
  payouts: {
    id: string;
    status: string;
    netAmount: number;
    createdAt: string;
    paidAt: string | null;
    confirmedAt: string | null;
  }[];
};

// Solo lectura — a diferencia de ReportsPanel, acá no hay nada para hacer
// más que MIRAR los datos de facturación de una tienda ya eliminada, por
// si queda plata pendiente de liquidar. Server component: los números ya
// vienen calculados de app/plataforma/page.tsx, no hace falta interactividad.
export default function DeletedStoresPanel({ stores }: { stores: DeletedStoreSummary[] }) {
  if (stores.length === 0) {
    return (
      <p className="text-sm text-ink/50">No hay tiendas eliminadas en los últimos 30 días.</p>
    );
  }

  return (
    <div className="space-y-3">
      {stores.map((store) => {
        const hasPending = store.pendingBalance.orderCount > 0;
        const daysAgo = Math.floor(
          (Date.now() - new Date(store.deletedAt).getTime()) / (24 * 60 * 60 * 1000)
        );
        return (
          <div key={store.id} className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
            <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-ink">
                  {store.name} <span className="font-normal text-ink/40">/{store.slug}</span>
                </p>
                <p className="text-xs text-ink/40">
                  Eliminada hace {daysAgo === 0 ? "hoy" : `${daysAgo} día${daysAgo === 1 ? "" : "s"}`}
                </p>
              </div>
              {hasPending && (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  ⚠️ Tiene {formatBs(store.pendingBalance.netAmount)} sin liquidar
                </span>
              )}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-paper p-2.5">
                <p className="text-ink/40">Pendiente de liquidar</p>
                <p className="font-mono text-sm font-bold text-ink">
                  {formatBs(store.pendingBalance.netAmount)}
                </p>
                <p className="text-[11px] text-ink/40">{store.pendingBalance.orderCount} pedido(s)</p>
              </div>
              <div className="rounded-lg bg-paper p-2.5">
                <p className="text-ink/40">Liquidaciones históricas</p>
                <p className="font-mono text-sm font-bold text-ink">{store.payouts.length}</p>
              </div>
            </div>

            {store.payouts.length > 0 && (
              <div className="mt-3 space-y-1 border-t border-ink/5 pt-2">
                {store.payouts.map((p) => (
                  <p key={p.id} className="flex items-center justify-between text-xs text-ink/60">
                    <span>
                      {p.status} · {new Date(p.createdAt).toLocaleDateString("es-BO")}
                    </span>
                    <span className="font-mono">{formatBs(p.netAmount)}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
