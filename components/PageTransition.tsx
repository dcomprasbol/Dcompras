"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MARK_CUT_PATH, MARK_D_PATH, MARK_NOTCH_PATH, MARK_VIEWBOX } from "./BrandMark";

// Cortina con el logo de Dcompras entre pantallas de la plataforma.
// Next (App Router) no expone eventos de navegación, así que arranca al
// hacer clic en un link interno (fase de captura, antes de que <Link> haga
// preventDefault) y termina cuando cambia el pathname. Nunca corre dentro
// de una tienda: ahí la marca es la del vendedor, no la nuestra.

const PLATFORM_ROOTS = new Set([
  "",
  "admin",
  "auth",
  "categoria",
  "crear-tienda",
  "login",
  "mis-pedidos",
  "plataforma",
  "privacidad",
  "terminos",
  "tiendas",
]);

function isPlatformPath(pathname: string) {
  return PLATFORM_ROOTS.has(pathname.split("/")[1] ?? "");
}

// Tiempo mínimo con el logo a la vista, para que la animación se lea
// completa aunque la página nueva llegue al instante (links prefetcheados).
const MIN_VISIBLE_MS = 900;
// Si la navegación nunca termina (link que hizo otra cosa), no dejamos la
// cortina tapando la pantalla.
const FAILSAFE_MS = 8000;

const EASE = [0.76, 0, 0.24, 1] as const;

function LogoMark() {
  return (
    <svg viewBox={MARK_VIEWBOX} className="h-24 w-auto overflow-visible" aria-hidden="true">
      <motion.path
        d={MARK_D_PATH}
        fill="#FFFFFF"
        fillRule="evenodd"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut", delay: 0.15 }}
        style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
      />
      {/* Hueco diagonal del logo: tapa el pie del trazo con el color de fondo. */}
      <path d={MARK_CUT_PATH} fill="#14102A" />
      <motion.path
        d={MARK_NOTCH_PATH}
        className="fill-jade-400"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.32 }}
      />
    </svg>
  );
}

export default function PageTransition() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const startedAt = useRef(0);
  const failsafe = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (reduceMotion) return;

    function onClick(e: MouseEvent) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element | null)?.closest?.("a");
      if (!anchor || !anchor.href) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Mismo pathname (ancla #, cambio de query): no hay salto de pantalla.
      if (url.pathname === window.location.pathname) return;
      if (!isPlatformPath(window.location.pathname)) return;

      startedAt.current = Date.now();
      setVisible(true);
      clearTimeout(failsafe.current);
      failsafe.current = setTimeout(() => setVisible(false), FAILSAFE_MS);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [reduceMotion]);

  // Llegó la pantalla nueva: esperamos el mínimo y levantamos la cortina.
  useEffect(() => {
    if (!startedAt.current) return;
    const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - startedAt.current));
    const t = setTimeout(() => {
      startedAt.current = 0;
      clearTimeout(failsafe.current);
      setVisible(false);
    }, wait);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="page-transition"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink"
          initial={{ clipPath: "inset(100% 0 0 0)" }}
          animate={{ clipPath: "inset(0% 0 0 0)" }}
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.45, ease: EASE }}
          aria-hidden="true"
        >
          <motion.div
            className="flex flex-col items-center"
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
          >
            <LogoMark />
            <div className="mt-8 h-[2px] w-24 overflow-hidden bg-white/10">
              <motion.div
                className="h-full w-full origin-left bg-jade-400"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: [0, 0.7, 0.9] }}
                transition={{ duration: 2.5, times: [0, 0.3, 1], ease: "easeOut", delay: 0.3 }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
