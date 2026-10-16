"use client";

import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

// Cuenta de 0 al valor cuando entra en pantalla. Recibe el texto final tal
// cual se muestra ("US$ 834M", "+4.700%") y anima solo la parte numérica,
// con punto de miles como en Bolivia. El servidor renderiza el valor final
// (SEO y sin JS se ve bien); el conteo arranca recién al hidratar.
function split(value: string) {
  const m = value.match(/^(\D*)([\d.]+)(\D*)$/);
  if (!m) return null;
  return { prefix: m[1], target: Number(m[2].replace(/\./g, "")), suffix: m[3] };
}

function withThousands(n: number) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export default function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduceMotion = useReducedMotion();
  const parts = split(value);
  const [current, setCurrent] = useState<number | null>(null);

  // Al montar, baja a 0 para que el conteo se vea al llegar a la sección.
  useEffect(() => {
    if (parts && !reduceMotion) setCurrent(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  useEffect(() => {
    if (!parts || !inView || reduceMotion) return;
    const controls = animate(0, parts.target, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: setCurrent,
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduceMotion]);

  const text =
    parts && current !== null ? `${parts.prefix}${withThousands(current)}${parts.suffix}` : value;

  return (
    <span ref={ref} className={`tabular-nums ${className ?? ""}`}>
      {text}
    </span>
  );
}
