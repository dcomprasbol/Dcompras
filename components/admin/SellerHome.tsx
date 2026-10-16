"use client";

import { useEffect, useState } from "react";
import Icon, { type IconName } from "@/components/Icon";
import { formatBs } from "@/lib/utils";
import type { SellerOverview } from "@/lib/repo";

// Pantalla de inicio del panel del vendedor: cómo va su tienda, su link
// para compartir a mano, qué le falta para dejarla lista y accesos rápidos.
// Pensada para alguien que no es "de tecnología": pocas palabras, botones
// grandes y cada cosa lleva directo a donde se resuelve.

export type SellerTab =
  | "inicio"
  | "productos"
  | "pedidos"
  | "diseno"
  | "billetera"
  | "datos"
  | "soporte";

export type SellerChecklist = {
  hasLogo: boolean;
  hasStyle: boolean;
  hasProducts: boolean;
  hasQr: boolean;
  hasSocial: boolean;
};

export function useStoreUrl(slug: string) {
  const [url, setUrl] = useState(`dcompras.shop/${slug}`);
  useEffect(() => setUrl(`${window.location.origin}/${slug}`), [slug]);
  return url;
}

export function CopyLinkButton({ url, className = "" }: { url: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          window.prompt("Copia tu link:", url);
        }
      }}
      className={className}
    >
      <Icon name={copied ? "check" : "link"} mono className="h-4 w-4" />
      {copied ? "¡Copiado!" : "Copiar link"}
    </button>
  );
}

function StatTile({
  label,
  value,
  icon,
  onClick,
  highlight = false,
}: {
  label: string;
  value: string;
  icon: IconName;
  onClick?: () => void;
  highlight?: boolean;
}) {
  const content = (
    <>
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
          highlight ? "bg-coral-500 text-white" : "bg-paper text-ink"
        }`}
      >
        <Icon name={icon} mono={highlight} className="h-4 w-4" />
      </span>
      <span className="mt-3 block font-mono text-2xl font-bold text-ink">{value}</span>
      <span className="block text-xs text-ink/50">{label}</span>
    </>
  );
  const cls = `rounded-2xl border bg-white p-4 text-left shadow-sm ${
    highlight ? "border-coral-200" : "border-ink/5"
  }`;
  return onClick ? (
    <button type="button" onClick={onClick} className={`${cls} transition hover:-translate-y-0.5 hover:shadow-md`}>
      {content}
    </button>
  ) : (
    <div className={cls}>{content}</div>
  );
}

export default function SellerHome({
  slug,
  storeName,
  ownerName,
  status,
  overview,
  checklist,
  goTo,
}: {
  slug: string;
  storeName: string;
  ownerName: string | null;
  status: string;
  overview: SellerOverview;
  checklist: SellerChecklist;
  goTo: (tab: SellerTab) => void;
}) {
  const url = useStoreUrl(slug);
  const approved = status === "aprobada";
  const firstName = ownerName?.trim().split(/\s+/)[0];

  const steps: { done: boolean; label: string; hint: string; tab: SellerTab }[] = [
    { done: checklist.hasProducts, label: "Publica tu primer producto", hint: "Con foto, precio y tallas", tab: "productos" },
    { done: checklist.hasLogo, label: "Sube tu logo", hint: "Para que te reconozcan", tab: "diseno" },
    { done: checklist.hasStyle, label: "Elige el estilo de tu tienda", hint: "Boutique, Editorial, Estudio y más", tab: "diseno" },
    { done: checklist.hasQr, label: "Carga tu QR de cobro", hint: "Para recibir tus ganancias", tab: "datos" },
    { done: checklist.hasSocial, label: "Agrega tus redes sociales", hint: "Instagram, TikTok o Facebook", tab: "datos" },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;
  const shareText = encodeURIComponent(`¡Mira mi tienda ${storeName}! Haz tu pedido aquí: ${url}`);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">
          {firstName ? `Hola, ${firstName}` : "Hola"}
        </h1>
        <p className="text-sm text-ink/50">Así va {storeName} hoy.</p>
      </div>

      {/* Link de la tienda: lo más importante para vender es compartirlo. */}
      <div className="relative overflow-hidden rounded-2xl bg-ink p-5 text-white">
        <span
          className="absolute bottom-0 left-0 h-10 w-10 bg-jade-400 [clip-path:polygon(0_0,100%_100%,0_100%)]"
          aria-hidden="true"
        />
        <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Tu link de tienda</p>
        <p className="mt-1 break-all font-mono text-base font-bold md:text-lg">{url.replace(/^https?:\/\//, "")}</p>
        {!approved && (
          <p className="mt-1 text-xs text-amber-400">
            Tu tienda todavía no es pública: el link funciona para tus clientes cuando la aprobemos.
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={`/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-jade-400 px-4 py-2 text-sm font-bold text-ink transition hover:bg-jade-500"
          >
            {approved ? "Ver mi tienda" : "Ver vista previa"} <span aria-hidden="true">↗</span>
          </a>
          <CopyLinkButton
            url={url}
            className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
          />
          {approved && (
            <a
              href={`https://wa.me/?text=${shareText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
            >
              <Icon name="chat" mono className="h-4 w-4" />
              Compartir por WhatsApp
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Vendido este mes" value={formatBs(overview.salesMonth)} icon="wallet" />
        <StatTile
          label="Pedidos por atender"
          value={String(overview.ordersToHandle)}
          icon="box"
          highlight={overview.ordersToHandle > 0}
          onClick={() => goTo("pedidos")}
        />
        <StatTile
          label="Productos publicados"
          value={String(overview.products)}
          icon="bag"
          onClick={() => goTo("productos")}
        />
        <StatTile label="Pedidos en total" value={String(overview.ordersTotal)} icon="clipboard" />
      </div>

      {!allDone ? (
        <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-ink">Deja tu tienda lista</h2>
            <span className="text-xs font-semibold text-ink/50">
              {doneCount} de {steps.length}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper">
            <div
              className="h-full rounded-full bg-jade-500 transition-all"
              style={{ width: `${(doneCount / steps.length) * 100}%` }}
            />
          </div>
          <ul className="mt-4 space-y-1">
            {steps.map((s) => (
              <li key={s.label}>
                <button
                  type="button"
                  onClick={() => goTo(s.tab)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-paper"
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                      s.done ? "border-jade-500 bg-jade-500 text-white" : "border-ink/15"
                    }`}
                  >
                    {s.done && <Icon name="check" mono className="h-3.5 w-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm font-semibold ${s.done ? "text-ink/40 line-through" : "text-ink"}`}>
                      {s.label}
                    </span>
                    <span className="block text-xs text-ink/40">{s.hint}</span>
                  </span>
                  {!s.done && <Icon name="chevron" className="h-4 w-4 text-ink/30" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-jade-200 bg-jade-50 p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-jade-500 text-white">
            <Icon name="check" mono className="h-4 w-4" />
          </span>
          <p className="text-sm text-jade-700">
            <span className="font-bold">¡Tu tienda está lista!</span> Ahora compártela en tus redes para
            recibir pedidos.
          </p>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-bold text-ink">Accesos rápidos</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {(
            [
              { tab: "productos", icon: "bag", label: "Agregar producto" },
              { tab: "pedidos", icon: "box", label: "Ver pedidos" },
              { tab: "diseno", icon: "panel", label: "Cambiar diseño" },
              { tab: "soporte", icon: "chat", label: "Pedir ayuda" },
            ] as { tab: SellerTab; icon: IconName; label: string }[]
          ).map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => goTo(a.tab)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-ink/5 bg-white p-4 text-center text-sm font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Icon name={a.icon} className="h-6 w-6" />
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
