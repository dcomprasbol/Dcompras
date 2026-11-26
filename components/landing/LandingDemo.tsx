"use client";

// "Míralo en acción" (landing): el anuncio para vendedores (CommercialVideo,
// unos 20 s). El recorrido completo del panel queda solo dentro del panel
// del vendedor (tutorial), para no cargar la landing de información.

import { motion, useReducedMotion } from "framer-motion";
import { MotionLinkButton } from "@/components/MotionCta";
import CommercialVideo from "@/components/landing/CommercialVideo";

export default function LandingDemo() {
  const reduce = useReducedMotion();

  return (
    <section id="demo" className="relative overflow-hidden bg-ink px-5 py-20 text-white md:py-24">
      {/* Fondo con dos brillos que se mueven despacio */}
      {!reduce && (
        <>
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-jade-500/25 blur-3xl"
            animate={{ x: [0, 120, 0], y: [0, 40, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-coral-500/15 blur-3xl"
            animate={{ x: [0, -100, 0], y: [0, -30, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          className="min-w-0"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-jade-400">Míralo en acción</p>
          <h2 className="mt-3 font-impact text-4xl uppercase leading-[0.92] tracking-tight md:text-6xl">
            Menos chat,
            <br />
            <span className="text-jade-400">más ventas</span>
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/65 md:text-base">
            Tu cliente ve tu catálogo, paga con QR desde cualquier banco y a ti te llega el aviso de pedido pagado. Tú
            preparas el pedido y lo entregas.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <MotionLinkButton href="/crear-tienda" className="btn-editorial inline-flex border-white bg-white text-ink">
              Crear mi tienda gratis →
            </MotionLinkButton>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="min-w-0"
        >
          <CommercialVideo
            src="/video/anuncio-vendedor.mp4"
            poster="/video/anuncio-vendedor.jpg"
            label="Anuncio de Dcompras para vendedores: tu tienda en un link y cobros con QR"
          />
        </motion.div>
      </div>

    </section>
  );
}
