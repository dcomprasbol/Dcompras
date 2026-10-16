import RevealOnScroll from "./RevealOnScroll";
import { MotionLinkButton } from "@/components/MotionCta";
import BrandMark from "@/components/BrandMark";

// Íconos propios en línea (trazo jade sobre tile tinta), sin emojis.
const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path d="M5 8h14l-1 12H6z" {...stroke} />
      <path d="M9 10V7a3 3 0 0 1 6 0v3" {...stroke} />
    </svg>
  );
}

function QrIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <rect x="4" y="4" width="6" height="6" rx="1" {...stroke} />
      <rect x="14" y="4" width="6" height="6" rx="1" {...stroke} />
      <rect x="4" y="14" width="6" height="6" rx="1" {...stroke} />
      <path d="M14 14h2M20 14v2M14 18v2M17 17v3M20 19v1" {...stroke} />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <rect x="5" y="4.5" width="14" height="16" rx="2" {...stroke} />
      <path d="M9 3.5h6v2.5H9z" {...stroke} />
      <path d="M9 11h.01M12 11h3M9 15h.01M12 15h3" {...stroke} />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.2A8 8 0 1 1 20 11.5z"
        {...stroke}
      />
    </svg>
  );
}

const FEATURES = [
  {
    icon: <BagIcon />,
    title: "Tu tienda, siempre lista",
    desc: "Productos, precios y variantes en un solo enlace profesional.",
  },
  {
    icon: <QrIcon />,
    title: "Cobra sin complicarte",
    desc: "Tus clientes pagan por QR y el pedido se registra automáticamente.",
  },
  {
    icon: <ClipboardIcon />,
    title: "Cada pedido bajo control",
    desc: "Organiza ventas, pagos y entregas desde un solo lugar.",
  },
  {
    icon: <ChatIcon />,
    title: "Sigue usando WhatsApp",
    desc: "Atiende a tus clientes como siempre, pero con pedidos organizados.",
  },
];

export default function Features() {
  return (
    <section className="bg-white px-5 py-20">
      <div className="mx-auto max-w-4xl">
        <RevealOnScroll className="mx-auto max-w-3xl text-center">
          <BrandMark className="mx-auto mb-5 h-10 w-auto" bg="#FFFFFF" />
          <h2 className="font-impact text-3xl uppercase leading-[0.95] tracking-tight text-ink md:text-5xl">
            Tu negocio sigue en WhatsApp.
            <br />
            <span className="text-jade-500">El desorden, no.</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-ink/70 md:text-lg">
            Convierte tu catálogo, tus cobros y tus pedidos en una tienda
            organizada, sin cambiar la forma en que hablas con tus clientes.
          </p>
        </RevealOnScroll>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <RevealOnScroll key={f.title} delay={i * 100} className="h-full">
              <div className="h-full rounded-xl border border-ink/5 bg-paper p-5 transition-colors hover:border-ink/15">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-ink text-jade-400">
                  {f.icon}
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-ink">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/65">{f.desc}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        <RevealOnScroll className="mt-8 flex flex-col items-center text-center">
          <MotionLinkButton
            href="/crear-tienda"
            className="btn-editorial btn-editorial-solid"
          >
            Crear mi tienda gratis
            <span className="text-jade-400" aria-hidden="true">→</span>
          </MotionLinkButton>
          <p className="mt-3 text-sm text-ink/60">
            Sin instalación ni mensualidades · 1 % por venta
          </p>
        </RevealOnScroll>
      </div>
    </section>
  );
}
