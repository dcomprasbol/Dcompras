"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { formatBs } from "@/lib/utils";
import DropCountdown from "@/components/DropCountdown";
import Icon, { type IconName } from "@/components/Icon";
import { discountPct, type ThemeHomeProps, type ThemeProduct } from "./types";

// Estilo "Pop": tienda alegre y con energía. Crema de fondo, el color de
// marca a pantalla completa, letra redonda gigante que entra rebotando,
// productos como stickers que flotan, bordes gruesos con sombra dura y
// todo responde al mouse con resortes (sin exagerar en el celular).

const SPRING = { type: "spring", stiffness: 380, damping: 18 } as const;

const pop: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};
const letterPop: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.6, rotate: -8 },
  show: { opacity: 1, y: 0, scale: 1, rotate: 0, transition: SPRING },
};

function Bounce({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 40, scale: 0.92 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ ...SPRING, delay }}
    >
      {children}
    </motion.div>
  );
}

function Sticker({ product, className, rotate, delay }: { product: ThemeProduct; className: string; rotate: number; delay: number }) {
  const reduce = useReducedMotion();
  if (!product.imageUrl) return null;
  return (
    <motion.div
      className={`absolute hidden overflow-hidden rounded-[var(--store-radius-lg)] border-[3px] border-[var(--store-text)] bg-white pop-shadow-lg md:block ${className}`}
      initial={reduce ? false : { opacity: 0, scale: 0.4, rotate: rotate * 3 }}
      animate={reduce ? { rotate } : { opacity: 1, scale: 1, rotate: [rotate, rotate + 4, rotate], y: [0, -12, 0] }}
      transition={
        reduce
          ? undefined
          : {
              opacity: { duration: 0.3, delay },
              scale: { ...SPRING, delay },
              rotate: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: delay + 0.6 },
              y: { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: delay + 0.6 },
            }
      }
      aria-hidden="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
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
  const withImage = products.filter((p) => p.imageUrl);
  return (
    <section className="relative overflow-hidden px-5 pb-24 pt-16 md:pb-32 md:pt-24">
      {/* Manchas de color de marca que giran despacio de fondo. */}
      <motion.div
        className="absolute -left-24 -top-24 h-80 w-80 rounded-[42%_58%_63%_37%/45%_42%_58%_55%] bg-[var(--store-accent)] opacity-25"
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        aria-hidden="true"
      />
      <motion.div
        className="absolute -bottom-32 -right-20 h-96 w-96 rounded-[58%_42%_37%_63%/55%_58%_42%_45%] bg-[var(--store-accent)] opacity-20"
        animate={reduce ? undefined : { rotate: -360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        aria-hidden="true"
      />

      {withImage[0] && <Sticker product={withImage[0]} className="left-[4%] top-20 h-40 w-32 lg:h-48 lg:w-40" rotate={-8} delay={0.5} />}
      {withImage[1] && <Sticker product={withImage[1]} className="right-[5%] top-14 h-36 w-36 lg:h-44 lg:w-44" rotate={7} delay={0.7} />}
      {withImage[2] && <Sticker product={withImage[2]} className="bottom-10 right-[16%] h-32 w-28 lg:h-40 lg:w-32" rotate={-5} delay={0.9} />}

      <div className="relative mx-auto max-w-3xl text-center">
        {store.logoUrl && (
          <motion.div
            initial={reduce ? false : { scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: -6 }}
            transition={SPRING}
            className="mx-auto mb-6 h-20 w-20 overflow-hidden rounded-[var(--store-radius-lg)] border-[3px] border-[var(--store-text)] bg-white pop-shadow"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={store.logoUrl} alt={store.name} className="h-full w-full object-cover" />
          </motion.div>
        )}
        {eyebrow && (
          <motion.span
            initial={reduce ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block rounded-full border-2 border-[var(--store-text)] bg-white px-4 py-1 text-xs font-bold uppercase tracking-wider pop-shadow"
          >
            {eyebrow}
          </motion.span>
        )}
        <motion.h1
          variants={reduce ? undefined : pop}
          initial={reduce ? false : "hidden"}
          animate="show"
          className="store-headline mt-7 text-balance text-5xl font-bold leading-[0.95] sm:text-6xl lg:text-8xl"
        >
          {tagline.split(" ").map((w, i, all) => (
            <motion.span
              key={i}
              variants={letterPop}
              className={`inline-block ${i === all.length - 1 ? "store-accent-text" : ""}`}
              whileHover={reduce ? undefined : { rotate: i % 2 ? 6 : -6, scale: 1.08 }}
            >
              {w}&nbsp;
            </motion.span>
          ))}
        </motion.h1>
        {store.dropAt && (
          <div className="mt-7 flex justify-center">
            <DropCountdown dropAt={store.dropAt} />
          </div>
        )}
        {products.length > 0 && (
          <motion.a
            href="#menu"
            initial={reduce ? false : { opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...SPRING, delay: 0.6 }}
            whileHover={reduce ? undefined : { y: -3, rotate: -2 }}
            whileTap={reduce ? undefined : { scale: 0.95 }}
            className="store-accent-bg mt-10 inline-flex items-center gap-2 rounded-full border-[3px] border-[var(--store-text)] px-8 py-4 text-lg font-bold pop-shadow"
          >
            ¡Quiero ver todo!
          </motion.a>
        )}
      </div>
    </section>
  );
}

function Ribbon() {
  const reduce = useReducedMotion();
  const items = ["Pedidos en un clic", "Paga con QR", "O contra entrega", "Hecho con cariño", "Te lo llevamos"];
  const row = [...items, ...items, ...items];
  return (
    <div className="relative z-10 -my-2 -rotate-2 border-y-[3px] border-[var(--store-text)] bg-[var(--store-accent)] py-3 text-[var(--store-accent-ink)]" aria-hidden="true">
      <motion.div
        className="flex w-max gap-8 whitespace-nowrap"
        animate={reduce ? undefined : { x: ["0%", "-33.333%"] }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      >
        {row.map((t, i) => (
          <span key={i} className="store-headline flex items-center gap-8 text-xl font-bold uppercase">
            {t}
            <span className="inline-block h-3 w-3 rotate-45 bg-current" />
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function PopCard({ slug, product, index }: { slug: string; product: ThemeProduct; index: number }) {
  const reduce = useReducedMotion();
  const off = discountPct(product);
  const tilt = index % 2 === 0 ? -1.5 : 1.5;
  return (
    <motion.div
      whileHover={reduce ? undefined : { y: -6, rotate: tilt }}
      whileTap={reduce ? undefined : { scale: 0.97 }}
      transition={SPRING}
    >
      <Link
        href={`/${slug}/producto/${product.id}`}
        className="group block overflow-hidden rounded-[var(--store-radius-lg)] border-[3px] border-[var(--store-text)] bg-white pop-shadow transition-shadow hover:pop-shadow-lg"
      >
        <div className="relative aspect-square overflow-hidden border-b-[3px] border-[var(--store-text)] bg-[var(--store-card-bg)]">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
          ) : (
            <div className="flex h-full items-center justify-center opacity-30">
              <Icon name="bag" className="h-12 w-12" />
            </div>
          )}
          {(off > 0 || product.isNew) && (
            <span className="absolute right-2 top-2 rotate-6 rounded-full border-2 border-[var(--store-text)] bg-[var(--store-accent)] px-2.5 py-1 text-xs font-bold text-[var(--store-accent-ink)]">
              {off > 0 ? `-${off}%` : "¡Nuevo!"}
            </span>
          )}
        </div>
        <div className="flex flex-col items-start gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="store-headline line-clamp-2 text-base font-semibold leading-tight">{product.name}</span>
          <span className="shrink-0 rounded-full bg-[var(--store-text)] px-2.5 py-1 text-xs font-bold text-white">
            {formatBs(product.price)}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

const STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: "bag", title: "Elige", text: "Mira todo y agrega lo que te antoje al carrito." },
  { icon: "qr", title: "Paga", text: "Con QR en segundos o contra entrega, como prefieras." },
  { icon: "home", title: "Recibe", text: "Coordinamos la entrega por WhatsApp y listo." },
];

export default function PopHome({ slug, store, products, eyebrow, tagline }: ThemeHomeProps) {
  const reduce = useReducedMotion();
  return (
    <div className="store-text">
      <Hero store={store} tagline={tagline} eyebrow={eyebrow} products={products} />
      <Ribbon />

      <section id="menu" className="mx-auto max-w-6xl scroll-mt-20 px-5 pb-20 pt-20">
        <Bounce className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <h2 className="store-headline text-4xl font-bold md:text-6xl">
            Lo <span className="store-accent-text">mejor</span> de la casa
          </h2>
          {products.length > 0 && (
            <span className="rounded-full border-2 border-[var(--store-text)] bg-white px-4 py-1.5 text-sm font-bold pop-shadow">
              {products.length} producto{products.length === 1 ? "" : "s"}
            </span>
          )}
        </Bounce>
        {products.length === 0 ? (
          <p className="rounded-[var(--store-radius-lg)] border-[3px] border-dashed border-[var(--store-text)] p-10 text-center font-semibold">
            ¡Muy pronto tendremos productos aquí!
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p, i) => (
              <Bounce key={p.id} delay={(i % 4) * 0.06}>
                <PopCard slug={slug} product={p} index={i} />
              </Bounce>
            ))}
          </div>
        )}
      </section>

      <section className="bg-[var(--store-text)] px-5 py-20 text-[var(--store-bg)]">
        <div className="mx-auto max-w-5xl">
          <Bounce>
            <h2 className="store-headline text-center text-4xl font-bold md:text-5xl">¿Cómo pido?</h2>
          </Bounce>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Bounce key={s.title} delay={i * 0.12}>
                <div className="h-full rounded-[var(--store-radius-lg)] border-[3px] border-[var(--store-bg)] p-6 text-center">
                  <motion.span
                    className="store-accent-bg mx-auto flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-[var(--store-bg)]"
                    animate={reduce ? undefined : { y: [0, -8, 0] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
                  >
                    <Icon name={s.icon} mono className="h-7 w-7" />
                  </motion.span>
                  <p className="store-headline mt-4 text-3xl font-bold">
                    <span className="mr-2 opacity-40">{i + 1}.</span>
                    {s.title}
                  </p>
                  <p className="mt-2 text-sm opacity-70">{s.text}</p>
                </div>
              </Bounce>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
