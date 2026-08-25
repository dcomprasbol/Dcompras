"use client";

import { useState } from "react";
import Link from "next/link";
import AdminProducts from "@/components/admin/AdminProducts";
import AdminOrders from "@/components/admin/AdminOrders";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminEarnings from "@/components/admin/AdminEarnings";
import AdminSupport from "@/components/admin/AdminSupport";
import RejectedBanner from "@/components/admin/RejectedBanner";
import LogoutButton from "@/components/LogoutButton";
import AccountMenu from "@/components/AccountMenu";

type Tab = "cuenta" | "productos" | "pedidos" | "ganancias" | "soporte";

const NAV: { key: Tab; label: string; icon: string }[] = [
  { key: "cuenta", label: "Cuenta", icon: "⚙️" },
  { key: "productos", label: "Productos", icon: "🛍️" },
  { key: "pedidos", label: "Pedidos", icon: "📦" },
  { key: "ganancias", label: "Ganancias", icon: "💰" },
  { key: "soporte", label: "Soporte", icon: "💬" },
];

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

export default function AdminShell({
  slug,
  status,
  email,
  rejectionNote,
}: {
  slug: string;
  status: string;
  email: string;
  rejectionNote?: string | null;
}) {
  const [tab, setTab] = useState<Tab>("productos");
  const tabLabel = NAV.find((n) => n.key === tab)?.label;

  return (
    <div className="flex min-h-screen bg-paper">
      {/* Sidebar */}
      <aside className="hidden w-60 flex-shrink-0 flex-col border-r border-ink/5 bg-white md:flex">
        <div className="border-b border-ink/5 px-5 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-jade-500 font-display text-sm font-bold text-white">
              D
            </span>
            <span className="font-display text-base font-bold text-ink">Dcompras</span>
          </Link>
          <p className="mt-1 truncate text-xs text-ink/40">{slug}</p>
        </div>
        <nav className="space-y-1 p-3">
          {NAV.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                tab === item.key
                  ? "bg-jade-50 text-jade-700"
                  : "text-ink/60 hover:bg-paper hover:text-ink"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto p-3">
          {status === "aprobada" ? (
            <Link
              href={`/${slug}`}
              target="_blank"
              className="flex items-center gap-2 rounded-lg border border-ink/10 px-3 py-2.5 text-sm font-medium text-ink/70 transition hover:bg-paper"
            >
              ↗ Ver tienda pública
            </Link>
          ) : (
            <div
              title="Tu tienda todavía no es visible al público: está en revisión o fue rechazada."
              className="flex cursor-not-allowed items-center gap-2 rounded-lg border border-dashed border-ink/10 px-3 py-2.5 text-sm font-medium text-ink/30"
            >
              ↗ Ver tienda pública
            </div>
          )}
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="fixed inset-x-0 top-0 z-20 flex items-center justify-between border-b border-ink/5 bg-white px-4 py-3 md:hidden">
        <span className="font-display text-base font-bold text-ink">Dcompras</span>
        <div className="flex items-center gap-1.5">
          {NAV.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                tab === item.key ? "bg-jade-500 text-white" : "bg-paper text-ink/60"
              }`}
            >
              {item.icon}
            </button>
          ))}
          <LogoutButton
            redirectTo="/"
            aria-label="Cerrar sesión"
            className="ml-1 flex h-8 w-8 items-center justify-center rounded-full border border-ink/10 text-ink/40 transition hover:bg-coral-50 hover:text-coral-600"
          >
            <LogoutIcon />
          </LogoutButton>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Desktop header */}
        <header className="sticky top-0 z-10 hidden items-center justify-between border-b border-ink/5 bg-white/95 px-8 py-4 backdrop-blur-sm md:flex">
          <h1 className="font-display text-xl font-bold text-ink">{tabLabel}</h1>
          <AccountMenu email={email} redirectTo="/" />
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-6 pt-20 md:pt-8">
          <h1 className="mb-5 font-display text-xl font-bold text-ink md:hidden">{tabLabel}</h1>

          {status === "pendiente" && (
            <div className="mb-5 rounded-2xl border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
              🕐 Tu tienda está en revisión. Todavía no es visible al público ni puede recibir
              pedidos — te avisaremos por WhatsApp cuando esté aprobada.
            </div>
          )}
          {status === "rechazada" && (
            <RejectedBanner slug={slug} rejectionNote={rejectionNote ?? null} />
          )}

          {tab === "cuenta" && <AdminSettings slug={slug} />}
          {tab === "productos" && <AdminProducts slug={slug} />}
          {tab === "pedidos" && <AdminOrders slug={slug} />}
          {tab === "ganancias" && <AdminEarnings slug={slug} />}
          {tab === "soporte" && <AdminSupport slug={slug} />}
        </main>
      </div>
    </div>
  );
}
