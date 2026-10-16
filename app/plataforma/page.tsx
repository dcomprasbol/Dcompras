import Link from "next/link";
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
  listAllReports,
  listAllStoreWarnings,
  listDeletedStores,
  getPendingBalance,
  listPayoutsByStore,
  listStoreActivity,
} from "@/lib/repo";
import { formatBs } from "@/lib/utils";
import { commissionPercent } from "@/lib/commission";
import AccountMenu from "@/components/AccountMenu";
import Icon, { type IconName } from "@/components/Icon";
import StatCard from "@/components/platform/StatCard";
import SalesChart from "@/components/platform/SalesChart";
import AlertsPanel from "@/components/platform/AlertsPanel";
import TopStores from "@/components/platform/TopStores";
import ReviewQueue from "@/components/platform/ReviewQueue";
import SupportInbox from "@/components/platform/SupportInbox";
import PayoutsPanel from "@/components/platform/PayoutsPanel";
import ReportsPanel from "@/components/platform/ReportsPanel";
import DeletedStoresPanel from "@/components/platform/DeletedStoresPanel";
import StoreDirectory from "@/components/platform/StoreDirectory";
import PlatformNav, {
  isPlatformSection,
  sectionHref,
  type PlatformSection,
} from "@/components/platform/PlatformNav";

export const dynamic = "force-dynamic";

// Panel interno de la plataforma, dividido en secciones (?seccion=...) en
// vez de una sola página con todo. Cada sección consulta solo lo que
// muestra; lo único que se trae siempre son las listas chicas que alimentan
// los contadores de pendientes del menú.
export default async function PlataformaPage({
  searchParams,
}: {
  searchParams: { seccion?: string };
}) {
  const admin = await requirePlatformAdmin();
  if (!admin) redirect("/");

  const section: PlatformSection = isPlatformSection(searchParams.seccion)
    ? searchParams.seccion
    : "resumen";

  const [stores, supportMessages, pendingPayouts, reports] = await Promise.all([
    listAllStores(),
    listAllSupportMessages(),
    listPendingPayoutRequests(),
    listAllReports(),
  ]);
  const pendingStoresCount = stores.filter((s) => s.status === "pendiente").length;
  // Solicitudes = lo que falta decidir (pendientes) y lo rechazado; las
  // aprobadas/suspendidas se ven en Tiendas y se moderan desde Reportes.
  const reviewStores = stores.filter((s) => s.status === "pendiente" || s.status === "rechazada");
  const openSupportCount = supportMessages.filter((m) => m.status === "abierto").length;
  const openReportsCount = reports.filter((r) => r.status === "abierto").length;
  const totalPendingPayout = pendingPayouts.reduce((s, p) => s + Number(p.netAmount), 0);
  const counts: Partial<Record<PlatformSection, number>> = {
    solicitudes: pendingStoresCount,
    liquidaciones: pendingPayouts.length,
    moderacion: openReportsCount,
    soporte: openSupportCount,
  };

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-10 border-b border-ink/5 bg-white/95 px-5 py-4 backdrop-blur-sm md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/plataforma" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Dcompras" className="h-6 w-auto" />
            <div className="border-l border-ink/10 pl-3">
              <p className="text-xs font-semibold leading-tight text-ink/60">Panel interno</p>
              <p className="text-xs leading-tight text-ink/40">Administración de la plataforma</p>
            </div>
          </Link>
          <AccountMenu email={admin.email ?? ""} redirectTo="/login" />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-6 md:flex md:gap-8 md:py-8">
        <PlatformNav current={section} counts={counts} />
        <main className="min-w-0 flex-1">
          {section === "resumen" && (
            <ResumenSection
              pendingStoresCount={pendingStoresCount}
              pendingPayoutsCount={pendingPayouts.length}
              totalPendingPayout={totalPendingPayout}
              openReportsCount={openReportsCount}
              openSupportCount={openSupportCount}
            />
          )}

          {section === "solicitudes" && (
            <Section
              title="Solicitudes de tiendas"
              description="Tiendas nuevas esperando revisión (y las que rechazaste). Aprueba una tienda solo después de confirmar que su WhatsApp es real (escríbele). Las ya aprobadas están en Tiendas."
            >
              {reviewStores.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm font-semibold text-ink">No hay solicitudes pendientes</p>
                  <p className="mt-1 text-sm text-ink/50">
                    Todas las tiendas están revisadas.{" "}
                    <Link href={sectionHref("tiendas")} className="font-semibold text-jade-600 hover:underline">
                      Ver todas las tiendas →
                    </Link>
                  </p>
                </div>
              ) : (
                <ReviewQueue initialStores={reviewStores} />
              )}
            </Section>
          )}

          {section === "tiendas" && <TiendasSection stores={stores} />}

          {section === "liquidaciones" && (
            <Section
              title="Liquidaciones solicitadas"
              badge={totalPendingPayout > 0 ? `${formatBs(totalPendingPayout)} en total` : undefined}
              description={`Vendedores que ya agendaron su liquidación desde su billetera: plata que está en la cuenta de Dcompras (ventas por QR automático) y esperan que se la transfieras. Comisión actual: ${commissionPercent()}%. Transfiere a mano (con el QR o los datos de abajo) y sube el comprobante; la liquidación queda cerrada recién cuando el propio vendedor confirma que le llegó.`}
            >
              <PayoutsPanel initialPending={pendingPayouts} />
            </Section>
          )}

          {section === "moderacion" && <ModeracionSection stores={stores} reports={reports} />}

          {section === "soporte" && (
            <Section title="Mensajes de soporte" description="Consultas que los vendedores te mandan desde su panel.">
              <SupportInbox initialMessages={supportMessages} />
            </Section>
          )}
        </main>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  badge,
  children,
}: {
  title: string;
  description?: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-xl font-bold text-ink">{title}</h1>
          {badge && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
              {badge}
            </span>
          )}
        </div>
        {description && <p className="mt-1 max-w-3xl text-sm text-ink/50">{description}</p>}
      </div>
      <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">{children}</div>
    </section>
  );
}

function QuickLink({
  section,
  icon,
  label,
  count,
  detail,
}: {
  section: PlatformSection;
  icon: IconName;
  label: string;
  count: number;
  detail: string;
}) {
  const pending = count > 0;
  return (
    <Link
      href={sectionHref(section)}
      className={`group flex items-center gap-3 rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 ${
        pending ? "border-coral-200 bg-white" : "border-ink/5 bg-white"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          pending ? "bg-ink text-white" : "bg-paper text-ink/40"
        }`}
      >
        <Icon name={icon} className="h-5 w-5" mono={!pending} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-ink">
          {count} {label}
        </span>
        <span className="block truncate text-xs text-ink/50">{detail}</span>
      </span>
      <span className="ml-auto text-ink/30 transition group-hover:text-ink" aria-hidden="true">
        →
      </span>
    </Link>
  );
}

async function ResumenSection({
  pendingStoresCount,
  pendingPayoutsCount,
  totalPendingPayout,
  openReportsCount,
  openSupportCount,
}: {
  pendingStoresCount: number;
  pendingPayoutsCount: number;
  totalPendingPayout: number;
  openReportsCount: number;
  openSupportCount: number;
}) {
  const [metrics, dailySales, topStores, alerts] = await Promise.all([
    getPlatformMetrics(),
    getDailySales(14),
    getTopStoresBySales(5),
    getPlatformAlerts(),
  ]);

  return (
    <>
      <h1 className="mb-4 font-display text-xl font-bold text-ink">Resumen</h1>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Ventas totales (GMV)" value={formatBs(metrics.totalGMV)} accent="jade" />
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

      <h2 className="mb-3 text-sm font-bold text-ink">Pendientes</h2>
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <QuickLink
          section="solicitudes"
          icon="clock"
          label={pendingStoresCount === 1 ? "tienda por aprobar" : "tiendas por aprobar"}
          count={pendingStoresCount}
          detail="Revisa y aprueba las tiendas nuevas"
        />
        <QuickLink
          section="liquidaciones"
          icon="wallet"
          label={pendingPayoutsCount === 1 ? "liquidación pendiente" : "liquidaciones pendientes"}
          count={pendingPayoutsCount}
          detail={pendingPayoutsCount > 0 ? `${formatBs(totalPendingPayout)} por transferir` : "Nada por transferir"}
        />
        <QuickLink
          section="moderacion"
          icon="alert"
          label={openReportsCount === 1 ? "reporte abierto" : "reportes abiertos"}
          count={openReportsCount}
          detail="Reportes de compradores sobre productos y pedidos"
        />
        <QuickLink
          section="soporte"
          icon="chat"
          label={openSupportCount === 1 ? "mensaje sin responder" : "mensajes sin responder"}
          count={openSupportCount}
          detail="Consultas de los vendedores"
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesChart data={dailySales} />
        </div>
        <AlertsPanel alerts={alerts} />
      </div>

      <TopStores stores={topStores} />
    </>
  );
}

async function TiendasSection({ stores }: { stores: Awaited<ReturnType<typeof listAllStores>> }) {
  const activity = await listStoreActivity();
  const activityByStore = new Map(activity.map((a) => [a.storeId, a]));
  const directoryStores = stores.map((s) => {
    const a = activityByStore.get(s.id);
    return {
      id: s.id,
      slug: s.slug,
      name: s.name,
      ownerName: s.ownerName,
      city: s.city,
      category: s.category,
      status: s.status,
      themeColor: s.themeColor,
      logoUrl: s.logoUrl,
      createdAt: s.createdAt,
      products: a?.products ?? 0,
      orders: a?.orders ?? 0,
      sales: Number(a?.sales ?? 0),
    };
  });

  return (
    <Section
      title="Todas las tiendas"
      description="Haz clic en una tienda para verla en una pestaña nueva. Las que todavía no están aprobadas solo las puedes ver tú, como administrador."
    >
      <StoreDirectory stores={directoryStores} />
    </Section>
  );
}

async function ModeracionSection({
  stores,
  reports,
}: {
  stores: Awaited<ReturnType<typeof listAllStores>>;
  reports: Awaited<ReturnType<typeof listAllReports>>;
}) {
  const [warnings, deletedStores] = await Promise.all([listAllStoreWarnings(), listDeletedStores(30)]);
  const warningCounts: Record<string, number> = {};
  for (const w of warnings) warningCounts[w.storeId] = (warningCounts[w.storeId] || 0) + 1;
  // Facturación de cada tienda eliminada, para que el admin la vea sin
  // tener que ir tienda por tienda — son pocas filas (soft-deletes
  // recientes), así que un query por tienda acá es plenamente aceptable.
  const deletedStoreSummaries = await Promise.all(
    deletedStores.map(async (s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      deletedAt: s.deletedAt as string,
      pendingBalance: await getPendingBalance(s.id),
      payouts: await listPayoutsByStore(s.id),
    }))
  );

  return (
    <>
      <Section
        title="Reportes y moderación"
        description="Reportes de compradores sobre productos (ilegal, sospechoso) o pedidos puntuales (no llegó, defectuoso). El vendedor sigue siendo el responsable de lo que vende (Términos y Condiciones); esto es para que la plataforma pueda intervenir si hace falta: amonestar, suspender o eliminar a un vendedor con reportes reiterados."
      >
        <ReportsPanel
          initialReports={reports}
          warningCounts={warningCounts}
          stores={stores.map((s) => ({ id: s.id, slug: s.slug, name: s.name, whatsapp: s.whatsapp, status: s.status }))}
        />
      </Section>

      <Section
        title="Tiendas eliminadas"
        description="Al eliminar una tienda desde Reportes nunca se borra de verdad: queda acá, visible por 30 días, para que puedas revisar si le quedó plata pendiente de liquidar antes de que se pierda de vista."
      >
        <DeletedStoresPanel stores={deletedStoreSummaries} />
      </Section>
    </>
  );
}
