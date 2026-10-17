import type { Metadata } from "next";
import { listPublicStores } from "@/lib/repo";
import { STORE_CATEGORIES } from "@/lib/utils";
import DirectoryHeader from "@/components/directory/DirectoryHeader";
import PublicStoreBrowser from "@/components/directory/PublicStoreBrowser";
import RevealOnScroll from "@/components/landing/RevealOnScroll";
import BrandMark from "@/components/BrandMark";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Todas las tiendas · Dcompras",
  description: "Explora todas las tiendas de vendedores bolivianos en Dcompras y compra con QR o contra entrega.",
};

// Directorio público de todas las tiendas aprobadas: para el comprador que
// no llega con el link de una tienda en particular y quiere ver qué hay.
export default async function TiendasPage({ searchParams }: { searchParams: { categoria?: string } }) {
  const stores = await listPublicStores();
  const initial = STORE_CATEGORIES.some((c) => c.value === searchParams.categoria) ? searchParams.categoria : "todas";

  return (
    <div className="min-h-screen bg-paper">
      <DirectoryHeader />
      <section className="relative overflow-hidden bg-ink px-5 pb-16 pt-14 text-white">
        <span className="absolute bottom-0 left-0 h-24 w-24 bg-jade-400 [clip-path:polygon(0_0,100%_100%,0_100%)]" aria-hidden="true" />
        <RevealOnScroll className="relative mx-auto max-w-6xl">
          <BrandMark className="mb-5 h-10 w-auto" color="#FFFFFF" bg="#14102A" />
          <h1 className="font-impact text-5xl uppercase leading-[0.9] tracking-tight md:text-7xl">
            Todas las tiendas
          </h1>
          <p className="mt-4 max-w-xl text-white/60">
            {stores.length} tienda{stores.length === 1 ? "" : "s"} de vendedores de toda Bolivia. Entra, elige y compra
            directo, con QR o contra entrega.
          </p>
        </RevealOnScroll>
      </section>
      <main className="mx-auto max-w-6xl px-5 py-10">
        <PublicStoreBrowser stores={stores} initialCategory={initial} />
      </main>
    </div>
  );
}
