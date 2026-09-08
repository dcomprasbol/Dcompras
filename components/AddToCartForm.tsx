"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import NotifyMeForm from "@/components/NotifyMeForm";
import { MotionButton } from "@/components/MotionCta";
import type { StoreTheme } from "@/lib/storeTheme";

type Variant = { id: string; label: string; stock: number };
type Product = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  variants: Variant[];
};

export default function AddToCartForm({
  slug,
  product,
  theme = "default",
}: {
  slug: string;
  product: Product;
  theme?: StoreTheme;
}) {
  const { addItem } = useCart();
  const router = useRouter();
  const isSingleUnnamed = product.variants.length === 1 && product.variants[0].label === "Único";
  const [variantId, setVariantId] = useState<string>(
    product.variants[0]?.id ?? ""
  );
  const [added, setAdded] = useState(false);

  const selectedVariant = product.variants.find((v) => v.id === variantId);
  const outOfStock = !selectedVariant || selectedVariant.stock <= 0;

  function handleAdd() {
    if (!selectedVariant) return;
    addItem({
      productId: product.id,
      variantId: isSingleUnnamed ? null : selectedVariant.id,
      name: product.name,
      variantLabel: isSingleUnnamed ? null : selectedVariant.label,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity: 1,
      maxStock: selectedVariant.stock,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  const isThemed = theme !== "default";
  const buttonLabel = outOfStock ? "Sin stock" : added ? "¡Agregado! ✓" : "Agregar al carrito";

  return (
    <div className="mt-5 space-y-3">
      {!isSingleUnnamed && (
        <div>
          <label className={`mb-1 block text-sm font-medium ${isThemed ? "store-text-soft" : "text-ink/70"}`}>
            Elige una opción
          </label>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVariantId(v.id)}
                disabled={v.stock <= 0}
                className={`border px-3 py-1.5 text-sm ${isThemed ? "rounded-[var(--store-radius)]" : ""} ${
                  variantId === v.id
                    ? "store-accent-border store-accent-soft-bg store-accent-text"
                    : isThemed
                      ? "store-border store-text-soft"
                      : "border-ink/15 text-ink/70"
                } ${v.stock <= 0 ? "cursor-not-allowed opacity-40" : ""}`}
              >
                {v.label}
                {v.stock <= 0 ? " (agotado)" : ""}
              </button>
            ))}
          </div>
        </div>
      )}

      {theme === "moda" ? (
        <MotionButton
          type="button"
          onClick={handleAdd}
          disabled={outOfStock}
          className={`w-full rounded-full py-3 text-sm font-medium transition disabled:opacity-50 ${
            added ? "animate-confirm-pulse" : ""
          } ${outOfStock ? "store-card-bg store-text-soft" : "store-accent-bg"}`}
        >
          {buttonLabel}
        </MotionButton>
      ) : theme === "tecnologia" ? (
        <MotionButton
          type="button"
          onClick={handleAdd}
          disabled={outOfStock}
          className={`w-full rounded-[var(--store-radius)] py-3.5 text-sm font-bold uppercase tracking-wide transition disabled:opacity-50 ${
            added ? "animate-confirm-pulse" : ""
          } ${outOfStock ? "store-card-bg store-border border store-text-soft" : "store-accent-bg"}`}
        >
          {buttonLabel}
        </MotionButton>
      ) : (
        <MotionButton
          type="button"
          onClick={handleAdd}
          disabled={outOfStock}
          className={`btn-editorial btn-editorial-solid w-full disabled:opacity-50 ${
            added ? "animate-confirm-pulse" : ""
          }`}
        >
          {buttonLabel}
        </MotionButton>
      )}

      {outOfStock && (
        <NotifyMeForm
          slug={slug}
          productId={product.id}
          variantId={isSingleUnnamed ? null : selectedVariant?.id ?? null}
        />
      )}

      <button
        type="button"
        onClick={() => router.push(`/${slug}`)}
        className={
          isThemed
            ? `store-border store-text-soft w-full rounded-[var(--store-radius)] border px-4 py-2 text-sm transition hover:opacity-80`
            : "w-full border border-ink/15 px-4 py-2 text-sm text-ink/60 transition hover:border-ink/30"
        }
      >
        Seguir viendo productos
      </button>
    </div>
  );
}
