import RevealOnScroll from "./RevealOnScroll";
import CountUp from "./CountUp";

const STATS = [
  { value: "US$ 834M", label: "movió el e-commerce boliviano en 2025" },
  { value: "92%", label: "de los pagos digitales en Bolivia ya son por QR" },
  { value: "+4.700%", label: "creció el pago por QR en menos de 3 años" },
];

export default function Stats() {
  return (
    <>
      {/* Transición entre el Hero oscuro y esta sección clara: el mismo
          corte diagonal con filo jade que tiene la "D" del logo. */}
      <div className="relative h-10 md:h-14" aria-hidden="true">
        <div className="absolute inset-0 bg-jade-400 [clip-path:polygon(0_0,100%_0,0_100%)]" />
        <div className="absolute inset-0 bg-ink [clip-path:polygon(0_0,100%_0,0_78%)]" />
      </div>
      <section className="px-5 pb-16 pt-4">
      <div className="mx-auto max-w-6xl">
        <RevealOnScroll>
          <p className="mb-8 text-center text-xs font-semibold uppercase tracking-widest text-ink/40">
            El mercado ya está listo, solo falta la herramienta
          </p>
        </RevealOnScroll>
        <div className="grid gap-px overflow-hidden border border-ink/10 bg-ink/10 sm:grid-cols-3">
          {STATS.map((s, i) => (
            <RevealOnScroll key={s.label} delay={i * 120} className="h-full">
              <div className="flex h-full flex-col justify-between bg-paper p-7">
                <p className="font-impact text-4xl text-ink">
                  <CountUp value={s.value} />
                </p>
                <p className="mt-3 text-sm text-ink/60">{s.label}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
      </section>
    </>
  );
}
