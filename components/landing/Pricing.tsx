import RevealOnScroll from "./RevealOnScroll";
import Link from "next/link";

export default function Pricing() {
  return (
    <section id="precios" className="px-5 py-20">
      <div className="mx-auto max-w-3xl text-center">
        <RevealOnScroll>
          <p className="text-xs font-semibold uppercase tracking-widest text-ink/40">Precios</p>
          <h2 className="mt-3 font-impact text-3xl uppercase leading-[0.95] tracking-tight text-ink md:text-5xl">
            Publicar es gratis. Solo ganamos cuando tú ganas.
          </h2>
        </RevealOnScroll>

        <RevealOnScroll delay={150}>
          {/* Borde jade que gira alrededor de la tarjeta: un degradado cónico
              detrás, recortado a 2px por la tarjeta blanca de encima. */}
          <div className="relative mx-auto mt-10 max-w-md overflow-hidden p-[2px]">
            <div
              className="absolute left-1/2 top-1/2 aspect-square w-[160%] -translate-x-1/2 -translate-y-1/2 animate-[spin_6s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_250deg,#1DBE86_320deg,#14102A_360deg)]"
              aria-hidden="true"
            />
            <div className="absolute inset-0 border border-ink/10" aria-hidden="true" />
            <div className="relative flex flex-col items-center bg-white p-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-jade-600">
                Plan Gratis
              </p>
              <p className="mt-2 font-impact text-6xl text-ink">Bs 0</p>
              <div className="my-6 h-px w-full bg-ink/10" />
              <ul className="space-y-2 text-sm text-ink/70">
                <li>Catálogo y checkout ilimitado</li>
                <li>Integración con WhatsApp</li>
                <li>Pago contra entrega</li>
              </ul>
              <p className="mt-5 text-xs text-ink/40">
                Cuando activas el cobro automático por QR, aplicamos una comisión pequeña solo
                sobre esa venta. Si vendes por contra entrega, no cobramos nada.
              </p>
              <Link href="/crear-tienda" className="btn-editorial btn-editorial-solid mt-6 w-full">
                Empezar gratis
              </Link>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
