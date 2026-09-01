"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Momento a pantalla completa (tipo Strava/PedidosYa) que tapa toda la
// pantalla un instante justo cuando el pago pasa de "pendiente" a
// "pagado" — el comprador lo ve sin tener que fijarse en un cartelito
// chico. Se usa desde el checkout (mientras espera con el QR abierto) y
// desde PaymentStatusPoller (página de seguimiento del pedido).
const BURST = Array.from({ length: 10 }, (_, i) => (360 / 10) * i);

export default function PaymentConfirmedCelebration({
  show,
  onDone,
}: {
  show: boolean;
  onDone: () => void;
}) {
  // Se cierra sola: es un festejo momentáneo, no un modal que haya que
  // cerrar a mano.
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(onDone, 2600);
    return () => clearTimeout(timer);
  }, [show, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="payment-celebration"
          role="status"
          aria-live="polite"
          // "bg-ink/92" (color custom del tema) compilaba a transparente —
          // Tailwind no le generaba la regla con el modificador de opacidad.
          // bg-black/90 es un color base de Tailwind, soporta opacidad sin
          // depender de cómo esté definido "ink" en tailwind.config.
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="relative flex h-28 w-28 items-center justify-center">
            {/* Anillo que se expande y se desvanece detrás del círculo. */}
            <motion.span
              className="store-accent-bg absolute h-full w-full rounded-full"
              initial={{ scale: 0.7, opacity: 0.7 }}
              animate={{ scale: 2.4, opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
            {/* Ráfaga de confeti — puntitos que salen disparados del centro. */}
            {BURST.map((angle) => (
              <motion.span
                key={angle}
                className="absolute h-2 w-2 rounded-full bg-white"
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: Math.cos((angle * Math.PI) / 180) * 100,
                  y: Math.sin((angle * Math.PI) / 180) * 100,
                  opacity: 0,
                  scale: 0.4,
                }}
                transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
              />
            ))}
            {/* Círculo con el check dibujándose. */}
            <motion.div
              className="store-accent-bg relative flex h-24 w-24 items-center justify-center rounded-full shadow-2xl"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
            >
              <svg viewBox="0 0 24 24" className="h-12 w-12 text-white" fill="none">
                <motion.path
                  d="M5 13l4 4L19 7"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, delay: 0.35, ease: "easeOut" }}
                />
              </svg>
            </motion.div>
          </div>
          <motion.p
            className="mt-6 text-center font-impact text-2xl uppercase tracking-tight text-white"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.35 }}
          >
            ¡Pago confirmado!
          </motion.p>
          <motion.p
            className="mt-1 text-center text-sm text-white/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.35 }}
          >
            Ya le llegó a la tienda
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
