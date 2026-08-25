"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatBs } from "@/lib/utils";
import RevealOnScroll from "@/components/landing/RevealOnScroll";

export default function CartPage({ params }: { params: { slug: string } }) {
  const { items, updateQuantity, removeItem, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-10 md:px-8">
        <RevealOnScroll className="border border-dashed border-ink/15 bg-white p-8 text-center">
          <p className="text-sm text-ink/50">Tu carrito está vacío.</p>
          <Link href={`/${params.slug}`} className="btn-editorial btn-editorial-solid mt-4 inline-flex">
            Ver catálogo
          </Link>
        </RevealOnScroll>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 md:px-8">
      <span className="section-mark mb-2 text-ink" aria-hidden="true" />
      <h1 className="mb-4 font-impact text-xl uppercase tracking-tight text-ink">Tu carrito</h1>
      <div className="space-y-3">
        {items.map((item, i) => (
          <RevealOnScroll
            key={`${item.productId}-${item.variantId}`}
            delay={Math.min(i, 6) * 60}
            className="flex items-center gap-3 border border-ink/10 bg-white p-3"
          >
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden bg-paper">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl">🛍️</div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">{item.name}</p>
              {item.variantLabel && (
                <p className="text-xs text-ink/50">{item.variantLabel}</p>
              )}
              <p className="store-accent-text text-sm font-bold">{formatBs(item.price)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                className="h-7 w-7 border border-ink/15 text-ink/60 transition hover:border-ink/40"
              >
                −
              </button>
              <span className="w-5 text-center text-sm">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                className="h-7 w-7 border border-ink/15 text-ink/60 transition hover:border-ink/40"
              >
                +
              </button>
            </div>
            <button
              onClick={() => removeItem(item.productId, item.variantId)}
              className="ml-1 text-xs text-coral-500"
            >
              Quitar
            </button>
          </RevealOnScroll>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between border border-ink/10 bg-white p-4">
        <span className="text-sm font-medium text-ink/70">Total</span>
        <span className="store-accent-text font-mono text-lg font-bold">{formatBs(total)}</span>
      </div>

      <Link
        href={`/${params.slug}/checkout`}
        className="btn-editorial btn-editorial-solid mt-4 flex w-full"
      >
        Continuar a pagar
      </Link>
    </div>
  );
}
