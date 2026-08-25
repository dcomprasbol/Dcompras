"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

// Se usa en toda la landing y en las tiendas para el reveal al hacer scroll.
// Misma API de siempre (children/delay/className) para no tocar los ~30
// lugares que ya la usan — por dentro ahora corre con Framer Motion en vez
// del IntersectionObserver + clase CSS manual de antes: spring real en vez
// de un ease fijo.
//
// El CSS global (prefers-reduced-motion) apaga transiciones/animaciones por
// CSS, pero Framer Motion anima vía JS y no lo respeta solo — por eso acá
// se chequea con useReducedMotion() y, si aplica, se muestra directo en su
// posición final sin desplazamiento.
export default function RevealOnScroll({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 120, damping: 18, delay: delay / 1000 }
      }
    >
      {children}
    </motion.div>
  );
}
