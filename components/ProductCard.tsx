"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { formatBs } from "@/lib/utils";
import type { StoreTheme } from "@/lib/storeTheme";

const MotionLink = motion(Link);

// Placeholder cuando el producto no tiene foto — distinto por rubro para
// que hasta las fichas vacías se sientan hechas para ese tipo de tienda.
const PLACEHOLDER_ICON: Record<StoreTheme, string> = {
  default: "🛍️",
  moda: "👗",
  tecnologia: "📦",
};

export default function ProductCard({
  slug,
  id,
  name,
  price,
  compareAtPrice,
  imageUrl,
  totalStock,
  isNew,
  theme = "default",
}: {
  slug: string;
  id: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  totalStock: number;
  isNew: boolean;
  theme?: StoreTheme;
}) {
  const shouldReduceMotion = useReducedMotion();
  const onSale = compareAtPrice != null && compareAtPrice > price;
  const discountPct = onSale ? Math.round((1 - price / compareAtPrice!) * 100) : 0;

  // "moda": tarjeta editorial de boutique — sin borde, esquinas suaves,
  // nombre y precio en la misma línea, sin overlay al pasar el mouse (así
  // se ven Sabina/Arum, las referencias que pidió el dueño).
  if (theme === "moda") {
    return (
      <MotionLink
        href={`/${slug}/producto/${id}`}
        className="group block"
        whileHover={shouldReduceMotion ? undefined : { y: -3 }}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
        transition={{ type: "spring", stiffness: 350, damping: 26 }}
      >
        <div className="store-card-bg relative aspect-[4/5] w-full overflow-hidden rounded-[var(--store-radius-lg)]">
          {(onSale || isNew) && (
            <div className="store-text absolute left-3 top-3 z-10 text-[11px] font-medium tracking-wide">
              {onSale ? `-${discountPct}%` : "Nuevo"}
            </div>
          )}
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl">
              {PLACEHOLDER_ICON.moda}
            </div>
          )}
        </div>
        <div className="mt-2.5 flex items-baseline justify-between gap-2">
          <p className="store-text line-clamp-1 text-sm">{name}</p>
          <div className="flex shrink-0 items-baseline gap-1.5">
            <p className={`font-mono text-sm ${onSale ? "text-coral-600" : "store-text"}`}>
              {formatBs(price)}
            </p>
            {onSale && (
              <p className="store-text-soft font-mono text-xs line-through">
                {formatBs(compareAtPrice!)}
              </p>
            )}
          </div>
        </div>
        {totalStock === 0 && (
          <p className="mt-0.5 text-xs font-medium text-coral-500">Agotado</p>
        )}
      </MotionLink>
    );
  }

  // "tecnologia": tarjeta de estudio de producto — fondo oscuro, esquinas
  // marcadas, nombre y precio bold en la misma línea (como Vende).
  if (theme === "tecnologia") {
    return (
      <MotionLink
        href={`/${slug}/producto/${id}`}
        className="store-card-bg store-border group block overflow-hidden rounded-[var(--store-radius)] border transition-colors hover:border-[var(--store-accent)]"
        whileHover={shouldReduceMotion ? undefined : { y: -3 }}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <div className="relative aspect-square w-full overflow-hidden">
          {(onSale || isNew) && (
            <span className="store-accent-bg absolute left-2 top-2 z-10 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
              {onSale ? `-${discountPct}%` : "Nuevo"}
            </span>
          )}
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl">
              {PLACEHOLDER_ICON.tecnologia}
            </div>
          )}
        </div>
        <div className="px-3 py-3">
          <div className="flex items-baseline justify-between gap-2">
            <p className="store-text line-clamp-1 text-sm font-bold">{name}</p>
            <p className="store-accent-text shrink-0 font-mono text-sm font-bold">
              {formatBs(price)}
            </p>
          </div>
          {onSale && (
            <p className="store-text-soft font-mono text-xs line-through">
              {formatBs(compareAtPrice!)}
            </p>
          )}
          {totalStock === 0 && <p className="mt-0.5 text-xs font-medium text-coral-400">Agotado</p>}
        </div>
      </MotionLink>
    );
  }

  // "default": el look editorial de siempre, sin cambios.
  return (
    <MotionLink
      href={`/${slug}/producto/${id}`}
      className="group block border border-ink/10 bg-white"
      // Lift rápido al pasar el mouse (200-300ms, feedback estándar de
      // tarjeta) y un "aplastón" al tocar/hacer click — esto último es lo
      // que le da paridad a celular: el hover del spin de abajo nunca se ve
      // en touch, pero whileTap sí responde igual en mouse y en dedo.
      whileHover={shouldReduceMotion ? undefined : { y: -4, scale: 1.015 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-paper [perspective:1000px]">
        <div className="absolute left-2 top-2 z-10 flex flex-col items-start gap-1">
          {onSale && (
            <span className="tag-editorial bg-coral-500 text-white">-{discountPct}%</span>
          )}
          {isNew && <span className="tag-editorial store-accent-bg">Nuevo</span>}
        </div>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover [backface-visibility:hidden] group-hover:animate-turntable"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl">
            {PLACEHOLDER_ICON.default}
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink/0 transition-colors duration-300 group-hover:bg-ink/10">
          <span className="tag-editorial translate-y-2 bg-white text-ink opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            Ver producto
          </span>
        </div>
      </div>
      <div className="px-2.5 py-3">
        <p className="line-clamp-1 text-sm font-medium text-ink">{name}</p>
        <div className="flex items-baseline gap-1.5">
          <p className={`font-mono text-sm font-semibold ${onSale ? "text-coral-600" : "store-accent-text"}`}>
            {formatBs(price)}
          </p>
          {onSale && (
            <p className="font-mono text-xs text-ink/35 line-through">{formatBs(compareAtPrice!)}</p>
          )}
        </div>
        {totalStock === 0 && <p className="text-xs font-medium text-coral-500">Agotado</p>}
      </div>
    </MotionLink>
  );
}
