import RevealOnScroll from "./RevealOnScroll";

// Casi todo el tráfico entra desde el link que el vendedor pega en su bio o
// su estado — por eso la tienda pública ya está construida mobile-first
// (ver app/[slug]/**). Esta sección solo lo hace visible: no es una app
// nativa, es la misma tienda web abriéndose en el celular.
export default function MobileExperience() {
  return (
    <section className="bg-ink px-5 py-20 text-white">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
        <RevealOnScroll className="order-2 lg:order-1">
          {/* Marco de teléfono hecho en CSS puro — sin imágenes. */}
          <div className="mx-auto w-[220px] rounded-[2rem] border-4 border-white/15 bg-black p-1.5 shadow-2xl shadow-black/60">
            <div className="overflow-hidden rounded-[1.4rem] bg-paper">
              <div className="flex items-center gap-1.5 bg-white px-3 py-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-jade-500" />
                <span className="text-[10px] font-bold text-ink">Luna Studio</span>
                <span className="ml-auto text-[10px] text-ink/30">🛒</span>
              </div>
              <div className="grid grid-cols-2 gap-1 p-1.5">
                {["/landing/moda.jpg", "/landing/tecnologia.jpg", "/landing/belleza.jpg", "/landing/comida.jpg"].map(
                  (src, i) => (
                    <div key={src} className="overflow-hidden rounded-md bg-white">
                      <div className="aspect-square w-full overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="h-full w-full object-cover" />
                      </div>
                      <p className="px-1 py-1 font-mono text-[8px] font-bold text-ink">Bs {120 + i * 30}</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={100} className="order-1 lg:order-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-jade-400">
            Experiencia móvil
          </span>
          <h2 className="mt-3 font-impact text-3xl uppercase leading-[0.95] tracking-tight md:text-5xl">
            Tu tienda, lista para el link en tu bio.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60 md:text-base">
            Compartila en tu estado de WhatsApp, tu bio de TikTok o tu feed de Instagram: se abre
            directo en el celular de tu cliente, sin descargar nada, y se ve tan bien como en la
            computadora.
          </p>
        </RevealOnScroll>
      </div>
    </section>
  );
}
