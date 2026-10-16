"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type Variants } from "framer-motion";
import { formatBs } from "@/lib/utils";
import DropCountdown from "@/components/DropCountdown";
import Icon from "@/components/Icon";
import { discountPct, type ThemeHomeProps, type ThemeProduct } from "./types";

// Estilo "Galería": como entrar a un museo. Blanco roto, el nombre de la
// tienda gigante que sube letra por letra detrás de una máscara, una tira de
// fotos que se desliza al hacer scroll, y una grilla asimétrica donde cada
// foto se "destapa" (clip-path) al entrar en pantalla. Tipografía y datos
// como fichas de obra: número, nombre, precio.

const EASE = [0.76, 0, 0.24, 1] as const;

const lettersV: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.035, delayChildren: 0.15 } },
};
const letterV: Variants = {
  hidden: { y: "105%" },
  show: { y: "0%", transition: { duration: 0.9, ease: EASE } },
};

// La foto se "destapa" de abajo hacia arriba. El que detecta el scroll es
// el contenedor de afuera (sin recorte): un elemento recortado al 100% no
// cuenta como visible para el navegador y la animación nunca arrancaría.
const unveilV: Variants = {
  hidden: { clipPath: "inset(100% 0% 0% 0%)" },
  show: { clipPath: "inset(0% 0% 0% 0%)", transition: { duration: 1.2, ease: EASE } },
};

function Unveil({ children, className = "", innerClassName = "" }: { children: React.ReactNode; className?: string; innerClassName?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`relative ${className}`}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
    >
      <motion.div variants={unveilV} className={`absolute inset-0 ${innerClassName}`}>
        {children}
      </motion.div>
    </motion.div>
  );
}

function FadeUp({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

function Hero({ store, tagline, eyebrow, hasProducts }: {
  store: ThemeHomeProps["store"];
  tagline: string;
  eyebrow: string;
  hasProducts: boolean;
}) {
  const reduce = useReducedMotion();
  const name = store.name.trim();
  // Letra más chica cuanto más largo el nombre, para que siempre entre en una línea.
  const size =
    name.length <= 6 ? "text-[22vw]" : name.length <= 10 ? "text-[15vw]" : name.length <= 16 ? "text-[10vw]" : "text-[7vw]";
  return (
    <section className="px-5 pb-10 pt-12 md:px-10 md:pt-16">
      <div className="flex flex-wrap items-start justify-between gap-4 text-[11px] uppercase tracking-[0.25em] text-[var(--store-text-soft)]">
        <FadeUp>{eyebrow || "Colección"}</FadeUp>
        <FadeUp delay={0.1}>{store.city ?? "Bolivia"}</FadeUp>
      </div>
      <motion.h1
        variants={reduce ? undefined : lettersV}
        initial={reduce ? false : "hidden"}
        animate="show"
        className={`mt-6 whitespace-nowrap font-semibold uppercase leading-[0.82] tracking-[-0.06em] ${size}`}
        aria-label={name}
      >
        {name.split("").map((ch, i) => (
          <span key={i} className="inline-block overflow-hidden align-bottom" aria-hidden="true">
            <motion.span variants={letterV} className="inline-block">
              {ch === " " ? " " : ch}
            </motion.span>
          </span>
        ))}
      </motion.h1>
      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <FadeUp delay={0.5}>
          <p className="store-headline max-w-xl text-2xl font-light leading-snug md:text-3xl">{tagline}</p>
        </FadeUp>
        <FadeUp delay={0.65} className="flex items-center gap-6">
          {store.dropAt && <DropCountdown dropAt={store.dropAt} />}
          {hasProducts && (
            <a href="#obras" className="group inline-flex items-center gap-3 text-sm font-medium">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--store-text)] transition-colors duration-500 group-hover:bg-[var(--store-text)] group-hover:text-[var(--store-bg)]">
                <span className="inline-block rotate-90 transition-transform duration-500 group-hover:translate-y-0.5">→</span>
              </span>
              Ver colección
            </a>
          )}
        </FadeUp>
      </div>
    </section>
  );
}

function ScrollStrip({ products }: { products: ThemeProduct[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["4%", "-28%"]);
  const imgs = products.filter((p) => p.imageUrl).slice(0, 8);
  if (imgs.length < 3) return null;
  return (
    <div ref={ref} className="overflow-hidden py-6" aria-hidden="true">
      <motion.div style={{ x }} className="flex w-max gap-4">
        {imgs.map((p, i) => (
          <div
            key={p.id}
            className={`store-card-bg overflow-hidden ${i % 2 ? "h-56 w-44 md:h-80 md:w-64" : "h-64 w-52 md:h-96 md:w-72"}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.imageUrl!} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// Cada 5 obras, una ocupa el doble (2x2) para que la grilla tenga ritmo de
// muestra de galería y no de catálogo uniforme.
function spanFor(i: number) {
  return i % 5 === 0 ? "md:col-span-2 md:row-span-2" : "";
}

function Artwork({ slug, product, index }: { slug: string; product: ThemeProduct; index: number }) {
  const big = index % 5 === 0;
  const off = discountPct(product);
  return (
    <Link href={`/${slug}/producto/${product.id}`} className="group flex h-full flex-col">
      <Unveil
        className={`flex-1 ${big ? "aspect-square md:aspect-auto md:min-h-[420px]" : "aspect-[4/5]"}`}
        innerClassName="store-card-bg overflow-hidden"
      >
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-cover transition duration-1000 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center opacity-30">
            <Icon name="bag" className="h-12 w-12" />
          </div>
        )}
      </Unveil>
      <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-baseline gap-3 border-t border-[var(--store-border)] pt-3 text-sm">
        <span className="font-mono text-[11px] text-[var(--store-text-soft)]">
          N.º {String(index + 1).padStart(3, "0")}
        </span>
        <span className="truncate font-medium">
          <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 group-hover:bg-[length:100%_1px]">
            {product.name}
          </span>
        </span>
        <span className="font-mono text-xs">
          {off > 0 && <span className="store-accent-text mr-2">−{off}%</span>}
          {formatBs(product.price)}
        </span>
      </div>
    </Link>
  );
}

export default function GaleriaHome({ slug, store, products, eyebrow, tagline }: ThemeHomeProps) {
  return (
    <div className="store-text">
      <Hero store={store} tagline={tagline} eyebrow={eyebrow} hasProducts={products.length > 0} />
      <ScrollStrip products={products} />

      <section id="obras" className="scroll-mt-20 px-5 pb-28 pt-16 md:px-10">
        <div className="mb-10 flex items-end justify-between gap-4 border-b border-[var(--store-border)] pb-4">
          <FadeUp>
            <h2 className="text-3xl font-semibold uppercase tracking-[-0.04em] md:text-5xl">Colección</h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <span className="font-mono text-xs text-[var(--store-text-soft)]">
              {String(products.length).padStart(2, "0")} {products.length === 1 ? "pieza" : "piezas"}
            </span>
          </FadeUp>
        </div>
        {products.length === 0 ? (
          <p className="py-16 text-center text-sm text-[var(--store-text-soft)]">La muestra abre muy pronto.</p>
        ) : (
          <div className="grid grid-flow-dense grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 md:grid-cols-4">
            {products.map((p, i) => (
              <div key={p.id} className={spanFor(i)}>
                <Artwork slug={slug} product={p} index={i} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-[var(--store-border)] px-5 py-20 md:px-10">
        <FadeUp className="grid gap-8 md:grid-cols-3">
          <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--store-text-soft)]">Sobre la tienda</p>
          <p className="store-headline text-2xl font-light leading-snug md:col-span-2 md:text-3xl">
            {store.name} reúne piezas elegidas una por una. Pide la tuya en línea y coordinamos la
            entrega contigo por WhatsApp.
          </p>
        </FadeUp>
      </section>
    </div>
  );
}
