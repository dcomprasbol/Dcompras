"use client";

// Sección de la landing para quien compra: el anuncio "¿Te gustó algo en
// redes?" (public/video/anuncio-comprador.mp4) y los tres pasos que muestra.

import { motion } from "framer-motion";
import CommercialVideo from "@/components/landing/CommercialVideo";

const STEPS = [
  { n: "1", t: "Ves todo con precio", d: "El catálogo completo de la tienda, sin preguntar por chat." },
  { n: "2", t: "Pagas con QR", d: "Desde la app de cualquier banco, con el monto exacto de tu pedido." },
  { n: "3", t: "Sigues tu pedido", d: "El pago se confirma solo y ves cada paso hasta que llega a tus manos." },
];

export default function BuyerAd() {
  return (
    <section id="compradores" className="relative overflow-hidden bg-paper px-5 py-20 md:py-24">
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="order-2 min-w-0 lg:order-1"
        >
          <CommercialVideo
            src="/video/anuncio-comprador.mp4"
            poster="/video/anuncio-comprador.jpg"
            label="Anuncio de Dcompras para compradores: ves los precios, pagas con QR y sigues tu pedido"
            className="border-ink/10 shadow-[0_40px_90px_-30px_rgba(255,77,109,0.4)]"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          className="order-1 min-w-0 lg:order-2"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-coral-500">Para quien compra</p>
          <h2 className="mt-3 font-impact text-4xl uppercase leading-[0.92] tracking-tight text-ink md:text-6xl">
            ¿Te gustó algo
            <br />
            <span className="text-coral-500">en redes?</span>
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink/65 md:text-base">
            Ves los precios, pagas con QR y sabes en qué va tu pedido, sin esperar a que te contesten el chat.
          </p>
          <ol className="mt-8 space-y-5">
            {STEPS.map((s) => (
              <li key={s.n} className="flex gap-4">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-ink font-impact text-lg text-white">
                  {s.n}
                </span>
                <div>
                  <p className="font-semibold text-ink">{s.t}</p>
                  <p className="text-sm text-ink/60">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </motion.div>
      </div>
    </section>
  );
}
