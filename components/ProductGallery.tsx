"use client";

import { useState } from "react";
import type { StoreTheme } from "@/lib/storeTheme";

export default function ProductGallery({
  images,
  alt,
  theme = "default",
  placeholderIcon,
  badge,
}: {
  images: string[];
  alt: string;
  theme?: StoreTheme;
  placeholderIcon: string;
  badge?: React.ReactNode;
}) {
  const [active, setActive] = useState(0);
  const themed = theme !== "default";
  const current = images[active] ?? images[0] ?? null;

  return (
    <div>
      <div
        className={
          themed
            ? `store-card-bg relative aspect-square w-full overflow-hidden rounded-[var(--store-radius-lg)] lg:aspect-[4/5] ${theme === "tecnologia" ? "store-border border" : ""}`
            : "relative aspect-square w-full overflow-hidden border border-ink/10 bg-paper lg:aspect-[4/5]"
        }
      >
        {badge}
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-6xl">
            {placeholderIcon}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActive(idx)}
              className={`h-16 w-16 shrink-0 overflow-hidden ${
                themed ? "rounded-[var(--store-radius)]" : ""
              } ${
                idx === active
                  ? themed
                    ? "store-accent-border border-2"
                    : "border-2 border-ink"
                  : themed
                    ? "store-border border opacity-70 hover:opacity-100"
                    : "border border-ink/10 opacity-70 hover:opacity-100"
              }`}
              aria-label={`Ver foto ${idx + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
