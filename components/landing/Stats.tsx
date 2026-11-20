import RevealOnScroll from "./RevealOnScroll";
import CountUp from "./CountUp";

// Solo cifras publicadas por el Banco Central de Bolivia, con su fuente a la
// vista. Antes había tres números sin fuente (US$ 834M de e-commerce, 92% y
// +4.700%) que no aparecen en ningún informe: no los vuelvas a poner sin
// una fuente que se pueda citar.
const STATS = [
  {
    value: "+131%",
    label: "crecieron los pagos con QR en Bolivia en 2025, frente a 2024",
    source: "BCB, Informe de Vigilancia del Sistema de Pagos 2025",
  },
  {
    value: "86%",
    label: "de las transferencias electrónicas de 2025 fueron pagos inmediatos, como el QR",
    source: "BCB, 2025",
  },
  {
    value: "28",
    label: "pagos con QR por segundo se hacen hoy en el país",
    source: "BCB, junio de 2026",
  },
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
            En Bolivia ya se paga con QR
          </p>
        </RevealOnScroll>
        <div className="grid gap-px overflow-hidden border border-ink/10 bg-ink/10 sm:grid-cols-3">
          {STATS.map((s, i) => (
            <RevealOnScroll key={s.label} delay={i * 120} className="h-full">
              <div className="flex h-full flex-col justify-between bg-paper p-7">
                <p className="font-impact text-4xl text-ink">
                  <CountUp value={s.value} />
                </p>
                <div>
                  <p className="mt-3 text-sm text-ink/60">{s.label}</p>
                  <p className="mt-2 text-[11px] text-ink/35">Fuente: {s.source}</p>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
      </section>
    </>
  );
}
