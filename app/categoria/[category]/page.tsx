import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { listPublicStores, listStoresByCategoryRanked } from "@/lib/repo";
import { STORE_CATEGORIES, startOfWeekISO } from "@/lib/utils";
import { CATEGORY_VISUALS, normalizeCategory } from "@/lib/categoryVisuals";
import RevealOnScroll from "@/components/landing/RevealOnScroll";
import Icon from "@/components/Icon";
import DirectoryHeader from "@/components/directory/DirectoryHeader";
import StoreCard from "@/components/directory/StoreCard";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { category: string } }): Promise<Metadata> {
  const category = STORE_CATEGORIES.find((c) => c.value === params.category);
  if (!category) return {};
  return {
    title: `${category.label} · Tiendas en Dcompras`,
    description: `${CATEGORY_VISUALS[category.value].blurb}. Tiendas de vendedores bolivianos en Dcompras.`,
  };
}

// Tiendas de un rubro, ordenadas por el ranking de la semana: solo posición,
// nunca el monto vendido (ver lib/repo.ts → listStoresByCategoryRanked) — la
// idea es que competir por el primer lugar le convenga a la tienda sin
// mostrarle su facturación a la competencia. Se resetea cada lunes
// (lib/utils.ts → startOfWeekISO). En "otros" entran también las tiendas
// sin rubro.
export default async function CategoryPage({ params }: { params: { category: string } }) {
  const category = STORE_CATEGORIES.find((c) => c.value === params.category);
  if (!category) notFound();

  const [ranked, all] = await Promise.all([
    listStoresByCategoryRanked(params.category, startOfWeekISO()),
    listPublicStores(),
  ]);
  const bySlug = new Map(all.map((s) => [s.slug, s]));
  const inCategory = all.filter((s) => normalizeCategory(s.category) === category.value);
  const order = ranked.map((r) => r.slug);
  const stores = [
    ...order.map((slug) => bySlug.get(slug)).filter((s): s is NonNullable<typeof s> => Boolean(s)),
    ...inCategory.filter((s) => !order.includes(s.slug)),
  ];

  const visual = CATEGORY_VISUALS[category.value];
  const photo = stores.find((s) => s.previewIds.length > 0)?.previewIds[0];
  const cover = visual.image ?? (photo ? `/api/img/product/${photo}` : null);
  const counts = new Map<string, number>();
  for (const s of all) counts.set(normalizeCategory(s.category), (counts.get(normalizeCategory(s.category)) ?? 0) + 1);

  return (
    <div className="min-h-screen bg-paper">
      <DirectoryHeader />

      <section className="relative overflow-hidden bg-ink text-white">
        {cover ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt="" className="absolute inset-0 h-full w-full animate-[kenburns_18s_ease-out_both] object-cover opacity-45" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-ink/20" />
          </>
        ) : (
          <Icon name={visual.icon} className="absolute -right-10 -top-10 h-72 w-72 text-white/[0.06]" />
        )}
        <span className="absolute bottom-0 left-0 h-24 w-24 bg-jade-400 [clip-path:polygon(0_0,100%_100%,0_100%)]" aria-hidden="true" />
        <RevealOnScroll className="relative mx-auto max-w-6xl px-5 pb-16 pt-14 md:pb-20 md:pt-20">
          <Link href="/tiendas" className="text-xs font-semibold uppercase tracking-wider text-white/60 hover:text-white">
            ← Todas las tiendas
          </Link>
          <h1 className="mt-4 font-impact text-5xl uppercase leading-[0.9] tracking-tight md:text-8xl">{category.label}</h1>
          <p className="mt-4 max-w-xl text-white/70">{visual.blurb}.</p>
          <p className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
            <span className="h-1.5 w-1.5 bg-jade-400" />
            {stores.length} tienda{stores.length === 1 ? "" : "s"}
          </p>
        </RevealOnScroll>
      </section>

      <nav className="sticky top-[57px] z-10 border-b border-ink/10 bg-paper/95 backdrop-blur" aria-label="Categorías">
        <div className="mx-auto max-w-6xl overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex w-max gap-1 py-2.5">
            {STORE_CATEGORIES.map((c) => {
              const active = c.value === category.value;
              return (
                <li key={c.value}>
                  <Link
                    href={`/categoria/${c.value}`}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition ${
                      active ? "bg-ink text-white" : "text-ink/55 hover:bg-white hover:text-ink"
                    }`}
                  >
                    {c.label}
                    <span className={`font-mono text-[10px] ${active ? "text-jade-400" : "text-ink/30"}`}>
                      {counts.get(c.value) ?? 0}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-5 py-12">
        {stores.length === 0 ? (
          <RevealOnScroll className="flex flex-col items-center border border-dashed border-ink/15 bg-white px-6 py-16 text-center">
            <Icon name={visual.icon} className="h-10 w-10 text-ink/30" />
            <p className="mt-3 font-semibold text-ink">Todavía no hay tiendas de {category.label.toLowerCase()}</p>
            <Link href="/tiendas" className="mt-2 text-sm font-semibold text-jade-600 hover:underline">
              Ver todas las tiendas
            </Link>
          </RevealOnScroll>
        ) : (
          <>
            <RevealOnScroll className="mb-6 flex flex-wrap items-end justify-between gap-2">
              <h2 className="font-impact text-2xl uppercase tracking-tight text-ink md:text-3xl">Ranking de la semana</h2>
              <p className="text-xs text-ink/45">Se reinicia cada lunes: arriba, las que más vendieron desde entonces.</p>
            </RevealOnScroll>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {stores.map((s, i) => (
                <RevealOnScroll key={s.slug} delay={Math.min(i, 6) * 70} className="h-full">
                  <StoreCard store={s} rank={i + 1} />
                </RevealOnScroll>
              ))}
            </div>
          </>
        )}

        <RevealOnScroll className="relative mt-14 overflow-hidden bg-ink p-8 text-center text-white md:p-12">
          <span className="absolute bottom-0 left-0 h-16 w-16 bg-jade-400 [clip-path:polygon(0_0,100%_100%,0_100%)]" aria-hidden="true" />
          <p className="font-impact text-3xl uppercase tracking-tight md:text-4xl">¿Vendes {category.label.toLowerCase()}?</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
            Crea tu tienda gratis y compite por el primer lugar de esta semana.
          </p>
          <Link href="/crear-tienda" className="btn-editorial mt-6 inline-flex border-white bg-white text-ink">
            Crear mi tienda
          </Link>
        </RevealOnScroll>
      </main>
    </div>
  );
}
