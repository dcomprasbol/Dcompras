import RevealOnScroll from "./RevealOnScroll";
import TiltCard from "./TiltCard";

// Íconos propios en línea, con el lenguaje del logo: tile tinta + el corte
// diagonal jade de la "D" en la esquina. El acento jade marca el detalle clave.
const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "square" as const,
  strokeLinejoin: "miter" as const,
};

function CatalogIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path d="M4.5 8h15l-1 12.5h-13z" {...stroke} />
      <path d="M8.5 10V6.5a3.5 3.5 0 0 1 7 0V10" {...stroke} className="text-jade-400" />
    </svg>
  );
}

function QrIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <rect x="3.5" y="3.5" width="6" height="6" {...stroke} />
      <rect x="5.75" y="5.75" width="1.5" height="1.5" fill="currentColor" />
      <rect x="14.5" y="3.5" width="6" height="6" {...stroke} />
      <rect x="16.75" y="5.75" width="1.5" height="1.5" fill="currentColor" />
      <rect x="3.5" y="14.5" width="6" height="6" {...stroke} />
      <rect x="5.75" y="16.75" width="1.5" height="1.5" fill="currentColor" />
      <rect x="13.5" y="13.5" width="3" height="3" className="fill-jade-400" />
      <rect x="17.5" y="17.5" width="3" height="3" className="fill-jade-400" />
      <rect x="13.5" y="18.5" width="2" height="2" fill="currentColor" />
      <rect x="18.5" y="13.5" width="2" height="2" fill="currentColor" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path d="M10 6h10.5M10 12h10.5M10 18h10.5" {...stroke} />
      <path d="M3.5 6l1.5 1.5 2.5-3M3.5 12l1.5 1.5 2.5-3" {...stroke} className="text-jade-400" />
      <rect x="4" y="16.5" width="3" height="3" {...stroke} />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path d="M3.5 4.5h17v11.5h-9l-5 4v-4h-3z" {...stroke} />
      <path d="M8 10.5l2.5 2.5 5-5" {...stroke} className="text-jade-400" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: <CatalogIcon />,
    title: "Catálogo que se ve profesional",
    desc: "Sube tus productos con fotos, variantes de talla y color. Tu link se ve como una tienda de verdad, no como una carpeta de fotos en el chat.",
  },
  {
    icon: <QrIcon />,
    title: "Cobro por QR sin estar pendiente",
    desc: "El comprador escanea, paga, y el pedido queda marcado. No tienes que revisar tu banco a cada rato mientras grabas tu próximo video.",
  },
  {
    icon: <OrdersIcon />,
    title: "Pedidos ordenados, no perdidos en el chat",
    desc: "Cada pedido con su estado: pendiente, pagado, en preparación, enviado. Se acabó buscar entre 200 mensajes de WhatsApp quién ya pagó.",
  },
  {
    icon: <ChatIcon />,
    title: "WhatsApp sigue siendo tuyo",
    desc: "No reemplazamos tu WhatsApp, lo potenciamos: el pedido llega armado y listo para coordinar la entrega.",
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
                <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden bg-ink text-white">
                  <span
                    className="absolute bottom-0 left-0 h-4 w-4 bg-jade-400 [clip-path:polygon(0_0,100%_100%,0_100%)]"
                    aria-hidden="true"
                  />
                  <span className="relative">{f.icon}</span>
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
