"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export default function CartHeaderBadge({ slug }: { slug: string }) {
  const { count } = useCart();

  return (
    <Link
      href={`/${slug}/carrito`}
      className="store-accent-soft-bg store-accent-text relative flex items-center gap-1.5 border border-transparent px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition hover:brightness-95"
    >
      Carrito
      {count > 0 && (
        <span className="store-accent-bg ml-0.5 flex h-5 w-5 items-center justify-center font-mono text-[11px] font-bold">
          {count}
        </span>
      )}
    </Link>
  );
}
