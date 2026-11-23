"use client";

// "Míralo en acción" (landing): el comercial vertical de 30 s con personas
// reales (CommercialVideo) y, para quien quiera el detalle, el recorrido
// animado del panel con la voz de Sofía (el mismo tutorial del vendedor,
// components/admin/PaymentsGuide.tsx → VideoPlayer), que se abre aparte.

import { useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MotionLinkButton } from "@/components/MotionCta";
import CommercialVideo from "@/components/landing/CommercialVideo";

// El recorrido se descarga recién cuando lo abren (muchos visitantes entran
// con datos móviles).
const VideoPlayer = dynamic(() => import("@/components/admin/PaymentsGuide").then((m) => m.VideoPlayer), {
  ssr: false,
  loading: () => <div className="h-[520px] w-full animate-pulse rounded-2xl bg-white/10" />,
});

export default function LandingDemo({ commissionPercent }: { commissionPercent: number }) {
  const reduce = useReducedMotion();
  const [showTour, setShowTour] = useState(false);

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

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
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
            <button
              type="button"
              onClick={() => setShowTour((v) => !v)}
              aria-expanded={showTour}
              className="inline-flex items-center gap-2 border border-white/25 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-white transition hover:border-white/60"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M6 4l10 6-10 6V4z" />
              </svg>
              {showTour ? "Cerrar el recorrido" : "Ver el recorrido del panel (3 min)"}
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="min-w-0"
        >
          <CommercialVideo />
        </motion.div>
      </div>

      <AnimatePresence>
        {showTour && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative mx-auto mt-12 max-w-3xl overflow-hidden text-ink"
          >
            <p className="mb-3 text-center text-xs text-white/50">Toca «Activar voz» para escuchar la explicación.</p>
            <VideoPlayer commissionPercent={commissionPercent} payer="comprador" includeIntro autoNextChapter />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
