import { getStoreBySlug, listActiveProducts } from "@/lib/repo";
import { notFound } from "next/navigation";
import { formatBs, categoryLabel } from "@/lib/utils";
import RevealOnScroll from "@/components/landing/RevealOnScroll";
import DropCountdown from "@/components/DropCountdown";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

const NEW_PRODUCT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export default async function StoreCatalogPage({
  params,
}: {
  params: { slug: string };
}) {
  const store = await getStoreBySlug(params.slug);
  if (!store) notFound();

  const products = await listActiveProducts(store.id);
  const heroProduct = products[0];
  const eyebrow = [categoryLabel(store.category), store.city].filter(Boolean).join(" · ");

  return (
    <div>
      {/* Hero: portada comercial de la tienda, a todo el ancho del navegador
          (como el resto del sitio). Usa el color/tipografía que el dueño
          eligió (variables --store-accent / --font-display / --font-body,
          fijadas en el layout); la tipografía impact y las esquinas rectas
          son fijas (sistema editorial del resto del sitio). */}
      <section className="relative overflow-hidden bg-ink px-5 pb-20 pt-12 text-white md:px-8 md:pb-28 md:pt-16">
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <RevealOnScroll>
            {eyebrow && (
              <span className="tag-editorial border border-white/25 text-white/70">{eyebrow}</span>
            )}
            <h1 className="mt-5 text-balance font-impact text-5xl uppercase leading-[0.9] sm:text-6xl lg:text-7xl">
              <span className="store-accent-text">
                {store.tagline || `Bienvenido a ${store.name}`}
              </span>
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
            {products.length > 0 && (
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
                      heroProduct.compareAtPrice != null &&
                      heroProduct.compareAtPrice > heroProduct.price
                        ? "text-coral-600"
                        : "store-accent-text"
                    }`}
                  >
                    {formatBs(heroProduct.price)}
                  </p>
                  {heroProduct.compareAtPrice != null &&
                    heroProduct.compareAtPrice > heroProduct.price && (
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

      {/* Catálogo */}
      <div id="catalogo" className="mx-auto max-w-7xl scroll-mt-20 px-5 pb-20 pt-10 md:px-8">
        <RevealOnScroll className="mb-6 flex items-end justify-between">
          <div>
            <span className="section-mark mb-2 text-ink" aria-hidden="true" />
            <h2 className="font-impact text-2xl uppercase tracking-tight text-ink md:text-3xl">
              Nuestros productos
            </h2>
            {store.city && <p className="text-sm text-ink/50">{store.city}</p>}
          </div>
          {products.length > 0 && (
            <p className="text-xs text-ink/40">
              {products.length} producto{products.length === 1 ? "" : "s"}
            </p>
          )}
        </RevealOnScroll>

        {products.length === 0 ? (
          <RevealOnScroll className="border border-dashed border-ink/15 bg-white p-8 text-center text-sm text-ink/50">
            Esta tienda todavía no publicó productos.
          </RevealOnScroll>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
