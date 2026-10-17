import type { IconName } from "@/components/Icon";
import { STORE_CATEGORIES } from "@/lib/utils";

// Cómo se presenta cada rubro en el directorio público (landing, /tiendas,
// /categoria/[x]): foto de portada (las de /public/landing; los rubros sin
// foto usan la de un producto real del rubro o un fondo con su ícono), ícono
// y una línea que dice qué se encuentra ahí.
export const CATEGORY_VISUALS: Record<string, { image: string | null; icon: IconName; blurb: string }> = {
  ropa: { image: "/landing/moda.jpg", icon: "bag", blurb: "Ropa, calzado y moda para todos" },
  joyeria: { image: null, icon: "spark", blurb: "Joyas, bisutería, relojes y accesorios" },
  electronicos: { image: "/landing/tecnologia.jpg", icon: "box", blurb: "Celulares, audio, gadgets y más" },
  belleza: { image: "/landing/belleza.jpg", icon: "spark", blurb: "Skincare, maquillaje y cuidado personal" },
  hogar: { image: "/landing/artesanias.jpg", icon: "home", blurb: "Decoración, textiles y artesanías" },
  comida: { image: "/landing/comida.jpg", icon: "cart", blurb: "Repostería, snacks y comida casera" },
  otros: { image: null, icon: "panel", blurb: "Todo lo demás que se vende en Bolivia" },
};

// Las tiendas sin rubro cuentan como "otros".
export function normalizeCategory(category: string | null | undefined): string {
  return STORE_CATEGORIES.some((c) => c.value === category) ? (category as string) : "otros";
}
