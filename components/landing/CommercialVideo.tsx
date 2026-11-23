"use client";

// Comercial vertical de Dcompras (public/video/comercial-dcompras.mp4, 30 s).
// Se reproduce solo, en silencio y en bucle mientras está en pantalla (los
// navegadores no dejan sonar un video sin que el usuario toque algo); el
// botón "Activar sonido" lo reinicia con voz y música.
//
// Las tomas con personas son videos de stock de Mixkit con licencia Free
// (uso comercial permitido, sin atribución obligatoria). Para reemplazarlas
// por grabaciones propias, ver docs/comercial-guion-grabacion.md.

import { useEffect, useRef, useState } from "react";

export default function CommercialVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  // Solo se reproduce cuando se ve: no gasta datos ni batería si nadie lo mira.
  useEffect(() => {
    const video = ref.current;
    if (!video || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.4 }
    );
    io.observe(video);
    return () => io.disconnect();
  }, []);

  function toggleSound() {
    const video = ref.current;
    if (!video) return;
    if (muted) {
      video.currentTime = 0;
      video.muted = false;
      video.play().catch(() => {});
    } else {
      video.muted = true;
    }
    setMuted(!muted);
  }

  return (
    <div className="relative mx-auto aspect-[9/16] w-full max-w-[340px] overflow-hidden rounded-[2rem] border-[6px] border-white/10 bg-ink shadow-[0_40px_90px_-30px_rgba(29,190,134,0.45)]">
      <video
        ref={ref}
        src="/video/comercial-dcompras.mp4"
        poster="/video/comercial-portada.jpg"
        muted={muted}
        loop
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
        aria-label="Comercial de Dcompras: vende por redes y cobra con QR"
      />
      <button
        type="button"
        onClick={toggleSound}
        className={`absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold shadow-lg transition ${
          muted ? "bg-white text-ink" : "bg-ink/80 text-white"
        }`}
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 8v4h3l4 3V5L6 8H3z" fill="currentColor" stroke="none" />
          {muted ? <path d="M13 8l4 4M17 8l-4 4" /> : <path d="M13 7.5a3.5 3.5 0 0 1 0 5M15.5 5a7 7 0 0 1 0 10" />}
        </svg>
        {muted ? "Activar sonido" : "Silenciar"}
      </button>
    </div>
  );
}
