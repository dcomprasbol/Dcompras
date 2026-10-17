import Link from "next/link";
import RevealOnScroll from "./RevealOnScroll";
import BrandMark from "@/components/BrandMark";
import Icon from "@/components/Icon";
import { listPublicStores } from "@/lib/repo";
import { STORE_CATEGORIES } from "@/lib/utils";
import { CATEGORY_VISUALS, normalizeCategory } from "@/lib/categoryVisuals";

// "Explora por categoría": las categorías reales de la plataforma con
// cuántas tiendas tiene cada una y los logos de algunas, para que un
// comprador que llega sin el link de una tienda pueda recorrer todo lo que
// hay. Cada tarjeta lleva a /categoria/[x]; la última, a /tiendas.
// (El archivo conserva su nombre histórico: antes era la vitrina de
// personalización con tiendas de ejemplo.)
export default async function Personalization() {
  const stores = await listPublicStores();

  const cats = STORE_CATEGORIES.map((c) => {
    const inCat = stores.filter((s) => normalizeCategory(s.category) === c.value);
    const visual = CATEGORY_VISUALS[c.value];
    const productPhoto = inCat.find((s) => s.previewIds.length > 0)?.previewIds[0];
    return {
      ...c,
      count: inCat.length,
      logos: inCat.filter((s) => s.hasLogo).slice(0, 3),
      image: visual.image ?? (productPhoto ? `/api/img/product/${productPhoto}` : null),
      icon: visual.icon,
      blurb: visual.blurb,
    };
  }).sort((a, b) => b.count - a.count);

  return (
    <section id="categorias" className="scroll-mt-20 px-5 py-20">
      <div className="mx-auto max-w-6xl">
        <RevealOnScroll className="mx-auto max-w-2xl text-center">
          <BrandMark className="mx-auto mb-5 h-10 w-auto" />
          <h2 className="font-impact text-3xl uppercase leading-[0.95] tracking-tight text-ink md:text-5xl">
            Explora por categoría
          </h2>
          <p className="mt-4 text-sm text-ink/60 md:text-base">
            {stores.length} tienda{stores.length === 1 ? "" : "s"} de vendedores de toda Bolivia, cada una con su
            propia marca. Elige qué buscas y compra directo, con QR o contra entrega.
          </p>
        </RevealOnScroll>

        <div className="mt-12 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          {cats.map((c, i) => {
            const featured = i === 0;
            return (
              <RevealOnScroll
                key={c.value}
                delay={i * 70}
                className={featured ? "col-span-2 lg:row-span-2" : ""}
              >
                <Link
                  href={`/categoria/${c.value}`}
                  className={`group relative flex h-full flex-col justify-end overflow-hidden bg-ink text-white ${
                    featured ? "min-h-[300px] md:min-h-[460px]" : "min-h-[210px] md:min-h-[222px]"
                  }`}
                >
                  {c.image ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.image}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.07]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-ink/5 transition duration-500 group-hover:via-ink/30" />
                    </>
                  ) : (
                    <>
                      <Icon
                        name={c.icon}
                        className="absolute -right-6 -top-6 h-40 w-40 text-white/[0.07] transition duration-700 group-hover:rotate-6 group-hover:scale-110"
                      />
                      <span
                        className="absolute bottom-0 left-0 h-20 w-20 bg-jade-400/90 transition-all duration-500 [clip-path:polygon(0_0,100%_100%,0_100%)] group-hover:h-24 group-hover:w-24"
                        aria-hidden="true"
                      />
                    </>
                  )}

                  <span className="absolute right-3 top-3 flex h-9 w-9 translate-x-2 items-center justify-center bg-white text-ink opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                    →
                  </span>

                  <div className="relative p-4 md:p-5">
                    {c.logos.length > 0 && (
                      <div className="mb-3 flex -space-x-2">
                        {c.logos.map((s) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={s.slug}
                            src={`/${s.slug}/logo`}
                            alt=""
                            loading="lazy"
                            className="h-8 w-8 rounded-full border-2 border-white bg-white object-cover"
                          />
                        ))}
                      </div>
                    )}
                    <p className={`font-impact uppercase leading-none tracking-tight ${featured ? "text-4xl md:text-6xl" : "text-xl md:text-2xl"}`}>
                      {c.label}
                    </p>
                    <p className={`mt-1.5 text-white/70 ${featured ? "max-w-sm text-sm md:text-base" : "line-clamp-2 text-xs"}`}>
                      {c.blurb}
                    </p>
                    <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider">
                      <span className={`h-1.5 w-1.5 ${c.count > 0 ? "bg-jade-400" : "bg-white/40"}`} />
                      {c.count > 0 ? `${c.count} tienda${c.count === 1 ? "" : "s"}` : "Sé la primera tienda"}
                    </p>
                  </div>
                </Link>
              </RevealOnScroll>
            );
          })}

          <RevealOnScroll delay={cats.length * 70} className="col-span-2">
            <Link
              href="/tiendas"
              className="group relative flex h-full min-h-[150px] items-end justify-between gap-4 overflow-hidden bg-jade-400 p-5 text-ink md:min-h-[222px]"
            >
              <span
                className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20 transition duration-700 group-hover:scale-150"
                aria-hidden="true"
              />
              <div className="relative">
                <p className="font-impact text-3xl uppercase leading-none tracking-tight md:text-4xl">Ver todas las tiendas</p>
                <p className="mt-2 text-sm text-ink/70">Busca por nombre o ciudad entre las {stores.length} tiendas.</p>
              </div>
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center bg-ink text-xl text-white transition duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
