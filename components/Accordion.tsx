"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

// Acordeón con altura animada de verdad (Framer Motion anima el "auto"
// interpolando la altura real del contenido), no el salto instantáneo de
// <details>. El "+" (en su cuadro) gira a "×" y se pinta de jade al abrir.
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
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center border transition-colors ${
            open
              ? "border-jade-400 bg-jade-400 text-ink"
              : dark
                ? "border-white/25 text-jade-400"
                : "border-ink/20 text-jade-600"
          }`}
          aria-hidden="true"
        >
          <motion.svg
            viewBox="0 0 16 16"
            className="h-3.5 w-3.5"
            animate={{ rotate: open ? 45 : 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 20 }}
          >
            <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
          </motion.svg>
        </span>
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
