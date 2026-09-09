import { getStoreBySlug, getProductById } from "@/lib/repo";
import { notFound } from "next/navigation";
import { formatBs } from "@/lib/utils";
import { themeForCategory } from "@/lib/storeTheme";
import AddToCartForm from "@/components/AddToCartForm";
import ProductGallery from "@/components/ProductGallery";
import ReportButton from "@/components/ReportButton";
import RevealOnScroll from "@/components/landing/RevealOnScroll";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: { slug: string; productId: string };
}) {
  const store = await getStoreBySlug(params.slug);
  if (!store) notFound();

  const product = await getProductById(params.productId);
  if (!product || product.storeId !== store.id || !product.active) notFound();

  // A pedido del dueño: los agotados suelen ser piezas únicas que no
  // vuelven a tener stock, así que ni el link directo a la ficha funciona
  // — mismo criterio que el catálogo (app/[slug]/page.tsx).
  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
  if (totalStock === 0) notFound();

  const onSale = product.compareAtPrice != null && product.compareAtPrice > product.price;
  const discountPct = onSale ? Math.round((1 - product.price / product.compareAtPrice!) * 100) : 0;
  const theme = themeForCategory(store.category);
  const themedImage = theme !== "default";
  const placeholderIcon = theme === "moda" ? "👗" : theme === "tecnologia" ? "📦" : "🛍️";

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <RevealOnScroll>
          <ProductGallery
            images={product.images && product.images.length > 0 ? product.images : product.imageUrl ? [product.imageUrl] : []}
            alt={product.name}
            theme={theme}
            placeholderIcon={placeholderIcon}
            badge={
              onSale ? (
                <span
                  className={
                    themedImage
                      ? `absolute left-3 top-3 z-10 text-xs font-semibold ${theme === "moda" ? "store-text" : "store-accent-bg rounded px-1.5 py-0.5 uppercase tracking-wide"}`
                      : "tag-editorial absolute left-3 top-3 z-10 bg-coral-500 text-white"
                  }
                >
                  {theme === "moda" ? `-${discountPct}%` : `-${discountPct}% de descuento`}
                </span>
              ) : undefined
            }
          />
        </RevealOnScroll>

        <div className="lg:pt-4">
          <RevealOnScroll delay={80}>
            <h1
              className={
                theme === "moda"
                  ? "font-display store-text text-3xl leading-tight md:text-4xl"
                  : theme === "tecnologia"
                    ? "font-impact store-text text-3xl uppercase leading-[0.95] md:text-4xl"
                    : "font-impact text-3xl uppercase leading-[0.95] text-ink md:text-4xl"
              }
            >
              {product.name}
            </h1>
            <div className="mt-3 flex items-baseline gap-2">
              <p
                className={`font-mono text-2xl font-bold ${onSale ? "text-coral-600" : themedImage ? "store-accent-text" : "store-accent-text"}`}
              >
                {formatBs(product.price)}
              </p>
              {onSale && (
                <p
                  className={`font-mono text-base line-through ${themedImage ? "store-text-soft" : "text-ink/35"}`}
                >
                  {formatBs(product.compareAtPrice!)}
                </p>
              )}
            </div>
            {product.description && (
              <p
                className={`mt-4 max-w-md whitespace-pre-line text-sm leading-relaxed ${themedImage ? "store-text-soft" : "text-ink/60"}`}
              >
                {product.description}
              </p>
            )}
          </RevealOnScroll>

          <RevealOnScroll delay={140} className="mt-6 max-w-md">
            <AddToCartForm
              slug={params.slug}
              theme={theme}
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                variants: product.variants.map((v) => ({
                  id: v.id,
                  label: v.label,
                  stock: v.stock,
                })),
              }}
            />
          </RevealOnScroll>

          <div className="mt-4 max-w-md">
            <ReportButton
              slug={params.slug}
              type="product"
              productId={product.id}
              label="⚠️ Reportar este producto"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
