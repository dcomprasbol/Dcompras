"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { MotionLinkButton, MotionAnchorButton } from "@/components/MotionCta";
import HeroShowcase from "./HeroShowcase";

// Reveal escalonado real (staggerChildren) en vez de RevealOnScroll con
// delays a mano por elemento — el contenedor orquesta el orden, no cada hijo
// por separado.
const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 18 } },
};

export default function Hero() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-ink px-5 pb-20 pt-16 text-white md:pt-20">
      {/* Contenido a 55/45 en desktop: texto primero en el DOM (así en
          mobile aparece antes que la tienda de ejemplo, como pide el
          diseño), la tienda ocupa la columna derecha desde lg. */}
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.9fr_1fr] lg:gap-10">
        <motion.div
          initial={shouldReduceMotion ? false : "hidden"}
          animate="visible"
          variants={shouldReduceMotion ? undefined : container}
        >
          <motion.span
            variants={item}
            className="tag-editorial inline-block border border-white/25 text-white/70"
          >
            Hecho para vender por TikTok, IG y WhatsApp
          </motion.span>

          <h1 className="mt-6 text-balance font-impact text-[15vw] uppercase leading-[0.92] tracking-tight sm:text-6xl md:text-7xl">
            <motion.span variants={item} className="block overflow-hidden">
              De compras,
            </motion.span>
            <motion.span variants={item} className="store-accent-text block overflow-hidden">
              sin horario.
            </motion.span>
          </h1>

          <motion.p variants={item} className="mt-8 max-w-lg text-balance text-base text-white/60 md:text-lg">
            Publicitas en redes, pero cobras a mano y coordinas todo por WhatsApp. Dcompras te da
            catálogo, checkout y cobro por QR en un link — para que vendas mientras duermes, no
            solo cuando estás en vivo.
          </motion.p>

          <motion.div variants={item} className="mt-10 flex flex-col gap-3 sm:flex-row">
            <MotionLinkButton href="/crear-tienda" className="btn-editorial bg-white text-ink border-white">
              Crear mi tienda gratis →
            </MotionLinkButton>
            <MotionAnchorButton
              href="#como-funciona"
              className="btn-editorial btn-editorial-ghost border-white/40 text-white hover:border-white"
            >
              Ver cómo funciona
            </MotionAnchorButton>
          </motion.div>

          <motion.p variants={item} className="mt-5 text-xs uppercase tracking-wider text-white/35">
            Gratis para publicar · comisión solo cuando vendes
          </motion.p>
        </motion.div>

        <HeroShowcase />
      </div>

      <div
        className="pointer-events-none absolute bottom-8 right-5 hidden h-11 w-11 animate-float items-center justify-center rounded-full border border-white/20 text-sm text-white/50 lg:flex"
        aria-hidden="true"
      >
        ↓
      </div>
    </section>
  );
}
