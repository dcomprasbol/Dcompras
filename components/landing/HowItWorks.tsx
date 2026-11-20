import RevealOnScroll from "./RevealOnScroll";

const STEPS = [
  {
    n: "01",
    title: "Crea tu tienda",
    desc: "El nombre de tu tienda, tu WhatsApp y tu ciudad. No te pedimos tarjeta.",
  },
  {
    n: "02",
    title: "Sube tu catálogo",
    desc: "Fotos, precio y tallas o colores. Revisamos tu tienda y queda publicada.",
  },
  {
    n: "03",
    title: "Comparte tu link",
    desc: "Ponlo en tu bio de TikTok o Instagram y en tus estados de WhatsApp.",
  },
  {
    n: "04",
    title: "Recibe pedidos y cobra",
    desc: "Tu cliente paga con QR o contra entrega. Tú preparas el pedido y lo entregas.",
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-ink px-5 py-20 text-white">
      <div className="mx-auto max-w-6xl">
        <RevealOnScroll className="max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-widest text-jade-400">
            Cómo funciona
          </p>
          <h2 className="mt-3 font-impact text-3xl uppercase leading-[0.95] tracking-tight md:text-5xl">
            Así empiezas a vender
          </h2>
        </RevealOnScroll>

        <div className="mt-14 grid gap-8 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <RevealOnScroll key={s.n} delay={i * 120}>
              <div className="relative border-t border-white/15 pt-5">
                <span className="font-impact text-lg text-jade-400">{s.n}</span>
                <h3 className="mt-3 font-display text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{s.desc}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
