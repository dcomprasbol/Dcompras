"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type Variants } from "framer-motion";
import { formatBs } from "@/lib/utils";
import DropCountdown from "@/components/DropCountdown";
import Icon from "@/components/Icon";
import { discountPct, type ThemeHomeProps, type ThemeProduct } from "./types";
import CardTags from "./CardTags";

// Estilo "Editorial": revista de moda urbana. Portada tinta con titulares
// impact en mayúsculas que suben desde una máscara, fotos en abanico con un
// sello giratorio, cinta de palabras, una palabra gigante que se desliza con
// el scroll y tarjetas cuadradas que se invierten al pasar el mouse. Duro,
// rápido y con actitud (curvas de animación cortas y secas).

const SNAP = [0.83, 0, 0.17, 1] as const;

const lines: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } } };
const line: Variants = {
  hidden: { y: "110%" },
  show: { y: "0%", transition: { duration: 0.8, ease: SNAP } },
};

function SlideUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: SNAP, delay }}
    >
      {children}
    </motion.div>
  );
}

// Texto que gira en círculo alrededor de un punto: sello "nuevo drop".
function SpinningSeal({ text }: { text: string }) {
  const reduce = useReducedMotion();
  const chars = `${text} · ${text} · `.toUpperCase();
  return (
    <motion.div
      className="absolute -right-4 -top-6 z-20 h-28 w-28 md:-right-8"
      animate={reduce ? undefined : { rotate: 360 }}
      transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <defs>
          <path id="seal-circle" d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0" />
        </defs>
        <circle cx="50" cy="50" r="48" style={{ fill: "var(--store-accent)" }} />
        <text style={{ fill: "var(--store-accent-ink)" }} className="font-impact text-[10.5px] tracking-[0.18em]">
          <textPath href="#seal-circle">{chars}</textPath>
        </text>
      </svg>
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
  const pics = products.filter((p) => p.imageUrl).slice(0, 3);
  // Partimos el titular en 2-3 líneas parejas para que cada una suba sola.
  const words = tagline.split(" ");
  const per = Math.ceil(words.length / Math.min(3, Math.max(1, Math.ceil(words.length / 2))));
  const rows: string[] = [];
  for (let i = 0; i < words.length; i += per) rows.push(words.slice(i, i + per).join(" "));

  return (
    <section className="relative overflow-hidden bg-ink px-5 pb-20 pt-14 text-white md:px-8 md:pb-28 md:pt-20">
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: SNAP }}
            className="mb-6 flex items-center gap-3"
          >
            {store.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={store.logoUrl} alt={store.name} className="h-16 w-16 border-2 border-white bg-white object-cover md:h-20 md:w-20" />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center bg-[var(--store-accent)] font-impact text-3xl text-[var(--store-accent-ink)] md:h-20 md:w-20">
                {store.name.trim().charAt(0).toUpperCase()}
              </span>
            )}
            <span className="font-impact text-2xl uppercase tracking-tight md:text-3xl">{store.name}</span>
          </motion.div>
          {eyebrow && (
            <motion.span
              initial={reduce ? false : { opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: SNAP }}
              className="tag-editorial inline-block border border-white/25 text-white/70"
            >
              {eyebrow}
            </motion.span>
          )}
          <motion.h1
            variants={reduce ? undefined : lines}
            initial={reduce ? false : "hidden"}
            animate="show"
            className="mt-6 font-impact text-[13vw] uppercase leading-[0.88] sm:text-7xl lg:text-8xl"
          >
            {rows.map((r, i) => (
              <span key={i} className="block overflow-hidden">
                <motion.span variants={line} className={`block ${i === rows.length - 1 ? "text-[var(--store-accent)]" : ""}`}>
                  {r}
                </motion.span>
              </span>
            ))}
          </motion.h1>
          <motion.p
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mt-7 max-w-md text-sm text-white/60 md:text-base"
          >
            Catálogo actualizado, pago por QR o contra entrega, y coordinación directa por WhatsApp una
            vez confirmas tu pedido.
          </motion.p>
          {store.dropAt && (
            <div className="mt-7">
              <DropCountdown dropAt={store.dropAt} />
            </div>
          )}
          {products.length > 0 && (
            <motion.a
              href="#catalogo"
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.6, ease: SNAP }}
              className="group mt-9 inline-flex items-center gap-3 border border-white bg-white px-7 py-4 font-impact text-sm uppercase tracking-wider text-ink transition-colors hover:bg-transparent hover:text-white"
            >
              Ver catálogo
              <span className="inline-block transition-transform group-hover:translate-y-1">↓</span>
            </motion.a>
          )}
        </div>

        {/* Abanico de fotos: se abren al cargar y se mueven un poco con el mouse encima. */}
        <div className="relative mx-auto h-[360px] w-full max-w-sm md:h-[440px]">
          {pics.length > 0 ? (
            pics.map((p, i) => {
              const rot = [-13, 10, -2][i];
              const x = [-70, 70, 0][i];
              return (
                <motion.div
                  key={p.id}
                  className="absolute inset-x-16 top-6 aspect-[4/5] overflow-hidden border-4 border-white bg-white shadow-2xl sm:inset-x-8"
                  style={{ zIndex: i === 2 ? 3 : i }}
                  initial={reduce ? false : { rotate: 0, x: 0, y: 60, opacity: 0 }}
                  animate={{ rotate: rot, x, y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 120, damping: 16, delay: 0.3 + i * 0.12 }}
                  whileHover={reduce ? undefined : { rotate: 0, scale: 1.04, zIndex: 10 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.imageUrl!} alt={p.name} className="h-full w-full object-cover" />
                </motion.div>
              );
            })
          ) : (
            <div className="store-accent-soft-bg absolute inset-x-8 top-6 flex aspect-[4/5] items-center justify-center">
              {store.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={store.logoUrl} alt={store.name} className="h-full w-full object-cover" />
              ) : (
                <span className="store-accent-text font-impact text-8xl">{store.name.charAt(0)}</span>
              )}
            </div>
          )}
          {products.length > 0 && <SpinningSeal text="Nuevo drop" />}
        </div>
      </div>
    </section>
  );
}

function Ticker({ words }: { words: string[] }) {
  const reduce = useReducedMotion();
  const row = [...words, ...words, ...words, ...words];
  return (
    <div className="overflow-hidden border-y border-white/10 bg-ink py-3" aria-hidden="true">
      <motion.div
        className="flex w-max gap-8 whitespace-nowrap"
        animate={reduce ? undefined : { x: ["0%", "-50%"] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      >
        {row.map((w, i) => (
          <span key={i} className="flex items-center gap-8 font-impact text-xs uppercase tracking-wider text-white/50">
            {w}
            <span className={`inline-block h-1.5 w-1.5 ${i % 3 === 0 ? "bg-[var(--store-accent)]" : "bg-white/20"}`} />
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function BigWord({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["10%", "-40%"]);
  return (
    <div ref={ref} className="overflow-hidden py-6" aria-hidden="true">
      <motion.p
        style={{ x }}
        className="whitespace-nowrap font-impact text-[22vw] uppercase leading-none tracking-tight text-ink/[0.06] md:text-[16vw]"
      >
        {text} — {text} — {text}
      </motion.p>
    </div>
  );
}

function Card({ slug, product, index }: { slug: string; product: ThemeProduct; index: number }) {
  const off = discountPct(product);
  return (
    <Link href={`/${slug}/producto/${product.id}`} className="group block border border-ink/10 bg-white transition-colors duration-300 hover:bg-ink">
      <div className="relative aspect-square overflow-hidden bg-paper">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-110 group-hover:grayscale-[30%]" />
        ) : (
          <div className="flex h-full items-center justify-center text-ink/25">
            <Icon name="bag" className="h-10 w-10" />
          </div>
        )}
        <span className="absolute left-0 top-0 bg-ink px-2 py-1 font-impact text-[11px] text-white">
          {String(index + 1).padStart(2, "0")}
        </span>
        {(off > 0 || product.isNew) && (
          <span className="tag-editorial absolute right-2 top-2 bg-coral-500 text-white">
            {off > 0 ? `-${off}%` : "Nuevo"}
          </span>
        )}
        <span className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-between bg-[var(--store-accent)] px-3 py-2 font-impact text-xs uppercase text-[var(--store-accent-ink)] transition-transform duration-300 group-hover:translate-y-0">
          Ver producto <span>→</span>
        </span>
      </div>
      <div className="p-3">
        <p className="line-clamp-1 text-sm font-medium text-ink transition-colors group-hover:text-white">{product.name}</p>
        <CardTags tags={product.tags} className="mt-0.5 text-[11px] text-ink/45 transition-colors group-hover:text-white/60" />
        <p className="mt-0.5 font-mono text-sm font-bold text-ink transition-colors group-hover:text-white">
          {formatBs(product.price)}
          {off > 0 && (
            <span className="ml-2 text-xs font-normal text-ink/40 line-through group-hover:text-white/50">
              {formatBs(product.compareAtPrice!)}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}

export default function EditorialHome({ slug, store, products, eyebrow, tagline }: ThemeHomeProps) {
  return (
    <div>
      <Hero store={store} tagline={tagline} eyebrow={eyebrow} products={products} />
      <Ticker words={[store.name, "Pago por QR", "Contra entrega", "Pedido por WhatsApp", store.city ?? "Bolivia"]} />

      <section id="catalogo" className="mx-auto max-w-7xl scroll-mt-20 px-5 pt-16 md:px-8">
        <SlideUp className="flex items-end justify-between gap-4">
          <div>
            <span className="mb-3 block h-1.5 w-12 bg-[var(--store-accent)]" aria-hidden="true" />
            <h2 className="font-impact text-4xl uppercase tracking-tight text-ink md:text-6xl">Nuestros productos</h2>
          </div>
          {products.length > 0 && (
            <p className="font-mono text-xs text-ink/40">
              {String(products.length).padStart(2, "0")} productos
            </p>
          )}
        </SlideUp>
      </section>

      <BigWord text={store.name} />

      <section className="mx-auto max-w-7xl px-5 pb-24 md:px-8">
        {products.length === 0 ? (
          <p className="border border-dashed border-ink/15 bg-white p-8 text-center text-sm text-ink/50">
            Esta tienda todavía no publicó productos.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p, i) => (
              <SlideUp key={p.id} delay={(i % 4) * 0.07}>
                <Card slug={slug} product={p} index={i} />
              </SlideUp>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
