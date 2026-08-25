import RevealOnScroll from "./RevealOnScroll";
import TiltCard from "./TiltCard";

const FEATURES = [
  {
    icon: "🛍️",
    title: "Catálogo que se ve profesional",
    desc: "Sube tus productos con fotos, variantes de talla y color. Tu link se ve como una tienda de verdad, no como una carpeta de fotos en el chat.",
    color: "bg-jade-50",
  },
  {
    icon: "⚡",
    title: "Cobro por QR sin estar pendiente",
    desc: "El comprador escanea, paga, y el pedido queda marcado. No tienes que revisar tu banco a cada rato mientras grabas tu próximo video.",
    color: "bg-coral-50",
  },
  {
    icon: "📦",
    title: "Pedidos ordenados, no perdidos en el chat",
    desc: "Cada pedido con su estado: pendiente, pagado, en preparación, enviado. Se acabó buscar entre 200 mensajes de WhatsApp quién ya pagó.",
    color: "bg-amber-50",
  },
  {
    icon: "💬",
    title: "WhatsApp sigue siendo tuyo",
    desc: "No reemplazamos tu WhatsApp, lo potenciamos: el pedido llega armado y listo para coordinar la entrega.",
    color: "bg-jade-50",
  },
];

export default function Features() {
  return (
    <section className="px-5 py-20">
      <div className="mx-auto max-w-6xl">
        <RevealOnScroll className="mx-auto max-w-xl text-center">
          <span className="section-mark mb-4 text-ink" aria-hidden="true" />
          <h2 className="font-impact text-3xl uppercase leading-[0.95] tracking-tight text-ink md:text-5xl">
            Todo lo que ya haces por WhatsApp, pero sin el caos
          </h2>
        </RevealOnScroll>

        <div className="mt-12 grid gap-px overflow-hidden border border-ink/10 bg-ink/10 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <RevealOnScroll key={f.title} delay={i * 100} className="h-full">
              <TiltCard className="h-full bg-white p-7">
                <div
                  className={`flex h-12 w-12 items-center justify-center ${f.color} text-2xl`}
                >
                  {f.icon}
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-ink">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/60">{f.desc}</p>
              </TiltCard>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
