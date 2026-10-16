"use client";

import { useState } from "react";
import Link from "next/link";
import AdminProducts from "@/components/admin/AdminProducts";
import AdminOrders from "@/components/admin/AdminOrders";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminEarnings from "@/components/admin/AdminEarnings";
import AdminSupport from "@/components/admin/AdminSupport";
import RejectedBanner from "@/components/admin/RejectedBanner";
import SellerHome, {
  CopyLinkButton,
  useStoreUrl,
  type SellerChecklist,
  type SellerTab,
} from "@/components/admin/SellerHome";
import LogoutButton from "@/components/LogoutButton";
import AccountMenu from "@/components/AccountMenu";
import Icon, { type IconName } from "@/components/Icon";
import type { SellerOverview } from "@/lib/repo";

// Panel del vendedor por secciones, con la tienda pública siempre a un clic
// (botón fijo arriba) y la pestaña actual en la URL (?tab=...), así al
// recargar o compartir el link se vuelve a la misma sección.

const NAV: { key: SellerTab; label: string; icon: IconName; hint: string }[] = [
  { key: "inicio", label: "Inicio", icon: "panel", hint: "Cómo va tu tienda" },
  { key: "productos", label: "Productos", icon: "bag", hint: "Lo que vendes" },
  { key: "pedidos", label: "Pedidos", icon: "box", hint: "Lo que te compraron" },
  { key: "diseno", label: "Diseño", icon: "spark", hint: "Estilo, colores y logo" },
  { key: "billetera", label: "Billetera", icon: "wallet", hint: "Tus ganancias" },
  { key: "datos", label: "Datos y cobros", icon: "settings", hint: "Contacto, redes y QR" },
  { key: "soporte", label: "Ayuda", icon: "chat", hint: "Escríbenos" },
];

const STATUS_PILL: Record<string, { label: string; className: string }> = {
  aprobada: { label: "Publicada", className: "bg-jade-50 text-jade-700" },
  pendiente: { label: "En revisión", className: "bg-amber-50 text-amber-600" },
  rechazada: { label: "Rechazada", className: "bg-coral-50 text-coral-600" },
  suspendida: { label: "Suspendida", className: "bg-ink/5 text-ink/60" },
};

function LogoutIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M7.5 17.5h-3a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1h3" />
      <path d="M12.5 13.5 17 9l-4.5-4.5" />
      <path d="M17 9H7.5" />
    </svg>
  );
}

function StoreAvatar({ name, logoUrl, color, size = "h-9 w-9" }: { name: string; logoUrl: string | null; color: string; size?: string }) {
  return logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logoUrl} alt="" className={`${size} shrink-0 rounded-lg object-cover`} />
  ) : (
    <span
      className={`${size} flex shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white`}
      style={{ backgroundColor: color }}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

export default function AdminShell({
  slug,
  status,
  email,
  rejectionNote,
  store,
  overview,
  checklist,
  initialTab,
}: {
  slug: string;
  status: string;
  email: string;
  rejectionNote?: string | null;
  store: { name: string; ownerName: string | null; logoUrl: string | null; themeColor: string };
  overview: SellerOverview;
  checklist: SellerChecklist;
  initialTab: SellerTab;
}) {
  const [tab, setTabState] = useState<SellerTab>(initialTab);
  const url = useStoreUrl(slug);
  const approved = status === "aprobada";
  const current = NAV.find((n) => n.key === tab)!;
  const pill = STATUS_PILL[status] ?? { label: status, className: "bg-ink/5 text-ink/60" };

  function setTab(next: SellerTab) {
    setTabState(next);
    window.history.replaceState(null, "", next === "inicio" ? window.location.pathname : `?tab=${next}`);
    window.scrollTo({ top: 0 });
  }

  const badges: Partial<Record<SellerTab, number>> = { pedidos: overview.ordersToHandle };

  const visitLabel = approved ? "Ver mi tienda" : "Vista previa";

  return (
    <div className="flex min-h-screen bg-paper">
      {/* Columna lateral (escritorio) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-ink/5 bg-white md:flex">
        <div className="border-b border-ink/5 px-5 py-4">
          <Link href="/" className="inline-flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Dcompras" className="h-6 w-auto" />
          </Link>
          <div className="mt-4 flex items-center gap-2.5">
            <StoreAvatar name={store.name} logoUrl={store.logoUrl} color={store.themeColor} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">{store.name}</p>
              <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${pill.className}`}>
                {pill.label}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Secciones del panel">
          {NAV.map((item) => {
            const active = tab === item.key;
            const badge = badges[item.key] ?? 0;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                aria-current={active ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                  active ? "bg-jade-50 text-jade-700" : "text-ink/70 hover:bg-paper hover:text-ink"
                }`}
              >
                <Icon name={item.icon} className="h-[18px] w-[18px]" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className={`block truncate text-[11px] ${active ? "text-jade-700/70" : "text-ink/40"}`}>
                    {item.hint}
                  </span>
                </span>
                {badge > 0 && (
                  <span className="rounded-full bg-coral-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-ink/5 p-3">
          <a
            href={`/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-ink px-3 py-3 text-sm font-bold text-white transition hover:bg-ink-soft"
          >
            {visitLabel} <span aria-hidden="true">↗</span>
          </a>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra superior (escritorio): la tienda pública siempre a mano */}
        <header className="sticky top-0 z-10 hidden items-center justify-between gap-4 border-b border-ink/5 bg-white/95 px-8 py-3.5 backdrop-blur-sm md:flex">
          <div className="min-w-0">
            <h1 className="font-display text-lg font-bold text-ink">{current.label}</h1>
            <p className="text-xs text-ink/40">{current.hint}</p>
          </div>
          <div className="flex items-center gap-2">
            <CopyLinkButton
              url={url}
              className="inline-flex items-center gap-2 rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold text-ink/70 transition hover:border-ink/25 hover:text-ink"
            />
            <a
              href={`/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-jade-500 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-jade-600"
            >
              {visitLabel} <span aria-hidden="true">↗</span>
            </a>
            <AccountMenu email={email} redirectTo="/" />
          </div>
        </header>

        {/* Barra superior (celular) */}
        <div className="sticky top-0 z-20 border-b border-ink/5 bg-white md:hidden">
          <div className="flex items-center gap-2.5 px-4 py-2.5">
            <StoreAvatar name={store.name} logoUrl={store.logoUrl} color={store.themeColor} size="h-8 w-8" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">{store.name}</p>
              <span className={`inline-block rounded-full px-1.5 text-[10px] font-semibold ${pill.className}`}>
                {pill.label}
              </span>
            </div>
            <a
              href={`/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-jade-500 px-3.5 py-2 text-xs font-bold text-white"
            >
              {visitLabel} <span aria-hidden="true">↗</span>
            </a>
            <LogoutButton
              redirectTo="/"
              aria-label="Cerrar sesión"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ink/10 text-ink/40 transition hover:bg-coral-50 hover:text-coral-600"
            >
              <LogoutIcon />
            </LogoutButton>
          </div>
          <nav className="overflow-x-auto px-4 pb-2.5" aria-label="Secciones del panel">
            <ul className="flex w-max gap-1.5">
              {NAV.map((item) => {
                const active = tab === item.key;
                const badge = badges[item.key] ?? 0;
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => setTab(item.key)}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                        active ? "bg-ink text-white" : "bg-paper text-ink/60"
                      }`}
                    >
                      <Icon name={item.icon} mono={active} className="h-3.5 w-3.5" />
                      {item.label}
                      {badge > 0 && (
                        <span className="rounded-full bg-coral-500 px-1.5 text-[10px] font-bold text-white">
                          {badge}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-6 md:py-8">
          {status === "pendiente" && (
            <div className="mb-5 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <Icon name="clock" mono className="mt-0.5 h-4 w-4" />
              <span>
                Tu tienda está en revisión. Todavía no es visible al público ni puede recibir pedidos;
                te avisaremos por WhatsApp cuando esté aprobada. Mientras tanto puedes cargar tus
                productos y usar <span className="font-semibold">Vista previa</span> para ver cómo queda.
              </span>
            </div>
          )}
          {status === "rechazada" && <RejectedBanner slug={slug} rejectionNote={rejectionNote ?? null} />}

          {tab !== "inicio" && (
            <h1 className="mb-5 font-display text-xl font-bold text-ink md:hidden">{current.label}</h1>
          )}

          {tab === "inicio" && (
            <SellerHome
              slug={slug}
              storeName={store.name}
              ownerName={store.ownerName}
              status={status}
              overview={overview}
              checklist={checklist}
              goTo={setTab}
            />
          )}
          {tab === "productos" && <AdminProducts slug={slug} />}
          {tab === "pedidos" && <AdminOrders slug={slug} />}
          {tab === "diseno" && <AdminSettings slug={slug} section="diseno" />}
          {tab === "billetera" && <AdminEarnings slug={slug} />}
          {tab === "datos" && <AdminSettings slug={slug} section="datos" />}
          {tab === "soporte" && <AdminSupport slug={slug} />}
        </main>
      </div>
    </div>
  );
}
