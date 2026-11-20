"use client";

// Tutorial de bienvenida del panel del vendedor, a pantalla completa y con
// narración por voz. Se abre solo la primera vez que el vendedor entra a su
// panel (stores.tutorial_seen_at) y se puede volver a ver cuando quiera con
// el botón "Ver tutorial" del panel.
//
// Arranca con una portada: los navegadores (sobre todo iPhone) solo dejan
// reproducir audio después de que el usuario toca algo, así que el botón
// "Empezar con voz" es también el permiso para hablar.
//
// Se marca como visto cuando el vendedor lo termina o lo cierra después de
// empezarlo. Si en la portada elige "Ahora no", vuelve a aparecer la próxima
// vez que entre.

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "@/components/Icon";
import { VideoPlayer } from "@/components/admin/PaymentsGuide";
import { hasRecordedVoice, speechSupported, warmUpVoices, stopNarration } from "@/lib/narration";

type Stage = "cover" | "playing" | "done";

export default function TutorialModal({
  slug,
  firstTime,
  onClose,
}: {
  slug: string;
  firstTime: boolean;
  onClose: () => void;
}) {
  const [stage, setStage] = useState<Stage>("cover");
  const [withVoice, setWithVoice] = useState(true);
  const [percent, setPercent] = useState(1);
  const [payer, setPayer] = useState<"comprador" | "vendedor">("comprador");
  const [hasQr, setHasQr] = useState(true);
  const [voiceAvailable, setVoiceAvailable] = useState(false);

  useEffect(() => {
    setVoiceAvailable(speechSupported() || hasRecordedVoice());
    warmUpVoices();
    fetch(`/api/stores/${slug}/earnings`)
      .then((r) => r.json())
      .then((d) => {
        setPercent(d.commissionPercent ?? 1);
        setPayer(d.commissionPayer === "vendedor" ? "vendedor" : "comprador");
      })
      .catch(() => {});
    fetch(`/api/stores/${slug}`)
      .then((r) => r.json())
      .then((d) => setHasQr(Boolean(d.store?.paymentQrImageUrl)))
      .catch(() => {});
    // Sin scroll de fondo mientras está abierto.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      stopNarration();
    };
  }, [slug]);

  const markSeen = useCallback(() => {
    fetch(`/api/stores/${slug}/tutorial`, { method: "POST" }).catch(() => {});
  }, [slug]);

  const close = useCallback(
    (seen: boolean) => {
      stopNarration();
      if (seen) markSeen();
      onClose();
    },
    [markSeen, onClose]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(stage !== "cover");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, stage]);

  function start(voice: boolean) {
    setWithVoice(voice);
    setStage("playing");
    markSeen();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      // 100dvh: en el celular descuenta la barra del navegador (con 100vh el
      // final del tutorial quedaba tapado).
      className="fixed inset-x-0 top-0 z-[60] flex h-[100dvh] flex-col bg-ink/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial de Dcompras"
    >
      {/* Barra superior */}
      <div className="flex shrink-0 items-center justify-between px-3 py-2 text-white md:px-8 md:py-3">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="" className="h-7 w-7 rounded-lg bg-white object-contain p-0.5" />
          <div>
            <p className="text-sm font-bold leading-tight">Tutorial de Dcompras</p>
            <p className="text-[11px] leading-tight text-white/50">Vender, cobrar y recibir tu dinero</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => close(stage !== "cover")}
          className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
        >
          {stage === "cover" && firstTime ? "Ahora no" : "Cerrar"}
          <Icon name="x" mono className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col overflow-y-auto px-2 pb-2 sm:px-3 sm:pb-4 md:px-6 md:pb-8">
        <AnimatePresence mode="wait">
          {stage === "cover" && (
            <motion.div
              key="cover"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="m-auto w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl"
            >
              <motion.div
                initial={{ scale: 0.6, rotate: -8 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 14 }}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-jade-500 text-white shadow-lg"
              >
                <Icon name="play" mono className="h-7 w-7" />
              </motion.div>
              <h2 className="mt-4 font-display text-2xl font-bold text-ink">
                {firstTime ? "¡Bienvenido a tu panel!" : "Tutorial de Dcompras"}
              </h2>
              <p className="mt-2 text-sm text-ink/60">
                En unos 3 minutos te mostramos cómo vender, cómo te pagan tus clientes, cómo pides tu dinero y por
                qué es seguro.
              </p>
              <ul className="mx-auto mt-4 max-w-xs space-y-1.5 text-left text-sm text-ink/70">
                {["Tu panel", "Cómo cobras", "Cómo pides tu dinero", "Por qué es seguro"].map((t, i) => (
                  <li key={t} className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-jade-50 text-[11px] font-bold text-jade-700">
                      {i + 1}
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => start(voiceAvailable)}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-jade-500 px-4 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-jade-600"
              >
                <Icon name="play" mono className="h-5 w-5" />
                {voiceAvailable ? "Empezar con voz" : "Empezar tutorial"}
              </button>
              {voiceAvailable && (
                <button type="button" onClick={() => start(false)} className="mt-2 w-full text-sm font-semibold text-ink/50">
                  Ver sin sonido (con subtítulos)
                </button>
              )}
              <p className="mt-4 text-[11px] text-ink/40">Lo puedes volver a ver cuando quieras con el botón «Ver tutorial».</p>
            </motion.div>
          )}

          {stage === "playing" && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <VideoPlayer
                commissionPercent={percent}
                payer={payer}
                includeIntro
                narrate={withVoice}
                autoNextChapter
                cinema
                onFinished={() => setStage("done")}
              />
            </motion.div>
          )}

          {stage === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="m-auto w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 12 }}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-jade-500 text-3xl text-white"
              >
                ✓
              </motion.div>
              <h2 className="mt-4 font-display text-2xl font-bold text-ink">¡Listo, ya sabes cómo funciona!</h2>
              <p className="mt-2 text-sm text-ink/60">
                {hasQr
                  ? "Ya tienes tu QR cargado: cuando vendas con QR automático, tu dinero aparece en tu Billetera."
                  : "Te falta un paso: carga tu QR para que podamos pagarte tus ventas."}
              </p>
              {!hasQr && (
                <a
                  href="?tab=datos"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-jade-500 px-4 py-3.5 text-base font-bold text-white"
                >
                  <Icon name="qr" mono className="h-5 w-5" />
                  Cargar mi QR ahora
                </a>
              )}
              <button
                type="button"
                onClick={() => close(true)}
                className={`mt-3 w-full rounded-2xl px-4 py-3 text-sm font-bold ${hasQr ? "bg-jade-500 text-white" : "border border-ink/15 text-ink/70"}`}
              >
                Ir a mi panel
              </button>
              <button type="button" onClick={() => setStage("playing")} className="mt-2 w-full text-sm font-semibold text-ink/50">
                ↻ Ver de nuevo
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
