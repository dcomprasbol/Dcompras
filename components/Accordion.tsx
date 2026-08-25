"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

// Acordeón con altura animada de verdad (Framer Motion anima el "auto"
// interpolando la altura real del contenido), no el salto instantáneo de
// <details>. El "+" gira a "×" al abrir.
export default function Accordion({
  question,
  answer,
  dark = false,
}: {
  question: string;
  answer: string;
  dark?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={`border-b ${dark ? "border-white/15" : "border-ink/10"}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-6 py-5 text-left"
      >
        <span
          className={`font-sans text-base font-medium ${dark ? "text-white" : "text-ink"} sm:text-lg`}
        >
          {question}
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 20 }}
          className={`shrink-0 font-impact text-xl leading-none ${dark ? "text-white" : "text-ink"}`}
          aria-hidden="true"
        >
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { height: { type: "spring", stiffness: 300, damping: 32 }, opacity: { duration: 0.2 } }
            }
            className="overflow-hidden"
          >
            <p className={`pb-5 pr-10 text-sm leading-relaxed ${dark ? "text-white/60" : "text-ink/60"}`}>
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
