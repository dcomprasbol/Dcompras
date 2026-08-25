import { getStoreBySlug, getProductById } from "@/lib/repo";
import { notFound } from "next/navigation";
import { formatBs } from "@/lib/utils";
import AddToCartForm from "@/components/AddToCartForm";
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

  const onSale = product.compareAtPrice != null && product.compareAtPrice > product.price;
  const discountPct = onSale ? Math.round((1 - product.price / product.compareAtPrice!) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <RevealOnScroll className="relative aspect-square w-full overflow-hidden border border-ink/10 bg-paper lg:aspect-[4/5]">
          {onSale && (
            <span className="tag-editorial absolute left-3 top-3 z-10 bg-coral-500 text-white">
              -{discountPct}% de descuento
            </span>
          )}
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-6xl">🛍️</div>
          )}
        </RevealOnScroll>

        <div className="lg:pt-4">
          <RevealOnScroll delay={80}>
            <h1 className="font-impact text-3xl uppercase leading-[0.95] text-ink md:text-4xl">
              {product.name}
            </h1>
            <div className="mt-3 flex items-baseline gap-2">
              <p className={`font-mono text-2xl font-bold ${onSale ? "text-coral-600" : "store-accent-text"}`}>
                {formatBs(product.price)}
              </p>
              {onSale && (
                <p className="font-mono text-base text-ink/35 line-through">
                  {formatBs(product.compareAtPrice!)}
                </p>
              )}
            </div>
            {product.description && (
              <p className="mt-4 max-w-md whitespace-pre-line text-sm leading-relaxed text-ink/60">
                {product.description}
              </p>
            )}
          </RevealOnScroll>

          <RevealOnScroll delay={140} className="mt-6 max-w-md">
            <AddToCartForm
              slug={params.slug}
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
        </div>
      </div>
    </div>
  );
}
