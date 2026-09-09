"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type Slide = { url: string; alt: string };

// Fondo del hero "moda" (ver HeroModa en app/[slug]/page.tsx): antes era
// una sola foto fija; ahora rota sola entre varios productos del catálogo
// (crossfade, sin librería de carrusel — son pocas fotos y esto alcanza),
// con puntitos arriba a la derecha para navegar a mano. Si solo hay una
// foto, no tiene sentido animar ni mostrar puntos: se comporta como antes.
export default function HeroCarousel({
  images,
  intervalMs = 4500,
}: {
  images: Slide[];
  intervalMs?: number;
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => setActive((a) => (a + 1) % images.length), intervalMs);
    return () => clearInterval(id);
  }, [images.length, intervalMs]);

  return (
    <>
      {images.map((img, i) => (
        <motion.div
          key={img.url + i}
          className="absolute inset-0"
          initial={false}
          animate={{ opacity: i === active ? 1 : 0 }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.url} alt={img.alt} className="h-full w-full object-cover" />
        </motion.div>
      ))}

      {images.length > 1 && (
        <div className="absolute right-4 top-4 z-10 flex gap-1.5 rounded-full bg-black/25 px-2.5 py-2 backdrop-blur-sm">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ver foto ${i + 1}`}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? "w-5 bg-white" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </>
  );
}
