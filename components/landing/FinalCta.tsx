import RevealOnScroll from "./RevealOnScroll";
import { MotionLinkButton } from "@/components/MotionCta";

export default function FinalCta() {
  return (
    <section className="px-5 pb-24">
      <RevealOnScroll>
        <div className="relative mx-auto max-w-5xl overflow-hidden border border-ink/10 bg-ink px-8 py-20 text-center text-white">
          <h2 className="relative font-impact text-4xl uppercase leading-[0.92] tracking-tight md:text-6xl">
            Tu próxima venta puede llegar
            <br />
            mientras grabas el siguiente video.
          </h2>
          <MotionLinkButton href="/crear-tienda" className="btn-editorial bg-white text-ink border-white relative mt-9 inline-flex">
            Crear mi tienda gratis →
          </MotionLinkButton>
        </div>
      </RevealOnScroll>
    </section>
  );
}
