"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type Variants } from "framer-motion";
import { formatBs } from "@/lib/utils";
import DropCountdown from "@/components/DropCountdown";
import Icon from "@/components/Icon";
import { discountPct, secondImage, type ThemeHomeProps, type ThemeProduct } from "./types";
import CardTags from "./CardTags";

// Estilo "Atelier": casa de lujo. Negro cálido, serif fino en cursiva, mucho
// aire y movimiento lento (nada rebota): la portada entra palabra por
// palabra sobre una foto que se acerca muy despacio, una cinta con el
// nombre de la casa, una pieza destacada con parallax y la colección en
// una grilla numerada. El color de marca del vendedor hace de "dorado".

const EASE = [0.22, 1, 0.36, 1] as const;

const words: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.25 } },
};
const word: Variants = {
  hidden: { opacity: 0, y: "60%", filter: "blur(8px)" },
  show: { opacity: 1, y: "0%", filter: "blur(0px)", transition: { duration: 0.9, ease: EASE } },
};

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 1, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

function Hero({ store, tagline, eyebrow, cover, hasProducts }: {
  store: ThemeHomeProps["store"];
  tagline: string;
  eyebrow: string;
  cover: string | null;
  hasProducts: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden px-6 text-center">
      {cover && (
        <motion.div
          className="absolute inset-0"
          initial={reduce ? false : { scale: 1.18, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 14, ease: "easeOut", opacity: { duration: 2 } }}
          aria-hidden="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt="" className="h-full w-full object-cover opacity-35" />
        </motion.div>
      )}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(14,13,11,0.35)_0%,rgba(14,13,11,0.92)_75%)]" aria-hidden="true" />

      <div className="relative max-w-4xl">
        {store.logoUrl && (
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: EASE }}
            className="mx-auto mb-8 h-24 w-24 overflow-hidden rounded-full border border-[var(--store-accent)] p-1 md:h-28 md:w-28"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={store.logoUrl} alt={store.name} className="h-full w-full rounded-full object-cover" />
          </motion.div>
        )}
        {eyebrow && (
          <motion.p
            initial={reduce ? false : { opacity: 0, letterSpacing: "0.6em" }}
            animate={{ opacity: 1, letterSpacing: "0.35em" }}
            transition={{ duration: 1.6, ease: EASE }}
            className="text-[var(--store-accent)] text-[11px] uppercase"
          >
            {eyebrow}
          </motion.p>
        )}
        <motion.h1
          variants={reduce ? undefined : words}
          initial={reduce ? false : "hidden"}
          animate="show"
          className="store-headline mt-6 text-balance text-5xl font-normal italic leading-[1.02] sm:text-6xl lg:text-8xl"
        >
          {tagline.split(" ").map((w, i) => (
            <span key={i} className="inline-block overflow-hidden pb-2 align-bottom">
              <motion.span variants={word} className="inline-block">
                {w}&nbsp;
              </motion.span>
            </span>
          ))}
        </motion.h1>
        <motion.div
          initial={reduce ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.4, ease: EASE, delay: 1 }}
          className="mx-auto mt-8 h-px w-28 origin-center bg-[var(--store-accent)]"
          aria-hidden="true"
        />
        {store.dropAt && (
          <div className="mt-8 flex justify-center">
            <DropCountdown dropAt={store.dropAt} />
          </div>
        )}
        {hasProducts && (
          <motion.a
            href="#coleccion"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.4 }}
            className="group mt-10 inline-flex items-center gap-3 text-xs uppercase tracking-[0.3em]"
          >
            <span className="relative">
              Descubrir la colección
              <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-50 bg-current transition-transform duration-500 group-hover:scale-x-100" />
            </span>
          </motion.a>
        )}
      </div>

      <motion.div
        className="absolute bottom-8 left-1/2 h-12 w-px -translate-x-1/2 overflow-hidden bg-white/10"
        aria-hidden="true"
      >
        <motion.span
          className="block h-1/2 w-full bg-[var(--store-accent)]"
          animate={reduce ? undefined : { y: ["-100%", "200%"] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </section>
  );
}

function NameBand({ name }: { name: string }) {
  const reduce = useReducedMotion();
  const items = Array.from({ length: 8 }, () => name);
  return (
    <div className="store-border overflow-hidden border-y py-5" aria-hidden="true">
      <motion.div
        className="flex w-max gap-10 whitespace-nowrap"
        animate={reduce ? undefined : { x: ["0%", "-50%"] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        {[...items, ...items].map((n, i) => (
          <span key={i} className="store-headline flex items-center gap-10 text-2xl italic text-[var(--store-text-soft)] md:text-3xl">
            {n}
            <span className="inline-block h-1.5 w-1.5 rotate-45 bg-[var(--store-accent)]" />
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function Featured({ slug, product }: { slug: string; product: ThemeProduct }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-8%", "8%"]);
  return (
    <section ref={ref} className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-24 md:grid-cols-2 md:gap-16 md:py-32">
      <Reveal>
        <div className="store-card-bg relative aspect-[4/5] overflow-hidden">
          {product.imageUrl ? (
            <motion.img style={{ y, scale: 1.15 }} src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center opacity-30">
              <Icon name="bag" className="h-16 w-16" />
            </div>
          )}
        </div>
      </Reveal>
      <Reveal delay={0.15}>
        <p className="text-[var(--store-accent)] text-[11px] uppercase tracking-[0.35em]">Pieza destacada</p>
        <h2 className="store-headline mt-5 text-4xl italic leading-tight md:text-6xl">{product.name}</h2>
        <p className="mt-6 font-mono text-lg tracking-wider">{formatBs(product.price)}</p>
        <Link
          href={`/${slug}/producto/${product.id}`}
          className="mt-10 inline-flex items-center gap-3 border border-[var(--store-accent)] px-8 py-4 text-xs uppercase tracking-[0.3em] transition-colors duration-500 hover:bg-[var(--store-accent)] hover:text-[var(--store-accent-ink)]"
        >
          Ver la pieza
        </Link>
      </Reveal>
    </section>
  );
}

function PieceCard({ slug, product, index }: { slug: string; product: ThemeProduct; index: number }) {
  const alt = secondImage(product);
  const off = discountPct(product);
  return (
    <Link href={`/${slug}/producto/${product.id}`} className="group block">
      <div className="store-card-bg relative aspect-[3/4] overflow-hidden">
        {product.imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrl}
              alt={product.name}
              className={`absolute inset-0 h-full w-full object-cover transition duration-[1400ms] ease-out group-hover:scale-105 ${alt ? "group-hover:opacity-0" : ""}`}
            />
            {alt && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={alt}
                alt=""
                className="absolute inset-0 h-full w-full scale-105 object-cover opacity-0 transition duration-[1400ms] ease-out group-hover:scale-100 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center opacity-30">
            <Icon name="bag" className="h-12 w-12" />
          </div>
        )}
        {(off > 0 || product.isNew) && (
          <span className="absolute left-4 top-4 text-[10px] uppercase tracking-[0.3em]">
            {off > 0 ? `−${off}%` : "Nuevo"}
          </span>
        )}
        <span className="absolute inset-x-0 bottom-0 translate-y-full bg-[var(--store-bg)]/85 py-3 text-center text-[10px] uppercase tracking-[0.3em] backdrop-blur transition-transform duration-500 group-hover:translate-y-0">
          Ver detalle
        </span>
      </div>
      <div className="mt-5 flex items-baseline gap-4">
        <span className="text-[var(--store-accent)] font-mono text-[11px]">{String(index + 1).padStart(2, "0")}</span>
        <span className="store-headline flex-1 truncate text-xl italic">{product.name}</span>
        <span className="font-mono text-xs tracking-wider text-[var(--store-text-soft)]">
          {formatBs(product.price)}
        </span>
      </div>
      <CardTags tags={product.tags} className="mt-1.5 pl-9 text-[10px] uppercase tracking-[0.25em] text-[var(--store-text-soft)]" />
    </Link>
  );
}

export default function AtelierHome({ slug, store, products, eyebrow, tagline }: ThemeHomeProps) {
  const cover = products.find((p) => p.imageUrl)?.imageUrl ?? store.logoUrl;
  const [featured, ...rest] = products;
  const collection = products.length > 3 ? rest : products;

  return (
    <div className="store-text">
      <Hero store={store} tagline={tagline} eyebrow={eyebrow} cover={cover} hasProducts={products.length > 0} />
      <NameBand name={store.name} />

      {featured && products.length > 3 && <Featured slug={slug} product={featured} />}

      <section id="coleccion" className="mx-auto max-w-6xl scroll-mt-20 px-6 pb-28 pt-20">
        <Reveal className="mb-14 text-center">
          <p className="text-[var(--store-accent)] text-[11px] uppercase tracking-[0.35em]">La colección</p>
          <h2 className="store-headline mt-4 text-4xl italic md:text-5xl">
            {products.length} {products.length === 1 ? "pieza" : "piezas"}
          </h2>
        </Reveal>
        {products.length === 0 ? (
          <p className="text-center text-sm text-[var(--store-text-soft)]">
            La colección se presenta muy pronto.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-14 md:grid-cols-3 md:gap-x-10">
            {collection.map((p, i) => (
              <Reveal key={p.id} delay={(i % 3) * 0.12}>
                <PieceCard slug={slug} product={p} index={i} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <section className="store-border border-t px-6 py-24 text-center">
        <Reveal>
          <p className="store-headline mx-auto max-w-2xl text-3xl italic leading-snug md:text-4xl">
            “Cada pieza, elegida con cuidado para quien sabe lo que busca.”
          </p>
          <p className="text-[var(--store-accent)] mt-6 text-[11px] uppercase tracking-[0.35em]">{store.name}</p>
        </Reveal>
      </section>
    </div>
  );
}
