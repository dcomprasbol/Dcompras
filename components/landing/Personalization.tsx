import Link from "next/link";
import RevealOnScroll from "./RevealOnScroll";

// Vitrina de personalización: cada tienda en Dcompras elige su propio color
// de marca, tipografía y logo — ver STORE_FONTS / themeColor en
// lib/utils.ts y lib/repo.ts, es una función real, no una promesa. Estos 5
// ejemplos son ilustrativos (nombres y colores inventados para mostrar el
// rango), no tiendas reales de la plataforma — pero la categoría de cada
// card SÍ es real y clickeable: lleva al ranking de esa categoría
// (/categoria/[x], ver STORE_CATEGORIES en lib/utils.ts). "Artesanías" no
// es una categoría propia todavía, así que esa card apunta a "hogar"
// (la más cercana: tejidos/decoración hecha a mano).
const STORES = [
  { name: "Luna Studio", category: "Moda", categoryValue: "ropa", color: "#FF4D6D", product: "Chompa oversize", price: "Bs 189", image: "/landing/moda.jpg" },
  { name: "Nodo Tech", category: "Tecnología", categoryValue: "electronicos", color: "#3B82F6", product: "Auriculares BT", price: "Bs 245", image: "/landing/tecnologia.jpg" },
  { name: "Piel Andina", category: "Belleza", categoryValue: "belleza", color: "#F472B6", product: "Set skincare", price: "Bs 120", image: "/landing/belleza.jpg" },
  { name: "Sabor Local", category: "Comida", categoryValue: "comida", color: "#FB923C", product: "Torta personalizada", price: "Bs 90", image: "/landing/comida.jpg" },
  { name: "Telar Tarija", category: "Artesanías", categoryValue: "hogar", color: "#A16207", product: "Tejido a mano", price: "Bs 310", image: "/landing/artesanias.jpg" },
] as const;

export default function Personalization() {
  return (
    <section className="px-5 py-20">
      <div className="mx-auto max-w-6xl">
        <RevealOnScroll className="mx-auto max-w-xl text-center">
          <span className="section-mark mb-4 text-ink" aria-hidden="true" />
          <h2 className="font-impact text-3xl uppercase leading-[0.95] tracking-tight text-ink md:text-5xl">
            Dcompras es la plataforma.
            <br />
            La tienda sigue siendo tuya.
          </h2>
          <p className="mt-4 text-sm text-ink/60 md:text-base">
            Color de marca, tipografía y logo — cada vendedor arma su propia identidad desde su
            panel, sin tocar una línea de código.
          </p>
        </RevealOnScroll>

        <div className="mt-12 flex gap-4 overflow-x-auto pb-4 [scrollbar-width:none] sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 lg:grid-cols-5 [&::-webkit-scrollbar]:hidden">
          {STORES.map((s, i) => (
            <RevealOnScroll
              key={s.name}
              delay={i * 80}
              className={`w-[180px] shrink-0 sm:w-auto ${i % 2 === 1 ? "sm:mt-6" : ""}`}
            >
              <Link
                href={`/categoria/${s.categoryValue}`}
                className="block overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center gap-1.5 px-3 py-2.5">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: s.color }}
                    aria-hidden="true"
                  />
                  <span className="truncate text-xs font-bold text-ink">{s.name}</span>
                </div>
                <div className="aspect-square w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.image} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="px-3 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: s.color }}>
                    {s.category} →
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ink/70">{s.product}</p>
                  <p className="font-mono text-xs font-bold text-ink">{s.price}</p>
                </div>
              </Link>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
