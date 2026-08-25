"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import NotifyMeForm from "@/components/NotifyMeForm";
import { MotionButton } from "@/components/MotionCta";

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
}: {
  slug: string;
  product: Product;
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

  return (
    <div className="mt-5 space-y-3">
      {!isSingleUnnamed && (
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/70">
            Elige una opción
          </label>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVariantId(v.id)}
                disabled={v.stock <= 0}
                className={`border px-3 py-1.5 text-sm ${
                  variantId === v.id
                    ? "store-accent-border store-accent-soft-bg store-accent-text"
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

      <MotionButton
        type="button"
        onClick={handleAdd}
        disabled={outOfStock}
        className="btn-editorial btn-editorial-solid w-full disabled:opacity-50"
      >
        {outOfStock ? "Sin stock" : added ? "¡Agregado! ✓" : "Agregar al carrito"}
      </MotionButton>

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
        className="w-full border border-ink/15 px-4 py-2 text-sm text-ink/60 transition hover:border-ink/30"
      >
        Seguir viendo productos
      </button>
    </div>
  );
}
