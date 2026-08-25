"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { formatBs } from "@/lib/utils";

const MotionLink = motion(Link);

export default function ProductCard({
  slug,
  id,
  name,
  price,
  compareAtPrice,
  imageUrl,
  totalStock,
  isNew,
}: {
  slug: string;
  id: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  totalStock: number;
  isNew: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();
  const onSale = compareAtPrice != null && compareAtPrice > price;
  const discountPct = onSale ? Math.round((1 - price / compareAtPrice!) * 100) : 0;

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
          <div className="flex h-full w-full items-center justify-center text-3xl">🛍️</div>
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
