"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";

// El lado derecho del Hero: una tienda Dcompras representada con
// componentes reales (no una captura, no un ícono de bolsa) + tarjetas de
// notificación flotando alrededor. Todo el contenido acá es decorativo/
// ilustrativo — nunca se conecta a datos reales, así que usa esquinas con
// radio chico (a diferencia del resto del sitio, que es todo esquina recta)
// a propósito: es la única zona de la página que representa "interfaz de
// producto" en vez de "identidad de marca", y una interfaz real sí tiene
// bordes redondeados sutiles.
const showcaseVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 18, delay: 0.35 },
  },
};

const floatCardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: (delay: number) => ({
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 200, damping: 16, delay },
  }),
};

export default function HeroShowcase() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative mx-auto w-full max-w-[340px] py-6 lg:max-w-none lg:py-0">
      {/* Halo verde muy sutil + grilla tenue — profundidad sin ruido. */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-jade-500/20 blur-[100px]"
        aria-hidden="true"
      />
      <div
        className="bg-grid pointer-events-none absolute inset-0 -z-10 opacity-[0.08]"
        aria-hidden="true"
      />

      {/* Tienda: la pieza principal. */}
      <motion.div
        initial={shouldReduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true }}
        variants={shouldReduceMotion ? undefined : showcaseVariants}
        style={{ rotate: -3 }}
        className={`relative mx-auto w-full max-w-[280px] overflow-hidden rounded-2xl border border-white/10 bg-white text-ink shadow-2xl shadow-black/50 ${shouldReduceMotion ? "" : "animate-float"}`}
      >
        <div className="flex items-center gap-2 border-b border-ink/5 px-4 py-3">
          <span className="h-2 w-2 rounded-full bg-jade-500" aria-hidden="true" />
          <span className="font-display text-sm font-bold">Luna Studio</span>
          <span className="ml-auto text-xs text-ink/30">🛒</span>
        </div>
        <div className="aspect-[4/3] w-full overflow-hidden bg-jade-500">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/landing/moda.jpg"
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs font-medium text-ink/50">Chompa oversize</p>
            <p className="font-mono text-sm font-bold text-jade-600">Bs 189,00</p>
          </div>
          <span className="rounded-lg bg-jade-500 px-3 py-1.5 text-[11px] font-semibold text-white">
            Agregar
          </span>
        </div>
      </motion.div>

      {/* Notificaciones flotantes — decorativas, ilustran lo que pasa
          adentro de una tienda Dcompras, no datos reales. Las dos últimas
          se ocultan en mobile para no generar overflow ni saturar. */}
      <motion.div
        custom={0.6}
        initial={shouldReduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true }}
        variants={shouldReduceMotion ? undefined : floatCardVariants}
        style={{ rotate: -4 }}
        className={`absolute -left-2 top-2 rounded-xl border border-ink/5 bg-white px-3.5 py-2.5 text-ink shadow-xl shadow-black/30 sm:-left-8 sm:top-6 ${shouldReduceMotion ? "" : "animate-float"}`}
      >
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-jade-600">
          <span className="h-1.5 w-1.5 rounded-full bg-jade-500" /> NUEVA VENTA
        </p>
        <p className="font-mono text-sm font-bold">Bs 149,00</p>
      </motion.div>

      <motion.div
        custom={0.9}
        initial={shouldReduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true }}
        variants={shouldReduceMotion ? undefined : floatCardVariants}
        style={{ rotate: 3, animationDelay: "1.6s" }}
        className={`absolute -right-3 bottom-10 hidden rounded-xl border border-ink/5 bg-white px-3.5 py-2.5 text-ink shadow-xl shadow-black/30 sm:-right-10 sm:block ${shouldReduceMotion ? "" : "animate-float"}`}
      >
        <p className="text-[11px] font-semibold text-ink/40">PAGO CONFIRMADO</p>
        <p className="flex items-center gap-1 font-mono text-sm font-bold text-jade-600">
          ✓ QR
        </p>
      </motion.div>

      <motion.div
        custom={1.1}
        initial={shouldReduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true }}
        variants={shouldReduceMotion ? undefined : floatCardVariants}
        style={{ rotate: -2, animationDelay: "0.8s" }}
        className={`absolute -bottom-4 left-6 hidden rounded-xl border border-ink/5 bg-white px-3.5 py-2.5 text-ink shadow-xl shadow-black/30 md:block ${shouldReduceMotion ? "" : "animate-float"}`}
      >
        <p className="text-[11px] font-semibold text-ink/40">NUEVO PEDIDO</p>
        <p className="font-mono text-sm font-bold">#DC-1042</p>
      </motion.div>
    </div>
  );
}
