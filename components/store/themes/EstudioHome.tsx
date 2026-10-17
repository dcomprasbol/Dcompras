"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import { formatBs } from "@/lib/utils";
import DropCountdown from "@/components/DropCountdown";
import Icon, { type IconName } from "@/components/Icon";
import { discountPct, type ThemeHomeProps, type ThemeProduct } from "./types";
import CardTags from "./CardTags";

// Estilo "Estudio": presentación de producto tech. Negro, cuadrícula de
// fondo que se desplaza, una luz que sigue al cursor, el producto estrella
// en una vitrina que se inclina en 3D según el mouse, y tarjetas con borde
// que se ilumina donde está el puntero. Preciso y moderno, sin rebotes.

const EASE = [0.16, 1, 0.3, 1] as const;

const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const rise: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

function Rise({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

// Vitrina 3D: rota unos grados hacia donde está el mouse, con resorte.
function Showcase({ product, store }: { product: ThemeProduct | undefined; store: ThemeHomeProps["store"] }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 150, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), { stiffness: 150, damping: 18 });
  return (
    <motion.div
      className="relative mx-auto w-full max-w-sm [perspective:1000px]"
      initial={reduce ? false : { opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, ease: EASE, delay: 0.2 }}
      onMouseMove={(e) => {
        if (reduce) return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      {/* Halo del color de marca detrás de la vitrina. */}
      <div className="absolute inset-6 rounded-full bg-[var(--store-accent)] opacity-30 blur-3xl" aria-hidden="true" />
      <motion.div
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        className="store-card-bg store-border relative aspect-square overflow-hidden rounded-[var(--store-radius-lg)] border"
      >
        {product?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : store.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={store.logoUrl} alt={store.name} className="mx-auto h-2/3 w-2/3 object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-impact text-7xl text-[var(--store-accent)]">{store.name.charAt(0)}</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15" />
      </motion.div>
      {product && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6, ease: EASE }}
          className="store-card-bg store-border absolute -bottom-5 left-1/2 -translate-x-1/2 rounded-[var(--store-radius)] border px-4 py-2 text-center backdrop-blur"
          style={{ minWidth: 170 }}
        >
          <p className="store-text line-clamp-1 text-xs">{product.name}</p>
          <p className="font-mono text-sm font-bold text-[var(--store-accent)]">{formatBs(product.price)}</p>
        </motion.div>
      )}
    </motion.div>
  );
}

function Hero({ store, tagline, eyebrow, products }: {
  store: ThemeHomeProps["store"];
  tagline: string;
  eyebrow: string;
  products: ThemeProduct[];
}) {
  const reduce = useReducedMotion();
  const lx = useMotionValue(50);
  const ly = useMotionValue(40);
  const spotlight = useMotionTemplate`radial-gradient(600px circle at ${lx}% ${ly}%, color-mix(in srgb, var(--store-accent) 18%, transparent), transparent 60%)`;
  return (
    <section
      className="relative overflow-hidden px-5 pb-24 pt-16 md:px-8 md:pb-32 md:pt-24"
      onMouseMove={(e) => {
        if (reduce) return;
        const r = e.currentTarget.getBoundingClientRect();
        lx.set(((e.clientX - r.left) / r.width) * 100);
        ly.set(((e.clientY - r.top) / r.height) * 100);
      }}
    >
      {/* Cuadrícula que se desplaza lento en diagonal. */}
      <motion.div
        className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(var(--store-text)_1px,transparent_1px),linear-gradient(90deg,var(--store-text)_1px,transparent_1px)] [background-size:48px_48px]"
        animate={reduce ? undefined : { backgroundPosition: ["0px 0px", "48px 48px"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        aria-hidden="true"
      />
      <motion.div className="absolute inset-0" style={{ background: spotlight }} aria-hidden="true" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <motion.div variants={reduce ? undefined : stagger} initial={reduce ? false : "hidden"} animate="show">
          <motion.div variants={rise} className="mb-6 flex items-center gap-3">
            {store.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.logoUrl}
                alt={store.name}
                className="h-14 w-14 rounded-[var(--store-radius)] object-cover ring-2 ring-[var(--store-accent)] ring-offset-4 ring-offset-[var(--store-bg)] md:h-16 md:w-16"
              />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-[var(--store-radius)] bg-[var(--store-accent)] font-impact text-2xl text-[var(--store-accent-ink)] md:h-16 md:w-16">
                {store.name.trim().charAt(0).toUpperCase()}
              </span>
            )}
            <span className="store-text text-xl font-bold tracking-tight md:text-2xl">{store.name}</span>
          </motion.div>
          {eyebrow && (
            <motion.span variants={rise} className="store-border store-text-soft inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--store-accent)]" />
              {eyebrow}
            </motion.span>
          )}
          <motion.h1
            variants={rise}
            className="font-impact store-text mt-6 text-balance text-5xl uppercase leading-[0.92] sm:text-6xl lg:text-7xl"
          >
            {tagline.split(" ").map((w, i, all) => (
              <span key={i} className={i >= all.length - 2 ? "text-[var(--store-accent)]" : ""}>
                {w}{" "}
              </span>
            ))}
          </motion.h1>
          <motion.p variants={rise} className="store-text-soft mt-6 max-w-md text-sm md:text-base">
            Catálogo actualizado, pago por QR o contra entrega, y coordinación directa por WhatsApp una
            vez confirmas tu pedido.
          </motion.p>
          {store.dropAt && (
            <motion.div variants={rise} className="mt-7">
              <DropCountdown dropAt={store.dropAt} />
            </motion.div>
          )}
          {products.length > 0 && (
            <motion.div variants={rise} className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href="#catalogo"
                className="group inline-flex items-center gap-2 rounded-[var(--store-radius)] bg-[var(--store-accent)] px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-[var(--store-accent-ink)] shadow-[0_0_30px_-6px_var(--store-accent)] transition hover:shadow-[0_0_45px_-4px_var(--store-accent)]"
              >
                Ver catálogo
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </a>
              <span className="store-text-soft font-mono text-xs">
                {String(products.length).padStart(2, "0")} productos disponibles
              </span>
            </motion.div>
          )}
        </motion.div>

        <Showcase product={products[0]} store={store} />
      </div>
    </section>
  );
}

const PERKS: { icon: IconName; title: string; text: string }[] = [
  { icon: "qr", title: "Pago con QR", text: "Rápido y desde tu celular" },
  { icon: "home", title: "Entrega coordinada", text: "A domicilio o punto de encuentro" },
  { icon: "chat", title: "Atención directa", text: "Te respondemos por WhatsApp" },
];

function Perks() {
  return (
    <section className="store-border border-y">
      <div className="mx-auto grid max-w-7xl md:grid-cols-3">
        {PERKS.map((p, i) => (
          <Rise key={p.title} delay={i * 0.1} className="store-border flex items-center gap-4 border-b px-5 py-6 last:border-b-0 md:border-b-0 md:border-r md:px-8 md:last:border-r-0">
            <span className="store-border flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--store-radius)] border text-[var(--store-accent)]">
              <Icon name={p.icon} mono className="h-5 w-5" />
            </span>
            <span>
              <span className="store-text block text-sm font-bold">{p.title}</span>
              <span className="store-text-soft block text-xs">{p.text}</span>
            </span>
          </Rise>
        ))}
      </div>
    </section>
  );
}

// Tarjeta con borde que se ilumina en el punto donde está el mouse.
function Card({ slug, product }: { slug: string; product: ThemeProduct }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const glow = useMotionTemplate`radial-gradient(260px circle at ${x}px ${y}px, color-mix(in srgb, var(--store-accent) 55%, transparent), transparent 70%)`;
  const off = discountPct(product);
  return (
    <Link
      ref={ref}
      href={`/${slug}/producto/${product.id}`}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - r.left);
        y.set(e.clientY - r.top);
      }}
      onMouseLeave={() => {
        x.set(-200);
        y.set(-200);
      }}
      className="group relative block rounded-[var(--store-radius-lg)] p-px"
    >
      <span className="store-border absolute inset-0 rounded-[var(--store-radius-lg)] border" aria-hidden="true" />
      <motion.span className="absolute inset-0 rounded-[var(--store-radius-lg)]" style={{ background: glow }} aria-hidden="true" />
      <div className="store-card-bg relative overflow-hidden rounded-[calc(var(--store-radius-lg)-1px)]">
        <div className="relative aspect-square overflow-hidden">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center opacity-30">
              <Icon name="box" className="h-10 w-10" />
            </div>
          )}
          {(off > 0 || product.isNew) && (
            <span className="absolute left-3 top-3 rounded bg-[var(--store-accent)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--store-accent-ink)]">
              {off > 0 ? `-${off}%` : "Nuevo"}
            </span>
          )}
        </div>
        <div className="flex items-end justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="store-text truncate text-sm font-semibold">{product.name}</p>
            <CardTags tags={product.tags} className="store-text-soft mt-0.5 text-[11px] uppercase tracking-wide" />
            <p className="mt-1 font-mono text-sm font-bold text-[var(--store-accent)]">{formatBs(product.price)}</p>
          </div>
          <span className="store-border store-text flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition group-hover:border-[var(--store-accent)] group-hover:bg-[var(--store-accent)] group-hover:text-[var(--store-accent-ink)]">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function EstudioHome({ slug, store, products, eyebrow, tagline }: ThemeHomeProps) {
  return (
    <div>
      <Hero store={store} tagline={tagline} eyebrow={eyebrow} products={products} />
      <Perks />
      <section id="catalogo" className="mx-auto max-w-7xl scroll-mt-20 px-5 pb-24 pt-16 md:px-8">
        <Rise className="mb-10 flex items-end justify-between gap-4">
          <h2 className="font-impact store-text text-4xl uppercase tracking-tight md:text-5xl">Catálogo</h2>
          {products.length > 0 && (
            <span className="store-text-soft font-mono text-xs">
              [{String(products.length).padStart(2, "0")}] productos
            </span>
          )}
        </Rise>
        {products.length === 0 ? (
          <p className="store-border store-text-soft rounded-[var(--store-radius-lg)] border border-dashed p-8 text-center text-sm">
            Esta tienda todavía no publicó productos.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {products.map((p, i) => (
              <Rise key={p.id} delay={(i % 3) * 0.08}>
                <Card slug={slug} product={p} />
              </Rise>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
