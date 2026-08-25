"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { motion, useReducedMotion, HTMLMotionProps } from "framer-motion";

const MotionLink = motion(Link);

// Islas de cliente chicas para darle feedback de verdad (lift al pasar el
// mouse, "aplastón" al tocar) a los CTAs que viven en componentes server —
// así no hace falta convertir toda la página a "use client" solo por un
// botón. El feedback al tocar es lo que le falta a un simple :hover de CSS
// en celular (que es la mayoría del tráfico acá).
export function MotionLinkButton({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <MotionLink
      href={href}
      className={className}
      whileHover={shouldReduceMotion ? undefined : { y: -3 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {children}
    </MotionLink>
  );
}

export function MotionAnchorButton({
  href,
  className,
  target,
  children,
}: {
  href: string;
  className?: string;
  target?: string;
  children: ReactNode;
}) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.a
      href={href}
      target={target}
      className={className}
      whileHover={shouldReduceMotion ? undefined : { y: -3 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {children}
    </motion.a>
  );
}

// Para <button> dentro de formularios (siguen siendo "use client" de por
// sí) — mismo whileTap, sin duplicar la config del spring en cada archivo.
export function MotionButton({
  children,
  ...props
}: HTMLMotionProps<"button"> & { children: ReactNode }) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.button
      whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
