import { getStoreBySlug, listActiveProducts } from "@/lib/repo";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatBs, categoryLabel } from "@/lib/utils";
import { themeForCategory } from "@/lib/storeTheme";
import RevealOnScroll from "@/components/landing/RevealOnScroll";
import DropCountdown from "@/components/DropCountdown";
import ProductCard from "@/components/ProductCard";
import HeroCarousel from "@/components/HeroCarousel";

export const dynamic = "force-dynamic";

const NEW_PRODUCT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export default async function StoreCatalogPage({
  params,
}: {
  params: { slug: string };
}) {
  const store = await getStoreBySlug(params.slug);
  if (!store) notFound();

  // A pedido del dueño: acá los productos agotados suelen ser piezas
  // únicas que no vuelven a tener stock, así que en el catálogo público se
  // ocultan del todo (ni "Agotado" ni "avisame") en vez de solo bloquear
  // la compra — listActiveProducts sigue trayendo todo, sin filtrar, porque
  // también la usa el panel del propio vendedor (necesita ver y poder
  // reactivar sus productos agotados).
  const allProducts = await listActiveProducts(store.id);
  const products = allProducts.filter(
    (p) => p.variants.reduce((s, v) => s + v.stock, 0) > 0
  );
  const heroProduct = products[0];
  // El hero "moda" (ver HeroModa) rota entre varias fotos del catálogo en
  // vez de mostrar una sola fija — hasta 6, y solo las que tienen foto.
  const heroProducts = products.slice(0, 6);
  const eyebrow = [categoryLabel(store.category), store.city].filter(Boolean).join(" · ");
  const theme = themeForCategory(store.category);
  const tagline = store.tagline || `Bienvenido a ${store.name}`;

  return (
    <div>
      {/* A pedido del dueño: un cliente que vuelve a la tienda (cerró la
          pestaña de seguimiento, cambió de celular) tiene que encontrar
          RÁPIDO cómo ver su pedido, o va a pensar que le robaron la plata.
          Esta franja va arriba de todo, en la página a la que más vuelve la
          gente (la raíz de la tienda) — no un link de texto escondido. */}
      <Link
        href={`/${params.slug}/mi-pedido`}
        className="store-accent-soft-bg store-accent-text flex items-center justify-center gap-2 px-5 py-2.5 text-center text-sm font-medium transition hover:opacity-90"
      >
        <span aria-hidden="true">📦</span>
        <span>
          ¿Ya hiciste un pedido acá? <span className="underline underline-offset-2">Mirá en qué va →</span>
        </span>
      </Link>

      {theme === "moda" ? (
        <HeroModa
          slug={params.slug}
          store={store}
          eyebrow={eyebrow}
          tagline={tagline}
          heroProducts={heroProducts}
          hasProducts={products.length > 0}
        />
      ) : theme === "tecnologia" ? (
        <HeroTecnologia
          store={store}
          eyebrow={eyebrow}
          tagline={tagline}
          heroProduct={heroProduct}
          hasProducts={products.length > 0}
        />
      ) : (
        <HeroDefault
          store={store}
          eyebrow={eyebrow}
          tagline={tagline}
          heroProduct={heroProduct}
          hasProducts={products.length > 0}
        />
      )}

      {/* Catálogo */}
      <div
        id="catalogo"
        className={`mx-auto max-w-7xl scroll-mt-20 px-5 pb-20 md:px-8 ${
          theme === "moda" ? "pt-14" : "pt-10"
        }`}
      >
        <RevealOnScroll className="mb-6 flex items-end justify-between">
          <div>
            {theme === "default" && (
              <span className="section-mark mb-2 text-ink" aria-hidden="true" />
            )}
            <h2
              className={
                theme === "moda"
                  ? "font-display store-text text-2xl md:text-3xl"
                  : theme === "tecnologia"
                    ? "font-impact store-text text-2xl uppercase tracking-tight md:text-3xl"
                    : "font-impact text-2xl uppercase tracking-tight text-ink md:text-3xl"
              }
            >
              {theme === "moda" ? "Catálogo" : "Nuestros productos"}
            </h2>
            {store.city && (
              <p className={theme === "default" ? "text-sm text-ink/50" : "store-text-soft text-sm"}>
                {store.city}
              </p>
            )}
          </div>
          {products.length > 0 && (
            <p className={theme === "default" ? "text-xs text-ink/40" : "store-text-soft text-xs"}>
              {products.length} producto{products.length === 1 ? "" : "s"}
            </p>
          )}
        </RevealOnScroll>

        {products.length === 0 ? (
          <RevealOnScroll
            className={
              theme === "default"
                ? "border border-dashed border-ink/15 bg-white p-8 text-center text-sm text-ink/50"
                : "store-border store-text-soft rounded-[var(--store-radius-lg)] border border-dashed p-8 text-center text-sm"
            }
          >
            Esta tienda todavía no publicó productos.
          </RevealOnScroll>
        ) : (
          <div
            className={
              theme === "moda"
                ? "grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4"
                : theme === "tecnologia"
                  ? "grid grid-cols-2 gap-4 lg:grid-cols-3"
                  : "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            }
          >
            {products.map((product, i) => {
              const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
              const isNew =
                Date.now() - new Date(product.createdAt).getTime() < NEW_PRODUCT_WINDOW_MS;
              return (
                <RevealOnScroll key={product.id} delay={Math.min(i, 6) * 60}>
                  <ProductCard
                    slug={params.slug}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    compareAtPrice={product.compareAtPrice}
                    imageUrl={product.imageUrl}
                    totalStock={totalStock}
                    isNew={isNew}
                    theme={theme}
                  />
                </RevealOnScroll>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

type HeroProductItem = {
  name: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
};
type HeroProduct = HeroProductItem | undefined;

type StoreLike = {
  name: string;
  logoUrl: string | null;
  dropAt: string | null;
};

// Hero de siempre: fondo oscuro, tipografía impact, sistema editorial fijo
// del resto del sitio. Sin cambios respecto a antes de que existieran los
// temas por rubro.
function HeroDefault({
  store,
  eyebrow,
  tagline,
  heroProduct,
  hasProducts,
}: {
  store: StoreLike;
  eyebrow: string;
  tagline: string;
  heroProduct: HeroProduct;
  hasProducts: boolean;
}) {
  return (
    <section className="relative overflow-hidden bg-ink px-5 pb-20 pt-12 text-white md:px-8 md:pb-28 md:pt-16">
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <RevealOnScroll>
          {eyebrow && (
            <span className="tag-editorial border border-white/25 text-white/70">{eyebrow}</span>
          )}
          <h1 className="mt-5 text-balance font-impact text-5xl uppercase leading-[0.9] sm:text-6xl lg:text-7xl">
            <span className="store-accent-text">{tagline}</span>
          </h1>
          <p className="mt-5 max-w-md text-sm text-white/60 md:text-base">
            Catálogo actualizado, pago por QR o contra entrega, y coordinación directa por
            WhatsApp una vez confirmas tu pedido.
          </p>
          {store.dropAt && (
            <div className="mt-7">
              <DropCountdown dropAt={store.dropAt} />
            </div>
          )}
          {hasProducts && (
            <a href="#catalogo" className="btn-editorial bg-white text-ink border-white mt-8 inline-flex">
              Ver catálogo ↓
            </a>
          )}
        </RevealOnScroll>

        <RevealOnScroll delay={120} className="relative mx-auto w-full max-w-xs lg:max-w-sm">
          {heroProduct?.imageUrl ? (
            <div className="animate-float relative aspect-square w-full overflow-hidden bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroProduct.imageUrl}
                alt={heroProduct.name}
                className="h-full w-full object-cover"
              />
            </div>
          ) : store.logoUrl ? (
            <div className="animate-float mx-auto flex aspect-square w-2/3 items-center justify-center overflow-hidden bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={store.logoUrl} alt={store.name} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="store-accent-soft-bg animate-float mx-auto flex aspect-square w-2/3 items-center justify-center">
              <span className="store-accent-text font-impact text-6xl">
                {store.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {heroProduct && (
            <div
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 border border-ink/10 bg-white px-3.5 py-2 text-center text-ink"
              style={{ minWidth: "150px" }}
            >
              <p className="line-clamp-1 text-xs font-medium text-ink/70">{heroProduct.name}</p>
              <div className="flex items-baseline justify-center gap-1.5">
                <p
                  className={`font-mono text-sm font-bold ${
                    heroProduct.compareAtPrice != null && heroProduct.compareAtPrice > heroProduct.price
                      ? "text-coral-600"
                      : "store-accent-text"
                  }`}
                >
                  {formatBs(heroProduct.price)}
                </p>
                {heroProduct.compareAtPrice != null && heroProduct.compareAtPrice > heroProduct.price && (
                  <p className="font-mono text-xs text-ink/35 line-through">
                    {formatBs(heroProduct.compareAtPrice)}
                  </p>
                )}
              </div>
            </div>
          )}
        </RevealOnScroll>
      </div>
    </section>
  );
}

// Hero "moda" (referencia: Sabina / Arum): rota sola entre las fotos del
// catálogo (HeroCarousel) en vez de mostrar una sola fija, degradé abajo
// para que el texto se lea, titular grande en la tipografía que eligió la
// tienda (no impact) y un botón pill. El logo de la tienda se ve grande,
// en una placa blanca arriba del título — a pedido del dueño, tenía que
// notarse más que el ícono chico del header. Sin fotos ni logo, cae a un
// fondo cálido liso — nunca se ve "vacío".
function HeroModa({
  slug,
  store,
  eyebrow,
  tagline,
  heroProducts,
  hasProducts,
}: {
  slug: string;
  store: StoreLike;
  eyebrow: string;
  tagline: string;
  heroProducts: HeroProductItem[];
  hasProducts: boolean;
}) {
  const slides = heroProducts
    .filter((p) => p.imageUrl)
    .map((p) => ({ url: p.imageUrl as string, alt: p.name }));
  const hasImage = slides.length > 0 || Boolean(store.logoUrl);
  return (
    <section className="store-bg relative overflow-hidden">
      <div className="relative flex min-h-[70vh] items-end md:min-h-[80vh]">
        {slides.length > 0 ? (
          <>
            <HeroCarousel images={slides} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          </>
        ) : store.logoUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={store.logoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          </>
        ) : (
          <div className="store-card-bg absolute inset-0" />
        )}
        <RevealOnScroll
          className={`relative w-full px-5 pb-14 pt-24 md:px-8 md:pb-20 ${hasImage ? "text-white" : "store-text"}`}
        >
          <div className="mx-auto max-w-3xl text-center">
            {store.logoUrl && (
              <div className="mb-5 inline-flex rounded-2xl bg-white p-2.5 shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={store.logoUrl}
                  alt={store.name}
                  className="h-14 w-14 rounded-xl object-cover md:h-16 md:w-16"
                />
              </div>
            )}
            {eyebrow && (
              <span
                className={`block text-xs uppercase tracking-[0.2em] ${hasImage ? "text-white/70" : "store-text-soft"}`}
              >
                {eyebrow}
              </span>
            )}
            <h1 className="font-display mt-4 text-balance text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
              {tagline}
            </h1>
            {hasProducts && (
              <a
                href="#catalogo"
                className={`mt-8 inline-flex rounded-full px-7 py-3 text-sm font-medium transition hover:opacity-90 ${
                  hasImage ? "bg-white text-ink" : "store-accent-bg"
                }`}
              >
                Ver colección
              </a>
            )}
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}

// Hero "tecnología" (referencia: Vende): negro, titular gigante bold, botón
// pill negro con flecha, y el producto flotando en una tarjeta con borde
// suave del color de marca — como una vitrina de estudio.
function HeroTecnologia({
  store,
  eyebrow,
  tagline,
  heroProduct,
  hasProducts,
}: {
  store: StoreLike;
  eyebrow: string;
  tagline: string;
  heroProduct: HeroProduct;
  hasProducts: boolean;
}) {
  return (
    <section className="store-bg px-5 pb-16 pt-14 md:px-8 md:pb-24 md:pt-20">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <RevealOnScroll>
          {eyebrow && (
            <span className="store-text-soft text-xs font-semibold uppercase tracking-[0.2em]">
              {eyebrow}
            </span>
          )}
          <h1 className="font-impact store-text mt-4 text-balance text-5xl uppercase leading-[0.95] sm:text-6xl lg:text-7xl">
            <span className="store-accent-text">{tagline}</span>
          </h1>
          <p className="store-text-soft mt-5 max-w-md text-sm md:text-base">
            Catálogo actualizado, pago por QR o contra entrega, y coordinación directa por
            WhatsApp una vez confirmas tu pedido.
          </p>
          {store.dropAt && (
            <div className="mt-7">
              <DropCountdown dropAt={store.dropAt} />
            </div>
          )}
          {hasProducts && (
            <a
              href="#catalogo"
              className="store-accent-bg mt-8 inline-flex items-center gap-2 rounded-[var(--store-radius)] px-6 py-3.5 text-sm font-bold uppercase tracking-wide"
            >
              Ver catálogo →
            </a>
          )}
        </RevealOnScroll>

        <RevealOnScroll delay={120} className="relative mx-auto w-full max-w-xs lg:max-w-sm">
          <div className="store-card-bg store-border animate-float relative aspect-square w-full overflow-hidden rounded-[var(--store-radius-lg)] border">
            {heroProduct?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroProduct.imageUrl}
                alt={heroProduct.name}
                className="h-full w-full object-cover"
              />
            ) : store.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.logoUrl}
                alt={store.name}
                className="mx-auto h-2/3 w-2/3 object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="store-accent-text font-impact text-6xl">
                  {store.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          {heroProduct && (
            <div
              className="store-card-bg store-border absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-[var(--store-radius)] border px-3.5 py-2 text-center"
              style={{ minWidth: "150px" }}
            >
              <p className="store-text line-clamp-1 text-xs font-medium">{heroProduct.name}</p>
              <p className="store-accent-text font-mono text-sm font-bold">
                {formatBs(heroProduct.price)}
              </p>
            </div>
          )}
        </RevealOnScroll>
      </div>
    </section>
  );
}
