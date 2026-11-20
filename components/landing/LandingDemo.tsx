"use client";

// Demo en video de la landing: el mismo tutorial animado que ve el vendedor
// en su panel (components/admin/PaymentsGuide.tsx → VideoPlayer), con la
// locución grabada de Sofía. Arranca solo y en silencio cuando la sección
// entra en pantalla (los navegadores no dejan reproducir audio sin un toque);
// "Activar voz" prende la narración.

import { motion, useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";

// El reproductor se descarga aparte, sin frenar la carga de la portada (muchos
// visitantes entran con datos móviles).
const VideoPlayer = dynamic(() => import("@/components/admin/PaymentsGuide").then((m) => m.VideoPlayer), {
  ssr: false,
  loading: () => <div className="h-[520px] w-full animate-pulse rounded-2xl bg-white/10" />,
});
import { MotionLinkButton } from "@/components/MotionCta";

export default function LandingDemo({ commissionPercent }: { commissionPercent: number }) {
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

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          className="min-w-0"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-jade-400">Míralo en acción</p>
          <h2 className="mt-3 font-impact text-4xl uppercase leading-[0.92] tracking-tight md:text-5xl">
            Así vendes, cobras
            <br />
            y recibes tu dinero
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/65 md:text-base">
            Un recorrido de unos 3 minutos por tu panel: cómo te paga tu cliente con QR, cómo pides tu
            liquidación y qué hacemos para que nadie te engañe con una captura.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-white/75">
            {["Tu panel, en un minuto", "Cómo cobras con QR", "Cómo pides tu dinero", "Por qué es seguro"].map((t, i) => (
              <li key={t} className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center border border-white/20 font-mono text-[11px] text-jade-400">
                  {i + 1}
                </span>
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-white/45">Toca «Activar voz» en el video para escuchar la explicación.</p>
          <MotionLinkButton href="/crear-tienda" className="btn-editorial mt-6 inline-flex border-white bg-white text-ink">
            Crear mi tienda gratis →
          </MotionLinkButton>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          // min-w-0: sin esto, la fila de capítulos del video ensancha la
          // columna de la grilla y en el celular todo se corta a la derecha.
          className="min-w-0 text-ink"
        >
          <VideoPlayer commissionPercent={commissionPercent} payer="comprador" includeIntro autoNextChapter />
        </motion.div>
      </div>
    </section>
  );
}
