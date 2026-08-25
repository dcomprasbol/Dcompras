"use client";

import { ReactNode } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

// Antes calculaba el ángulo a mano y lo aplicaba con una transición CSS de
// duración fija — se sentía bien pero "plano" al soltar el mouse. Con
// useSpring de verdad, el tilt tiene inercia (overshoot suave y freno
// natural) en vez de simplemente interpolar a velocidad constante.
export default function TiltCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const springConfig = { stiffness: 300, damping: 20 };
  const rotateX = useSpring(rawRotateX, springConfig);
  const rotateY = useSpring(rawRotateY, springConfig);

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    if (shouldReduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rawRotateX.set(py * -8);
    rawRotateY.set(px * 8);
  }

  function handleLeave() {
    rawRotateX.set(0);
    rawRotateY.set(0);
  }

  return (
    <motion.div
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={className}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
    >
      {children}
    </motion.div>
  );
}
