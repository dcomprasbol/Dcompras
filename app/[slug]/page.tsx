import { getStoreBySlug, listActiveProducts } from "@/lib/repo";
import { notFound } from "next/navigation";
import Link from "next/link";
import { categoryLabel } from "@/lib/utils";
import { resolveStoreTheme, type StoreTheme } from "@/lib/storeTheme";
import EditorialHome from "@/components/store/themes/EditorialHome";
import BoutiqueHome from "@/components/store/themes/BoutiqueHome";
import EstudioHome from "@/components/store/themes/EstudioHome";
import AtelierHome from "@/components/store/themes/AtelierHome";
import PopHome from "@/components/store/themes/PopHome";
import GaleriaHome from "@/components/store/themes/GaleriaHome";
import type { ThemeHomeProps } from "@/components/store/themes/types";
import Icon from "@/components/Icon";

export const dynamic = "force-dynamic";

const NEW_PRODUCT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// Cada estilo arma su página de inicio completa (portada, secciones,
// catálogo y animaciones) en components/store/themes/*.
const HOMES: Record<StoreTheme, (props: ThemeHomeProps) => JSX.Element> = {
  default: EditorialHome,
  moda: BoutiqueHome,
  tecnologia: EstudioHome,
  atelier: AtelierHome,
  pop: PopHome,
  galeria: GaleriaHome,
};

export default async function StoreCatalogPage({
  params,
}: {
  params: { slug: string };
}) {
  const store = await getStoreBySlug(params.slug);
  if (!store) notFound();

  // A pedido del dueño: acá los productos agotados suelen ser piezas
  // únicas que no vuelven a tener stock, así que en el catálogo público se
  // ocultan del todo (ni "Agotado" ni "avisame") en vez de solo bloquear
  // la compra — listActiveProducts sigue trayendo todo, sin filtrar, porque
  // también la usa el panel del propio vendedor (necesita ver y poder
  // reactivar sus productos agotados).
  const allProducts = await listActiveProducts(store.id);
  const products = allProducts.filter(
    (p) => p.variants.reduce((s, v) => s + v.stock, 0) > 0
  );
  const eyebrow = [categoryLabel(store.category), store.city].filter(Boolean).join(" · ");
  const theme = resolveStoreTheme(store.storeStyle, store.category);
  const tagline = store.tagline || `Bienvenido a ${store.name}`;
  const Home = HOMES[theme];

  return (
    <div>
      {/* A pedido del dueño: un cliente que vuelve a la tienda (cerró la
          pestaña de seguimiento, cambió de celular) tiene que encontrar
          RÁPIDO cómo ver su pedido, o va a pensar que le robaron la plata.
          Esta franja va arriba de todo, en la página a la que más vuelve la
          gente (la raíz de la tienda) — no un link de texto escondido. */}
      <Link
        href={`/${params.slug}/mi-pedido`}
        className="store-accent-soft-bg store-accent-text flex items-center justify-center gap-2 px-5 py-2.5 text-center text-sm font-medium transition hover:opacity-90"
      >
        <Icon name="box" className="h-4 w-4" />
        <span>
          ¿Ya hiciste un pedido acá? <span className="underline underline-offset-2">Mirá en qué va →</span>
        </span>
      </Link>

      <Home
        slug={params.slug}
        eyebrow={eyebrow}
        tagline={tagline}
        store={{
          name: store.name,
          logoUrl: store.logoUrl,
          dropAt: store.dropAt,
          city: store.city,
          whatsapp: store.whatsapp,
        }}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          compareAtPrice: p.compareAtPrice,
          imageUrl: p.imageUrl,
          images: p.images ?? [],
          tags: p.tags ?? [],
          isNew: Date.now() - new Date(p.createdAt).getTime() < NEW_PRODUCT_WINDOW_MS,
        }))}
      />
    </div>
  );
}
