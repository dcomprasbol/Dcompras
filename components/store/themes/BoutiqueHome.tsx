"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { formatBs } from "@/lib/utils";
import DropCountdown from "@/components/DropCountdown";
import Icon from "@/components/Icon";
import { discountPct, secondImage, type ThemeHomeProps, type ThemeProduct } from "./types";

// Estilo "Boutique": tienda de moda cálida y femenina. Portada a pantalla
// completa con las fotos del catálogo fundiéndose y acercándose despacio,
// texto que aparece desenfocado y se aclara, un carrusel "Lo nuevo" que se
// arrastra con el dedo, la colección en tarjetas suaves con segunda foto al
// pasar el mouse y un bloque de marca con parallax. Todo lento y suave.

const SOFT = [0.25, 0.1, 0.25, 1] as const;

function Fade({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, ease: SOFT, delay }}
    >
      {children}
    </motion.div>
  );
}

function Slideshow({ images }: { images: { url: string; alt: string }[] }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (images.length <= 1 || reduce) return;
    const id = setInterval(() => setActive((a) => (a + 1) % images.length), 5000);
    return () => clearInterval(id);
  }, [images.length, reduce]);
  return (
    <>
      <AnimatePresence initial={false}>
        <motion.div
          key={active}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
        >
          {/* Ken Burns: cada foto se acerca muy despacio mientras está a la vista. */}
          <motion.img
            src={images[active].url}
            alt={images[active].alt}
            className="h-full w-full object-cover"
            initial={reduce ? false : { scale: 1.12 }}
            animate={{ scale: 1 }}
            transition={{ duration: 6.5, ease: "linear" }}
          />
        </motion.div>
      </AnimatePresence>
      {images.length > 1 && (
        <div className="absolute bottom-6 right-6 z-10 flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ver foto ${i + 1}`}
              onClick={() => setActive(i)}
              className="h-1 w-8 overflow-hidden rounded-full bg-white/35"
            >
              {i === active && (
                <motion.span
                  key={active}
                  className="block h-full origin-left bg-white"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: reduce ? 0 : 5, ease: "linear" }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function Hero({ store, tagline, eyebrow, products }: {
  store: ThemeHomeProps["store"];
  tagline: string;
  eyebrow: string;
  products: ThemeProduct[];
}) {
  const reduce = useReducedMotion();
  const slides = products.filter((p) => p.imageUrl).slice(0, 6).map((p) => ({ url: p.imageUrl!, alt: p.name }));
  const hasImage = slides.length > 0 || Boolean(store.logoUrl);
  return (
    <section className="relative flex min-h-[78vh] items-end overflow-hidden md:min-h-[88vh]">
      {slides.length > 0 ? (
        <Slideshow images={slides} />
      ) : store.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={store.logoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="store-card-bg absolute inset-0" />
      )}
      {hasImage && <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />}

      <div className={`relative w-full px-5 pb-16 pt-28 text-center md:px-8 md:pb-24 ${hasImage ? "text-white" : "store-text"}`}>
        {store.logoUrl && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: SOFT }}
            className="mb-5 inline-flex rounded-2xl bg-white p-2.5 shadow-lg"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={store.logoUrl} alt={store.name} className="h-20 w-20 rounded-xl object-cover md:h-24 md:w-24" />
          </motion.div>
        )}
        {eyebrow && (
          <motion.span
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className={`block text-xs uppercase tracking-[0.25em] ${hasImage ? "text-white/75" : "store-text-soft"}`}
          >
            {eyebrow}
          </motion.span>
        )}
        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.2, ease: SOFT, delay: 0.3 }}
          className="font-display mx-auto mt-4 max-w-3xl text-balance text-4xl leading-[1.05] sm:text-5xl lg:text-7xl"
        >
          {tagline}
        </motion.h1>
        {store.dropAt && (
          <div className="mt-7 flex justify-center">
            <DropCountdown dropAt={store.dropAt} />
          </div>
        )}
        {products.length > 0 && (
          <motion.a
            href="#coleccion"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            whileHover={reduce ? undefined : { scale: 1.04 }}
            className={`mt-9 inline-flex rounded-full px-8 py-3.5 text-sm font-medium shadow-lg ${hasImage ? "bg-white text-ink" : "store-accent-bg"}`}
          >
            Ver colección
          </motion.a>
        )}
      </div>
    </section>
  );
}

// "Lo nuevo": fila que se arrastra con el dedo o el mouse (drag con
// límites), como el carrusel de una app de moda.
function NewArrivals({ slug, products }: { slug: string; products: ThemeProduct[] }) {
  const track = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [limit, setLimit] = useState(0);
  // Si el usuario arrastró, el clic que viene al soltar no debe abrir el producto.
  const dragged = useRef(false);
  useEffect(() => {
    const measure = () => {
      if (track.current && wrap.current) setLimit(Math.max(0, track.current.scrollWidth - wrap.current.offsetWidth));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [products.length]);

  return (
    <section className="py-16 md:py-20">
      <Fade className="mx-auto mb-8 flex max-w-7xl items-end justify-between px-5 md:px-8">
        <h2 className="font-display store-text text-3xl md:text-4xl">Lo nuevo</h2>
        <span className="store-text-soft text-xs">Desliza para ver más →</span>
      </Fade>
      <div ref={wrap} className="overflow-hidden px-5 md:px-8">
        <motion.div
          ref={track}
          drag="x"
          dragConstraints={{ left: -limit, right: 0 }}
          dragElastic={0.08}
          onDragStart={() => (dragged.current = true)}
          onDragEnd={() => setTimeout(() => (dragged.current = false), 0)}
          className="flex w-max cursor-grab gap-4 active:cursor-grabbing"
        >
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/${slug}/producto/${p.id}`}
              draggable={false}
              onClick={(e) => dragged.current && e.preventDefault()}
              className="group block w-56 shrink-0 md:w-64"
            >
              <div className="store-card-bg aspect-[4/5] overflow-hidden rounded-[var(--store-radius-lg)]">
                {p.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt={p.name} draggable={false} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                )}
              </div>
              <p className="store-text mt-3 truncate text-sm">{p.name}</p>
              <p className="store-accent-text text-sm font-medium">{formatBs(p.price)}</p>
            </Link>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Card({ slug, product }: { slug: string; product: ThemeProduct }) {
  const reduce = useReducedMotion();
  const alt = secondImage(product);
  const off = discountPct(product);
  return (
    <motion.div whileHover={reduce ? undefined : { y: -6 }} transition={{ type: "spring", stiffness: 260, damping: 24 }}>
      <Link href={`/${slug}/producto/${product.id}`} className="group block">
        <div className="store-card-bg relative aspect-[4/5] overflow-hidden rounded-[var(--store-radius-lg)] shadow-sm transition-shadow duration-500 group-hover:shadow-xl">
          {product.imageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.imageUrl} alt={product.name} className={`absolute inset-0 h-full w-full object-cover transition duration-700 ${alt ? "group-hover:opacity-0" : "group-hover:scale-105"}`} />
              {alt && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={alt} alt="" className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-700 group-hover:opacity-100" />
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center opacity-30">
              <Icon name="bag" className="h-10 w-10" />
            </div>
          )}
          {(off > 0 || product.isNew) && (
            <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-ink backdrop-blur">
              {off > 0 ? `-${off}%` : "Nuevo"}
            </span>
          )}
          <span className="absolute inset-x-3 bottom-3 translate-y-3 rounded-full bg-white/90 py-2 text-center text-xs font-medium text-ink opacity-0 backdrop-blur transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            Ver detalle
          </span>
        </div>
        <div className="mt-3 flex items-baseline justify-between gap-3">
          <p className="store-text truncate text-sm">{product.name}</p>
          <p className="store-text shrink-0 text-sm font-medium">{formatBs(product.price)}</p>
        </div>
      </Link>
    </motion.div>
  );
}

function BrandBlock({ store, image }: { store: ThemeHomeProps["store"]; image: string | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-10%", "10%"]);
  if (!image) return null;
  return (
    <section ref={ref} className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-20 md:grid-cols-2 md:px-8">
      <div className="store-card-bg aspect-[4/5] overflow-hidden rounded-[var(--store-radius-lg)] md:aspect-square">
        <motion.img style={{ y, scale: 1.2 }} src={image} alt="" className="h-full w-full object-cover" />
      </div>
      <Fade>
        <p className="store-text-soft text-xs uppercase tracking-[0.25em]">Hecho para ti</p>
        <h2 className="font-display store-text mt-4 text-4xl leading-tight md:text-5xl">
          Cada pieza de {store.name}, elegida con cariño.
        </h2>
        <p className="store-text-soft mt-5 max-w-md text-sm leading-relaxed">
          Haz tu pedido en línea, paga con QR o contra entrega y coordinamos la entrega contigo por
          WhatsApp.
        </p>
        <a href="#coleccion" className="store-accent-bg mt-8 inline-flex rounded-full px-7 py-3 text-sm font-medium">
          Ver colección
        </a>
      </Fade>
    </section>
  );
}

export default function BoutiqueHome({ slug, store, products, eyebrow, tagline }: ThemeHomeProps) {
  const newest = products.slice(0, 8);
  const brandImage = products.filter((p) => p.imageUrl)[1]?.imageUrl ?? products.find((p) => p.imageUrl)?.imageUrl ?? null;
  return (
    <div>
      <Hero store={store} tagline={tagline} eyebrow={eyebrow} products={products} />

      {products.length >= 4 && <NewArrivals slug={slug} products={newest} />}

      <section id="coleccion" className="mx-auto max-w-7xl scroll-mt-20 px-5 pb-16 pt-14 md:px-8">
        <Fade className="mb-8 flex items-end justify-between">
          <h2 className="font-display store-text text-3xl md:text-4xl">Catálogo</h2>
          {products.length > 0 && (
            <p className="store-text-soft text-xs">
              {products.length} producto{products.length === 1 ? "" : "s"}
            </p>
          )}
        </Fade>
        {products.length === 0 ? (
          <p className="store-border store-text-soft rounded-[var(--store-radius-lg)] border border-dashed p-8 text-center text-sm">
            Esta tienda todavía no publicó productos.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p, i) => (
              <Fade key={p.id} delay={(i % 4) * 0.08}>
                <Card slug={slug} product={p} />
              </Fade>
            ))}
          </div>
        )}
      </section>

      {products.length >= 2 && <BrandBlock store={store} image={brandImage} />}
    </div>
  );
}
