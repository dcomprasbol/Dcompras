// Datos que reciben las páginas de inicio completas de los estilos Atelier,
// Pop y Galería (ver app/[slug]/page.tsx). Solo lo que se muestra: nunca
// datos privados de la tienda.
export type ThemeProduct = {
  id: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  images: string[];
  tags: string[];
  isNew: boolean;
};

export type ThemeStore = {
  name: string;
  logoUrl: string | null;
  dropAt: string | null;
  city: string | null;
  whatsapp: string | null;
};

export type ThemeHomeProps = {
  slug: string;
  store: ThemeStore;
  products: ThemeProduct[];
  eyebrow: string;
  tagline: string;
};

export function discountPct(p: ThemeProduct) {
  return p.compareAtPrice != null && p.compareAtPrice > p.price
    ? Math.round((1 - p.price / p.compareAtPrice) * 100)
    : 0;
}

export function secondImage(p: ThemeProduct) {
  return p.images.find((src) => src && src !== p.imageUrl) ?? null;
}
