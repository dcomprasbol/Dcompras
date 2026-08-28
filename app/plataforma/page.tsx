import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth";
import {
  listAllStores,
  getPlatformMetrics,
  getDailySales,
  getTopStoresBySales,
  getPlatformAlerts,
  listAllSupportMessages,
  listPendingPayoutRequests,
} from "@/lib/repo";
import { formatBs } from "@/lib/utils";
import { commissionPercent } from "@/lib/commission";
import AccountMenu from "@/components/AccountMenu";
import StatCard from "@/components/platform/StatCard";
import SalesChart from "@/components/platform/SalesChart";
import AlertsPanel from "@/components/platform/AlertsPanel";
import TopStores from "@/components/platform/TopStores";
import ReviewQueue from "@/components/platform/ReviewQueue";
import SupportInbox from "@/components/platform/SupportInbox";
import PayoutsPanel from "@/components/platform/PayoutsPanel";

export const dynamic = "force-dynamic";

export default async function PlataformaPage() {
  const admin = await requirePlatformAdmin();
  if (!admin) redirect("/");

  const [stores, metrics, dailySales, topStores, alerts, supportMessages, pendingPayouts] =
    await Promise.all([
      listAllStores(),
      getPlatformMetrics(),
      getDailySales(14),
      getTopStoresBySales(5),
      getPlatformAlerts(),
      listAllSupportMessages(),
      listPendingPayoutRequests(),
    ]);
  const openSupportCount = supportMessages.filter((m) => m.status === "abierto").length;
  const totalPendingPayout = pendingPayouts.reduce((s, p) => s + Number(p.netAmount), 0);

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-10 border-b border-ink/5 bg-white/95 px-5 py-4 backdrop-blur-sm md:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-jade-500 font-display text-lg font-bold text-white">
              D
            </span>
            <div>
              <p className="font-display text-base font-bold leading-tight text-ink">
                Panel de Dcompras
              </p>
              <p className="text-xs leading-tight text-ink/40">Administración de la plataforma</p>
            </div>
          </div>
          <AccountMenu email={admin.email ?? ""} redirectTo="/login" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            label="Ventas totales (GMV)"
            value={formatBs(metrics.totalGMV)}
            accent="jade"
          />
          <StatCard
            label="Pedidos"
            value={String(metrics.totalOrders)}
            sublabel={`${metrics.pendingPaymentOrders} sin confirmar pago`}
          />
          <StatCard label="Ticket promedio" value={formatBs(metrics.avgOrderValue)} />
          <StatCard
            label="Tiendas aprobadas"
            value={String(metrics.storesByStatus.aprobada)}
            sublabel={`${metrics.storesByStatus.pendiente} pendientes · ${metrics.storesByStatus.rechazada} rechazadas`}
            accent="amber"
          />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SalesChart data={dailySales} />
          </div>
          <AlertsPanel alerts={alerts} />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <TopStores stores={topStores} />
          <div className="lg:col-span-2" id="tiendas">
            <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
              <h2 className="mb-1 text-sm font-bold text-ink">Tiendas</h2>
              <p className="mb-3 text-xs text-ink/50">
                Aprueba una tienda solo después de confirmar que su WhatsApp es real (escríbele).
              </p>
              <ReviewQueue initialStores={stores} />
            </div>
          </div>
        </div>

        <div className="mb-6" id="liquidaciones">
          <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
            <div className="mb-1 flex items-center gap-2">
              <h2 className="text-sm font-bold text-ink">Liquidaciones solicitadas</h2>
              {totalPendingPayout > 0 && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  {formatBs(totalPendingPayout)} en total
                </span>
              )}
            </div>
            <p className="mb-3 text-xs text-ink/50">
              Vendedores que ya agendaron su liquidación desde su billetera — plata que está en la
              cuenta de Dcompras (ventas por QR automático) y esperan que se la transfieras.
              Comisión actual: {commissionPercent()}%. Transfiere a mano (con el QR o los datos de
              abajo) y subí el comprobante para cerrarla.
            </p>
            <PayoutsPanel initialPending={pendingPayouts} />
          </div>
        </div>

        <div className="mb-6" id="soporte">
          <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-sm font-bold text-ink">Mensajes de soporte</h2>
              {openSupportCount > 0 && (
                <span className="rounded-full bg-coral-500 px-2 py-0.5 text-xs font-semibold text-white">
                  {openSupportCount} abierto{openSupportCount === 1 ? "" : "s"}
                </span>
              )}
            </div>
            <SupportInbox initialMessages={supportMessages} />
          </div>
        </div>
      </main>
    </div>
  );
}
