import Link from "next/link";
import Icon, { type IconName } from "@/components/Icon";

// Navegación del panel de plataforma por secciones (?seccion=...), en vez
// de una sola página larga con todo. Cada ítem puede mostrar un contador de
// pendientes para ver de un vistazo dónde hay trabajo.

export type PlatformSection =
  | "resumen"
  | "solicitudes"
  | "tiendas"
  | "liquidaciones"
  | "moderacion"
  | "soporte";

export const PLATFORM_SECTIONS: { key: PlatformSection; label: string; icon: IconName }[] = [
  { key: "resumen", label: "Resumen", icon: "panel" },
  { key: "solicitudes", label: "Solicitudes", icon: "clock" },
  { key: "tiendas", label: "Tiendas", icon: "bag" },
  { key: "liquidaciones", label: "Liquidaciones", icon: "wallet" },
  { key: "moderacion", label: "Reportes", icon: "alert" },
  { key: "soporte", label: "Soporte", icon: "chat" },
];

export function isPlatformSection(value: unknown): value is PlatformSection {
  return PLATFORM_SECTIONS.some((s) => s.key === value);
}

export function sectionHref(key: PlatformSection) {
  return key === "resumen" ? "/plataforma" : `/plataforma?seccion=${key}`;
}

function Badge({ count, active }: { count: number; active: boolean }) {
  if (count <= 0) return null;
  return (
    <span
      className={`ml-auto rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none ${
        active ? "bg-jade-600 text-white" : "bg-coral-500 text-white"
      }`}
    >
      {count}
    </span>
  );
}

export default function PlatformNav({
  current,
  counts,
}: {
  current: PlatformSection;
  counts: Partial<Record<PlatformSection, number>>;
}) {
  return (
    <>
      {/* Escritorio: columna lateral */}
      <nav className="hidden w-52 shrink-0 md:block" aria-label="Secciones del panel">
        <ul className="sticky top-24 space-y-1">
          {PLATFORM_SECTIONS.map((s) => {
            const active = s.key === current;
            return (
              <li key={s.key}>
                <Link
                  href={sectionHref(s.key)}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    active ? "bg-jade-50 text-jade-700" : "text-ink/60 hover:bg-white hover:text-ink"
                  }`}
                >
                  <Icon name={s.icon} className="h-4 w-4" />
                  {s.label}
                  <Badge count={counts[s.key] ?? 0} active={active} />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Celular: pestañas con scroll horizontal */}
      <nav className="-mx-5 mb-5 overflow-x-auto px-5 md:hidden" aria-label="Secciones del panel">
        <ul className="flex w-max gap-1.5">
          {PLATFORM_SECTIONS.map((s) => {
            const active = s.key === current;
            return (
              <li key={s.key}>
                <Link
                  href={sectionHref(s.key)}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    active ? "bg-ink text-white" : "bg-white text-ink/60"
                  }`}
                >
                  <Icon name={s.icon} mono={active} className="h-3.5 w-3.5" />
                  {s.label}
                  {(counts[s.key] ?? 0) > 0 && (
                    <span className="rounded-full bg-coral-500 px-1.5 text-[10px] font-bold text-white">
                      {counts[s.key]}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
