import { notFound } from "next/navigation";
import Link from "next/link";
import { listStoresByCategoryRanked } from "@/lib/repo";
import { STORE_CATEGORIES, categoryLabel, startOfWeekISO } from "@/lib/utils";
import RevealOnScroll from "@/components/landing/RevealOnScroll";

export const dynamic = "force-dynamic";

const MEDALS = ["🥇", "🥈", "🥉"];

// Ranking público de tiendas por categoría: solo posición, nunca el monto
// vendido (ver lib/repo.ts → listStoresByCategoryRanked) — la idea es que
// competir por el primer lugar le convenga a la tienda sin que tenga que
// mostrarle su facturación a la competencia. Se resetea cada semana
// (lib/utils.ts → startOfWeekISO) para que siempre haya incentivo de estar
// arriba, no solo las primeras tiendas que se unieron a la plataforma.
export default async function CategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const category = STORE_CATEGORIES.find((c) => c.value === params.category);
  if (!category) notFound();

  const stores = await listStoresByCategoryRanked(params.category, startOfWeekISO());

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-10 border-b border-ink/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="font-impact text-xl text-ink">
            DCOMPRAS
          </Link>
          <Link href="/" className="text-xs font-semibold text-ink/50 hover:text-ink">
            ← Todas las categorías
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10 md:px-8">
        <RevealOnScroll>
          <span className="section-mark mb-2 text-ink" aria-hidden="true" />
          <h1 className="font-impact text-3xl uppercase tracking-tight text-ink">
            {category.label}
          </h1>
          <p className="mt-2 text-sm text-ink/50">
            Ranking de esta semana — se reinicia cada lunes. Las de arriba son las que más
            vendieron desde entonces.
          </p>
        </RevealOnScroll>

        {stores.length === 0 ? (
          <RevealOnScroll
            delay={80}
            className="mt-8 border border-dashed border-ink/15 bg-white p-8 text-center"
          >
            <p className="text-sm text-ink/50">
              Todavía no hay tiendas aprobadas en {category.label.toLowerCase()}.
            </p>
          </RevealOnScroll>
        ) : (
          <div className="mt-8 space-y-3">
            {stores.map((s, i) => (
              <RevealOnScroll key={s.slug} delay={Math.min(i, 6) * 60}>
                <Link
                  href={`/${s.slug}`}
                  className="flex items-center gap-4 border border-ink/10 bg-white p-4 transition hover:border-ink/25"
                >
                  <span className="w-7 shrink-0 text-center text-lg font-bold text-ink/30">
                    {MEDALS[i] || `#${i + 1}`}
                  </span>
                  {s.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.logoUrl}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-full border border-ink/10 object-cover"
                    />
                  ) : (
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: s.themeColor }}
                    >
                      {s.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">{s.name}</p>
                    {s.tagline && <p className="truncate text-xs text-ink/50">{s.tagline}</p>}
                  </div>
                </Link>
              </RevealOnScroll>
            ))}
          </div>
        )}

        <RevealOnScroll
          delay={120}
          className="mt-10 border border-ink/10 bg-ink p-6 text-center text-white"
        >
          <p className="font-impact text-lg uppercase tracking-tight">¿Vendes {category.label.toLowerCase()}?</p>
          <p className="mt-1 text-sm text-white/60">
            Crea tu tienda gratis y compite por el primer lugar de esta semana.
          </p>
          <Link
            href="/crear-tienda"
            className="btn-editorial bg-white text-ink border-white mt-4 inline-flex"
          >
            Crear mi tienda
          </Link>
        </RevealOnScroll>
      </main>
    </div>
  );
}
