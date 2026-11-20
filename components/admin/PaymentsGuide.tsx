"use client";

// Guía "Cómo funciona" de la billetera del vendedor: explica con
// animaciones cómo se cobra con QR automático, cómo se pide la liquidación
// y por qué es seguro. La idea es que el vendedor CONFÍE en el cobro y la
// liquidación de Dcompras sin tener que preguntar por WhatsApp.
//
// Los "videos" son escenas animadas (framer-motion), no archivos de video:
// cargan al instante con datos móviles y se editan como texto. Si algún día
// graban un video real, basta con ponerle `videoSrc` al capítulo y se
// muestra ese video en lugar de las escenas.
//
// Todo lo que dice esta guía tiene que ser verdad hoy en el sistema — ver
// lib/commission.ts (quién paga el 1%), lib/repo.ts → requestPayout /
// confirmPayoutReceived (los tres pasos) y los webhooks de pago (firma y
// chequeo de monto). Si cambia el flujo, cambiar también estos textos.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Accordion from "@/components/Accordion";
import { hasRecordedVoice, narrate, speechSupported, stopNarration, warmUpVoices } from "@/lib/narration";
import { tutorialScript, TUTORIAL_PRICE_EXAMPLE } from "@/lib/tutorialScript";
import Icon from "@/components/Icon";
import { formatBs, PAYOUT_PROCESSING_TIME } from "@/lib/utils";

type Payer = "comprador" | "vendedor";

type Props = {
  commissionPercent: number;
  commissionPayer: Payer;
  autoQrEnabled: boolean;
  onGoToWallet: () => void;
};

export default function PaymentsGuide({ commissionPercent, commissionPayer, autoQrEnabled, onGoToWallet }: Props) {
  return (
    <div className="space-y-6">
      <GuideHero autoQrEnabled={autoQrEnabled} payer={commissionPayer} />
      <VideoPlayer commissionPercent={commissionPercent} payer={commissionPayer} />
      <ManualVsAuto />
      <EarningsCalculator commissionPercent={commissionPercent} payer={commissionPayer} />
      <SecurityPoints />
      <PayoutFaq commissionPercent={commissionPercent} payer={commissionPayer} />

      <div className="rounded-2xl bg-ink p-5 text-center text-white">
        <p className="font-display text-lg font-bold">¿Listo para ver tu saldo?</p>
        <p className="mt-1 text-sm text-white/60">Tu dinero y tus liquidaciones, en un solo lugar.</p>
        <button
          type="button"
          onClick={onGoToWallet}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-jade-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-jade-600"
        >
          <Icon name="wallet" mono className="h-4 w-4" />
          Ir a mi billetera
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Encabezado
// ---------------------------------------------------------------------------

function GuideHero({ autoQrEnabled, payer }: { autoQrEnabled: boolean; payer: Payer }) {
  const benefits = [
    { icon: "bell" as const, title: "Te avisa solo", text: "El pedido se marca pagado sin que revises tu banco." },
    { icon: "check" as const, title: "Sin capturas falsas", text: "El pago lo confirma el banco, no una foto." },
    payer === "vendedor"
      ? { icon: "wallet" as const, title: "Sin recargos", text: "Tu cliente paga tu precio exacto; tú asumes el 1%." }
      : { icon: "wallet" as const, title: "Recibes el 100%", text: "El 1% lo paga tu cliente, no se te descuenta." },
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-jade-100 bg-gradient-to-br from-jade-50 via-white to-white p-5">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-jade-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
        <Icon name="qr" mono className="h-3.5 w-3.5" />
        QR automático
      </span>
      <h2 className="mt-3 font-display text-2xl font-bold leading-tight text-ink">
        Cobra sin revisar tu banco.
        <br />
        <span className="text-jade-600">Nosotros confirmamos por ti.</span>
      </h2>
      <p className="mt-2 text-sm text-ink/60">
        Mira en un minuto cómo te llega el dinero, cómo pides tu liquidación y por qué es seguro.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {benefits.map((b, i) => (
          <motion.div
            key={b.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
            className="rounded-xl border border-ink/5 bg-white p-3 shadow-sm"
          >
            <Icon name={b.icon} className="h-5 w-5" />
            <p className="mt-1.5 text-sm font-bold text-ink">{b.title}</p>
            <p className="text-xs text-ink/55">{b.text}</p>
          </motion.div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event("dcompras:open-tutorial"))}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-bold text-white transition hover:bg-ink-soft"
      >
        <Icon name="play" mono className="h-4 w-4" />
        Ver el tutorial completo con voz
      </button>
      {!autoQrEnabled && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <Icon name="clock" mono className="mr-1 h-3.5 w-3.5" />
          Estamos activando el QR automático. Mientras tanto, tus clientes te pagan con tu propio QR y
          esos pagos te llegan directo, sin pasar por la billetera.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reproductor tipo video
// ---------------------------------------------------------------------------

type Scene = { caption: string; duration: number; render: () => ReactNode };
type Chapter = { id: string; title: string; subtitle: string; videoSrc?: string; scenes: Scene[] };

function buildChapters(commissionPercent: number, payer: Payer, includeIntro = false): Chapter[] {
  const price = TUTORIAL_PRICE_EXAMPLE;
  const fee = Math.round(price * commissionPercent) / 100;
  // Mismo cálculo que lib/commission.ts: quién paga cambia lo que paga el
  // cliente y lo que te llega a ti.
  const total = payer === "vendedor" ? price : price + fee;
  const net = payer === "vendedor" ? Math.round((price - fee) * 100) / 100 : price;
  // Los textos (subtítulo y narración) vienen del guion: lib/tutorialScript.ts.
  const t = tutorialScript(commissionPercent, payer);
  const intro: Chapter = {
    id: "panel",
    title: "Tu panel",
    subtitle: "Todo en un minuto",
    scenes: [
      { caption: t.panel[0], duration: 4200, render: () => <SceneWelcome /> },
      { caption: t.panel[1], duration: 4600, render: () => <SceneProducts /> },
      { caption: t.panel[2], duration: 4600, render: () => <SceneToCollect /> },
      { caption: t.panel[3], duration: 4200, render: () => <SceneCustomers /> },
      { caption: t.panel[4], duration: 5200, render: () => <SceneUploadQr /> },
    ],
  };
  return [
    ...(includeIntro ? [intro] : []),
    {
      id: "cobro",
      title: "Cómo cobras",
      subtitle: "Del pedido a tu billetera",
      scenes: [
        { caption: t.cobro[0], duration: 3800, render: () => <SceneCart total={total} /> },
        { caption: t.cobro[1], duration: 3800, render: () => <SceneQr total={total} /> },
        { caption: t.cobro[2], duration: 4200, render: () => <SceneBankOk total={total} /> },
        { caption: t.cobro[3], duration: 4200, render: () => <SceneSellerNotified price={price} /> },
        { caption: t.cobro[4], duration: 4200, render: () => <SceneWalletUp amount={net} payer={payer} /> },
        { caption: t.cobro[5], duration: 7600, render: () => <SceneWhoPays percent={commissionPercent} /> },
      ],
    },
    {
      id: "liquidacion",
      title: "Cómo pides tu dinero",
      subtitle: "Tu liquidación en 3 pasos",
      scenes: [
        { caption: t.liquidacion[0], duration: 4200, render: () => <ScenePayoutRequest /> },
        { caption: t.liquidacion[1], duration: 4200, render: () => <ScenePayoutTracker step={1} /> },
        { caption: t.liquidacion[2], duration: 4200, render: () => <SceneReceipt /> },
        { caption: t.liquidacion[3], duration: 4400, render: () => <ScenePayoutTracker step={3} /> },
      ],
    },
    {
      id: "seguridad",
      title: "Por qué es seguro",
      subtitle: "Tu dinero, siempre a la vista",
      scenes: [
        { caption: t.seguridad[0], duration: 4600, render: () => <SceneNoFakes /> },
        { caption: t.seguridad[1], duration: 4600, render: () => <SceneAmountCheck total={total} /> },
        { caption: t.seguridad[2], duration: 4200, render: () => <SceneLedger /> },
        { caption: t.seguridad[3], duration: 4200, render: () => <SceneLock /> },
      ],
    },
  ];
}

export type VideoPlayerProps = {
  commissionPercent: number;
  payer: Payer;
  /** Incluye el capítulo "Tu panel" (tutorial de bienvenida). */
  includeIntro?: boolean;
  /** Narración por voz activada al empezar (el usuario la puede apagar). */
  narrate?: boolean;
  /** Al terminar un capítulo pasa solo al siguiente (modo tutorial). */
  autoNextChapter?: boolean;
  /** Se llama cuando termina el último capítulo. */
  onFinished?: () => void;
  /** Escenario grande y oscuro para el tutorial a pantalla completa. */
  cinema?: boolean;
};

export function VideoPlayer({
  commissionPercent,
  payer,
  includeIntro = false,
  narrate: narrateInitially = false,
  autoNextChapter = false,
  onFinished,
  cinema = false,
}: VideoPlayerProps) {
  const chapters = buildChapters(commissionPercent, payer, includeIntro);
  const reduce = useReducedMotion();
  const [chapterIdx, setChapterIdx] = useState(0);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(!reduce || narrateInitially);
  const [visible, setVisible] = useState(true);
  const [voiceOn, setVoiceOn] = useState(narrateInitially);
  const [speaking, setSpeaking] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  const chapter = chapters[chapterIdx];
  const scene = chapter.scenes[sceneIdx];

  // En el celular los capítulos no entran todos: al pasar al siguiente, se
  // acomoda solo para que se vea cuál está sonando.
  const firstChapterRender = useRef(true);
  useEffect(() => {
    if (firstChapterRender.current) {
      firstChapterRender.current = false;
      return;
    }
    activeTabRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [chapterIdx]);
  const sceneId = `${chapter.id}-${sceneIdx + 1}`;
  const isLastChapter = chapterIdx === chapters.length - 1;
  const ended = sceneIdx === chapter.scenes.length - 1 && elapsed >= scene.duration && !speaking && !playing;

  useEffect(() => {
    setCanSpeak(speechSupported() || hasRecordedVoice());
    warmUpVoices();
    return () => stopNarration();
  }, []);

  // Pausa sola cuando el reproductor sale de la pantalla (no gasta batería
  // ni avanza escenas que nadie está mirando). En modo cine siempre se ve.
  useEffect(() => {
    if (cinema) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, [cinema]);

  // Narración: cada escena se lee al entrar. La escena no avanza hasta que
  // termina de hablar (y pasó su duración mínima), así voz y animación van
  // juntas aunque la voz del dispositivo sea más lenta o más rápida.
  useEffect(() => {
    if (!voiceOn || !playing || !visible || chapter.videoSrc) {
      stopNarration();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    const cancel = narrate(sceneId, scene.caption, () => setSpeaking(false));
    return () => {
      cancel();
    };
    // Solo al cambiar de escena o al pausar/reanudar/silenciar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId, voiceOn, playing, visible]);

  // El reloj solo suma tiempo; avanzar de escena se decide aparte (abajo),
  // para que el updater de estado sea puro.
  useEffect(() => {
    if (!playing || !visible || chapter.videoSrc) return;
    const id = window.setInterval(() => setElapsed((e) => e + 100), 100);
    return () => window.clearInterval(id);
  }, [playing, visible, chapter.videoSrc]);

  useEffect(() => {
    if (!playing) return;
    // Espera a la voz, pero nunca más del triple de la duración (por si el
    // navegador no avisa que terminó de hablar).
    const waitingVoice = voiceOn && speaking && elapsed < scene.duration * 3;
    if (elapsed < scene.duration || waitingVoice) return;
    if (sceneIdx < chapter.scenes.length - 1) {
      setSceneIdx(sceneIdx + 1);
      setElapsed(0);
    } else if (autoNextChapter && !isLastChapter) {
      setChapterIdx(chapterIdx + 1);
      setSceneIdx(0);
      setElapsed(0);
    } else {
      setPlaying(false);
      setSpeaking(false);
      setElapsed(scene.duration);
      if (isLastChapter) onFinished?.();
    }
  }, [elapsed, speaking, playing, voiceOn, scene.duration, sceneIdx, chapter.scenes.length, autoNextChapter, isLastChapter, chapterIdx, onFinished]);

  function goChapter(i: number) {
    setChapterIdx(i);
    setSceneIdx(0);
    setElapsed(0);
    setPlaying(true);
  }
  function goScene(i: number) {
    setSceneIdx(i);
    setElapsed(0);
  }
  function togglePlay() {
    if (ended) {
      goScene(0);
      setPlaying(true);
      return;
    }
    setPlaying((p) => !p);
  }

  // Progreso de la escena: si hay voz, avanza con el tiempo pero se queda
  // en 95% hasta que termina de hablar.
  const sceneProgress = (s: Scene, i: number) => {
    if (i < sceneIdx) return 100;
    if (i > sceneIdx) return 0;
    const p = Math.min(100, (elapsed / s.duration) * 100);
    return voiceOn && speaking ? Math.min(p, 95) : p;
  };

  return (
    <div
      ref={ref}
      className={
        cinema
          ? "flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          : "overflow-hidden rounded-2xl border border-ink/5 bg-white shadow-sm"
      }
    >
      {/* Capítulos */}
      <div
        className="flex gap-1 overflow-x-auto border-b border-ink/5 p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Videos de la guía"
      >
        {chapters.map((c, i) => (
          <button
            key={c.id}
            ref={i === chapterIdx ? activeTabRef : undefined}
            type="button"
            role="tab"
            aria-selected={i === chapterIdx}
            onClick={() => goChapter(i)}
            className={`min-w-[8.5rem] flex-1 rounded-xl px-3 py-2 text-left transition ${
              i === chapterIdx ? "bg-ink text-white" : i < chapterIdx ? "text-jade-700 hover:bg-paper" : "text-ink/60 hover:bg-paper"
            }`}
          >
            <span className={`block text-[10px] font-bold uppercase tracking-wider ${i === chapterIdx ? "text-jade-400" : "text-ink/35"}`}>
              {i < chapterIdx ? "✓ " : ""}Parte {i + 1}
            </span>
            <span className="block text-sm font-semibold">{c.title}</span>
          </button>
        ))}
      </div>

      {chapter.videoSrc ? (
        <video src={chapter.videoSrc} controls playsInline preload="metadata" className="aspect-video w-full bg-ink" />
      ) : (
        <>
          {/* Escenario */}
          <div
            className={`relative flex items-center justify-center overflow-hidden ${
              cinema ? "min-h-[240px] flex-1 bg-gradient-to-b from-[#f2fbf7] via-paper to-white" : "h-[340px] bg-gradient-to-b from-paper to-white"
            }`}
          >
            {/* Brillo de fondo animado: da sensación de video, no de diapositiva */}
            {!reduce && (
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute -left-1/4 top-0 h-[120%] w-1/2 rounded-full bg-jade-100/50 blur-3xl"
                animate={{ x: ["0%", "160%", "0%"] }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${chapter.id}-${sceneIdx}`}
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.02, y: -8 }}
                transition={{ duration: reduce ? 0 : 0.35, ease: "easeOut" }}
                className={`relative flex h-full w-full items-center justify-center ${
                  // Celulares de pantalla baja: las escenas (un celular de 290 px
                  // de alto) se achican para que no se corten.
                  cinema ? "[@media(max-height:760px)]:scale-[0.85] [@media(max-height:660px)]:scale-[0.72]" : ""
                }`}
              >
                <motion.div
                  className="flex h-full w-full items-center justify-center"
                  initial={{ scale: 1 }}
                  animate={reduce || !playing ? { scale: 1 } : { scale: 1.04 }}
                  transition={{ duration: reduce ? 0 : scene.duration / 1000 + 4, ease: "linear" }}
                >
                  {scene.render()}
                </motion.div>
              </motion.div>
            </AnimatePresence>

            {canSpeak && (
              <button
                type="button"
                onClick={() => setVoiceOn((v) => !v)}
                aria-pressed={voiceOn}
                aria-label={voiceOn ? "Silenciar la voz" : "Activar la voz"}
                className={`absolute right-3 top-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow transition ${
                  voiceOn ? "bg-ink text-white" : "bg-white text-ink/70"
                }`}
              >
                <SpeakerIcon on={voiceOn} />
                {voiceOn ? (speaking ? "Narrando" : "Voz activada") : "Activar voz"}
              </button>
            )}

            {ended && (
              <div className="absolute inset-x-0 bottom-3 flex flex-wrap justify-center gap-2 px-3">
                <button type="button" onClick={togglePlay} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow">
                  ↻ Ver de nuevo
                </button>
                {!isLastChapter && (
                  <button
                    type="button"
                    onClick={() => goChapter(chapterIdx + 1)}
                    className="rounded-full bg-jade-500 px-3 py-1.5 text-xs font-semibold text-white shadow"
                  >
                    Siguiente: {chapters[chapterIdx + 1].title} →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Subtítulo + controles */}
          <div className={`border-t border-ink/5 ${cinema ? "p-3 sm:p-4" : "p-4"}`}>
            <div className="flex gap-1" aria-hidden="true">
              {chapter.scenes.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  tabIndex={-1}
                  onClick={() => goScene(i)}
                  className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10"
                >
                  <span
                    className="block h-full rounded-full bg-jade-500 transition-[width] duration-100 ease-linear"
                    style={{ width: `${sceneProgress(s, i)}%` }}
                  />
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-start gap-3">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={ended ? "Ver de nuevo" : playing ? "Pausar" : "Reproducir"}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-white"
              >
                <Icon name={playing && !ended ? "pause" : "play"} mono className="h-4 w-4" />
              </button>
              <AnimatePresence mode="wait">
                <motion.p
                  key={`${chapter.id}-${sceneIdx}-cap`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className={`min-h-[2.5rem] leading-snug text-ink/80 ${cinema ? "text-sm sm:text-base" : "text-sm"}`}
                  aria-live="polite"
                >
                  {scene.caption}
                </motion.p>
              </AnimatePresence>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-ink/40">
              <button type="button" disabled={sceneIdx === 0} onClick={() => goScene(sceneIdx - 1)} className="disabled:opacity-30">
                ← Anterior
              </button>
              <span>
                {sceneIdx + 1} / {chapter.scenes.length}
              </span>
              <button
                type="button"
                disabled={sceneIdx === chapter.scenes.length - 1}
                onClick={() => goScene(sceneIdx + 1)}
                className="disabled:opacity-30"
              >
                Siguiente →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SpeakerIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 8v4h3l4 3V5L6 8H3z" fill="currentColor" stroke="none" />
      {on ? (
        <>
          <path d="M13 7.5a3.5 3.5 0 0 1 0 5" />
          <path d="M15.5 5a7 7 0 0 1 0 10" />
        </>
      ) : (
        <path d="M13 8l4 4M17 8l-4 4" />
      )}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Escenas (cada una se vuelve a montar al entrar, así su animación arranca de cero)
// ---------------------------------------------------------------------------

function Phone({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "dark" }) {
  return (
    <div
      className={`relative h-[290px] w-[165px] shrink-0 overflow-hidden rounded-[26px] border-[6px] border-ink shadow-xl ${
        tone === "dark" ? "bg-ink text-white" : "bg-white"
      }`}
    >
      <div className="absolute left-1/2 top-1 z-10 h-1.5 w-10 -translate-x-1/2 rounded-full bg-ink/70" />
      <div className="flex h-full flex-col px-3 pb-3 pt-5">{children}</div>
    </div>
  );
}

const pop = (delay = 0) => ({
  initial: { opacity: 0, y: 12, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { delay, type: "spring" as const, stiffness: 260, damping: 22 },
});

function SceneCart({ total }: { total: number }) {
  return (
    <Phone>
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Tu tienda</p>
      <motion.div {...pop(0.2)} className="mt-2 flex items-center gap-2 rounded-lg border border-ink/10 p-1.5">
        <div className="h-9 w-9 rounded-md bg-gradient-to-br from-coral-400 to-amber-400" />
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold text-ink">Chamarra café</p>
          <p className="text-[10px] text-ink/50">Talla M · x1</p>
        </div>
      </motion.div>
      <div className="mt-auto">
        <div className="mb-2 flex justify-between text-[10px] text-ink/50">
          <span>Total</span>
          <span className="font-mono font-bold text-ink">{formatBs(total)}</span>
        </div>
        <motion.div
          {...pop(0.8)}
          className="rounded-lg bg-jade-500 py-2 text-center text-[11px] font-bold text-white"
        >
          <motion.span
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ delay: 1.6, duration: 0.6, repeat: 2 }}
            className="inline-block"
          >
            Pagar con QR
          </motion.span>
        </motion.div>
      </div>
    </Phone>
  );
}

function QrGlyph({ size = 96 }: { size?: number }) {
  // QR de mentira, solo decorativo: patrón fijo de cuadritos.
  const cells = "1110111010100101011101010001110101110100101011101010111".split("");
  return (
    <div className="relative grid grid-cols-7 gap-[2px] rounded-md bg-white p-1.5" style={{ width: size, height: size }}>
      {Array.from({ length: 49 }).map((_, i) => (
        <span key={i} className={cells[i % cells.length] === "1" ? "rounded-[1px] bg-ink" : ""} />
      ))}
    </div>
  );
}

function SceneQr({ total }: { total: number }) {
  return (
    <Phone>
      <p className="text-center text-[10px] font-bold uppercase tracking-wider text-ink/40">Pedido #A1B2</p>
      <motion.div {...pop(0.2)} className="relative mx-auto mt-3 overflow-hidden rounded-lg border-2 border-jade-400 p-1">
        <QrGlyph />
        <motion.span
          className="absolute inset-x-1 h-0.5 bg-jade-400 shadow-[0_0_8px_2px_rgba(29,190,134,0.6)]"
          initial={{ top: "8%" }}
          animate={{ top: ["8%", "88%", "8%"] }}
          transition={{ delay: 0.6, duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
      <motion.p {...pop(0.6)} className="mt-3 text-center font-mono text-base font-bold text-ink">
        {formatBs(total)}
      </motion.p>
      <motion.p {...pop(0.9)} className="text-center text-[10px] text-ink/50">
        Monto exacto · válido solo para este pedido
      </motion.p>
    </Phone>
  );
}

function SceneBankOk({ total }: { total: number }) {
  return (
    <div className="flex items-center gap-4">
      <Phone tone="dark">
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">App de tu banco</p>
        <div className="mt-auto flex flex-col items-center pb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 220, damping: 14 }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-jade-500"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="white" strokeWidth="3">
              <motion.path
                d="M5 12.5l4.5 4.5L19 7.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.9, duration: 0.4 }}
              />
            </svg>
          </motion.div>
          <motion.p {...pop(1.1)} className="mt-3 text-xs font-bold">Pago realizado</motion.p>
          <motion.p {...pop(1.2)} className="font-mono text-sm">{formatBs(total)}</motion.p>
        </div>
      </Phone>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.6 }}
        className="hidden max-w-[150px] rounded-xl border border-jade-100 bg-jade-50 p-3 text-xs text-jade-700 sm:block"
      >
        <span className="font-bold">Banco → Dcompras</span>
        <br />
        «El pedido #A1B2 fue pagado.»
      </motion.div>
    </div>
  );
}

function SceneSellerNotified({ price }: { price: number }) {
  return (
    <Phone>
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Tu panel</p>
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 240, damping: 20 }}
        className="mt-2 rounded-xl bg-ink p-2 text-white shadow-lg"
      >
        <p className="flex items-center gap-1 text-[10px] font-bold text-jade-400">
          <Icon name="bell" mono className="h-3 w-3" /> Nuevo pedido pagado
        </p>
        <p className="text-[11px]">Chamarra café · {formatBs(price)}</p>
      </motion.div>
      <motion.div {...pop(1)} className="mt-3 rounded-lg border border-ink/10 p-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-ink">#A1B2</span>
          <motion.span
            initial={{ backgroundColor: "#FEF3C7", color: "#92400E" }}
            animate={{ backgroundColor: "#D1FAE5", color: "#065F46" }}
            transition={{ delay: 1.6, duration: 0.4 }}
            className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
          >
            <TextSwap from="Pendiente" to="Pagado" delay={1.6} />
          </motion.span>
        </div>
        <p className="mt-1 text-[10px] text-ink/50">
          Stock talla M: <TextSwap from="3" to="2" delay={2.2} />
        </p>
      </motion.div>
      <motion.p {...pop(2.6)} className="mt-auto text-center text-[10px] font-semibold text-jade-600">
        Sin revisar tu banco ✓
      </motion.p>
    </Phone>
  );
}

function TextSwap({ from, to, delay }: { from: string; to: string; delay: number }) {
  const [v, setV] = useState(from);
  useEffect(() => {
    const id = window.setTimeout(() => setV(to), delay * 1000);
    return () => window.clearTimeout(id);
  }, [to, delay]);
  return <span>{v}</span>;
}

function CountUp({ to, delay = 0, duration = 1.2 }: { to: number; delay?: number; duration?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now() + delay * 1000;
    const step = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / (duration * 1000)));
      setV(to * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, delay, duration]);
  return <>{formatBs(v)}</>;
}

function SceneWalletUp({ amount, payer }: { amount: number; payer: Payer }) {
  const before = 420;
  return (
    <Phone>
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Tu billetera</p>
      <div className="mt-6 text-center">
        <p className="font-mono text-xl font-bold text-jade-600">
          <CountUp to={before + amount} delay={0.4} />
        </p>
        <motion.p {...pop(1.6)} className="mt-1 inline-block rounded-full bg-jade-50 px-2 py-0.5 text-[10px] font-bold text-jade-700">
          + {formatBs(amount)}{payer === "comprador" ? " · el 100% de tu precio" : ""}
        </motion.p>
      </div>
      <motion.div {...pop(2.2)} className="mt-auto rounded-lg bg-paper p-2 text-[10px] text-ink/60">
        {payer === "vendedor"
          ? "Elegiste asumir el pago verificado: tu cliente pagó tu precio exacto, sin recargos."
          : "El 1% del pago verificado lo pagó tu cliente. A ti no se te descuenta nada."}
      </motion.div>
    </Phone>
  );
}

function ScenePayoutRequest() {
  return (
    <Phone>
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Tu billetera</p>
      <p className="mt-4 text-center font-mono text-xl font-bold text-jade-600">{formatBs(570)}</p>
      <p className="text-center text-[10px] text-ink/50">4 pedidos sin liquidar</p>
      <div className="relative mt-auto">
        <motion.div
          animate={{ scale: [1, 0.94, 1] }}
          transition={{ delay: 1.2, duration: 0.35 }}
          className="rounded-lg bg-jade-500 py-2 text-center text-[11px] font-bold text-white"
        >
          <TextSwap from="Agendar liquidación" to="¡Agendada! ✓" delay={1.5} />
        </motion.div>
        {/* "Dedo" que toca el botón */}
        <motion.span
          initial={{ opacity: 0, x: 40, y: 40 }}
          animate={{ opacity: [0, 1, 1, 0], x: [40, 0, 0, 0], y: [40, 4, 4, 4] }}
          transition={{ delay: 0.4, duration: 1.6, times: [0, 0.5, 0.7, 1] }}
          className="pointer-events-none absolute right-6 top-1 h-6 w-6 rounded-full border-2 border-white bg-ink/30"
        />
      </div>
    </Phone>
  );
}

const PAYOUT_STEPS = ["Solicitada", "Transferida", "Confirmada"];

function ScenePayoutTracker({ step }: { step: 1 | 3 }) {
  return (
    <div className="w-full max-w-xs rounded-2xl border border-ink/5 bg-white p-4 shadow-lg">
      <p className="font-mono text-lg font-bold text-ink">{formatBs(570)}</p>
      <div className="mt-4">
        <PayoutSteps current={step} animate />
      </div>
      {step === 3 && (
        <motion.div {...pop(1.4)} className="mt-4 rounded-lg bg-jade-50 p-2 text-center text-xs font-bold text-jade-700">
          Liquidación cerrada · el dinero está en tu cuenta
        </motion.div>
      )}
      {step === 1 && (
        <motion.p {...pop(1.2)} className="mt-4 text-center text-xs text-ink/50">
          Normalmente en {PAYOUT_PROCESSING_TIME}
        </motion.p>
      )}
    </div>
  );
}

/**
 * Los tres pasos de una liquidación. `current` = cuántos pasos están hechos
 * (1 = solicitada, 2 = transferida, 3 = confirmada). También se usa en la
 * billetera real (AdminEarnings) para mostrar dónde está cada liquidación.
 */
export function PayoutSteps({ current, animate = false }: { current: number; animate?: boolean }) {
  return (
    <div className="flex items-start">
      {PAYOUT_STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <div className={`h-0.5 flex-1 ${i === 0 ? "opacity-0" : done ? "bg-jade-500" : "bg-ink/10"}`} />
              <motion.span
                initial={animate ? { scale: 0.6, opacity: 0.4 } : false}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: animate ? 0.3 + i * 0.4 : 0 }}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  done ? "bg-jade-500 text-white" : active ? "border-2 border-amber-400 bg-amber-50 text-amber-700" : "bg-ink/5 text-ink/30"
                }`}
              >
                {done ? "✓" : i + 1}
              </motion.span>
              <div className={`h-0.5 flex-1 ${i === PAYOUT_STEPS.length - 1 ? "opacity-0" : i < current - 1 ? "bg-jade-500" : "bg-ink/10"}`} />
            </div>
            <span className={`mt-1.5 text-[11px] font-semibold ${done ? "text-jade-700" : active ? "text-amber-700" : "text-ink/35"}`}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SceneReceipt() {
  return (
    <motion.div
      initial={{ y: 30, opacity: 0, rotate: -3 }}
      animate={{ y: 0, opacity: 1, rotate: -1.5 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 180, damping: 18 }}
      className="w-56 rounded-xl border border-ink/10 bg-white p-4 shadow-xl"
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Comprobante de transferencia</p>
      <div className="mt-3 space-y-1.5 text-[11px]">
        {[
          ["De", "Dcompras"],
          ["Para", "Tu cuenta ••• 4821"],
          ["Monto", formatBs(570)],
          ["Referencia", "LIQ-0042"],
        ].map(([k, v], i) => (
          <motion.div key={k} {...pop(0.6 + i * 0.2)} className="flex justify-between border-b border-dashed border-ink/10 pb-1">
            <span className="text-ink/50">{k}</span>
            <span className="font-semibold text-ink">{v}</span>
          </motion.div>
        ))}
      </div>
      <motion.p {...pop(1.6)} className="mt-3 text-center text-[10px] text-ink/50">
        Compáralo con el movimiento en tu banco
      </motion.p>
    </motion.div>
  );
}

function SceneNoFakes() {
  return (
    <div className="flex items-center gap-5">
      <motion.div {...pop(0.2)} className="relative w-28 rounded-lg border border-ink/10 bg-white p-2 shadow">
        <p className="text-[9px] text-ink/40">captura.jpg</p>
        <div className="mt-1 h-16 rounded bg-ink/5" />
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: -12 }}
          transition={{ delay: 1, type: "spring", stiffness: 260, damping: 14 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="rounded border-2 border-coral-500 bg-white/90 px-2 py-0.5 text-[10px] font-black uppercase text-coral-600">
            No vale
          </span>
        </motion.div>
      </motion.div>
      <motion.div {...pop(1.6)} className="w-32 rounded-lg border-2 border-jade-400 bg-jade-50 p-2 text-center">
        <ShieldGlyph />
        <p className="mt-1 text-[10px] font-bold text-jade-700">Confirmación del banco</p>
      </motion.div>
    </div>
  );
}

function ShieldGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="mx-auto h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" className="text-jade-600" />
      <motion.path
        d="M8.5 12l2.5 2.5 4.5-5"
        className="text-jade-600"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 2, duration: 0.4 }}
      />
    </svg>
  );
}

function SceneAmountCheck({ total }: { total: number }) {
  return (
    <div className="w-full max-w-xs space-y-2">
      <motion.div {...pop(0.2)} className="flex justify-between rounded-xl border border-ink/10 bg-white p-3 text-sm shadow-sm">
        <span className="text-ink/50">Pagó tu cliente</span>
        <span className="font-mono font-bold text-ink">{formatBs(total)}</span>
      </motion.div>
      <motion.div {...pop(0.6)} className="flex justify-between rounded-xl border border-ink/10 bg-white p-3 text-sm shadow-sm">
        <span className="text-ink/50">Monto del pedido</span>
        <span className="font-mono font-bold text-ink">{formatBs(total)}</span>
      </motion.div>
      <motion.div {...pop(1.3)} className="rounded-xl bg-jade-500 p-2.5 text-center text-sm font-bold text-white">
        ✓ Coincide: el pedido pasa a pagado
      </motion.div>
      <motion.p {...pop(2)} className="text-center text-xs text-ink/50">
        Si no coincidiera, el pedido queda en espera y nuestro equipo recibe una alerta.
      </motion.p>
    </div>
  );
}

function SceneLedger() {
  const rows = [
    ["#A1B2", 150, "Pagado"],
    ["#C3D4", 95, "Pagado"],
    ["#E5F6", 210, "Pagado"],
    ["LIQ-0042", 570, "Liquidado"],
  ] as const;
  return (
    <div className="w-full max-w-xs rounded-2xl border border-ink/5 bg-white p-3 shadow-lg">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink/40">Tu historial</p>
      {rows.map(([id, amount, status], i) => (
        <motion.div key={id} {...pop(0.3 + i * 0.35)} className="flex items-center justify-between border-b border-ink/5 py-1.5 text-xs last:border-0">
          <span className="font-semibold text-ink">{id}</span>
          <span className="font-mono text-ink/70">{formatBs(amount)}</span>
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${status === "Liquidado" ? "bg-ink text-white" : "bg-jade-50 text-jade-700"}`}>
            {status}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function SceneLock() {
  return (
    <div className="flex flex-col items-center">
      <motion.svg viewBox="0 0 48 48" className="h-20 w-20 text-ink" fill="none" stroke="currentColor" strokeWidth="3.5">
        <motion.path
          d="M15 22v-6a9 9 0 0 1 18 0v6"
          initial={{ y: -6 }}
          animate={{ y: 0 }}
          transition={{ delay: 1, type: "spring", stiffness: 300, damping: 12 }}
        />
        <rect x="10" y="22" width="28" height="20" rx="3" className="fill-jade-500 stroke-ink" />
        <circle cx="24" cy="32" r="2.5" fill="white" stroke="none" />
      </motion.svg>
      <motion.p {...pop(1.4)} className="mt-3 max-w-[220px] text-center text-sm font-bold text-ink">
        Tú tienes la última palabra
      </motion.p>
      <motion.p {...pop(1.8)} className="max-w-[240px] text-center text-xs text-ink/50">
        «Sí, ya me llegó el dinero» lo tocas tú, nadie más.
      </motion.p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Comparador manual vs automático
// ---------------------------------------------------------------------------

function ManualVsAuto() {
  const [mode, setMode] = useState<"manual" | "auto">("auto");
  const steps =
    mode === "manual"
      ? [
          "Tu cliente paga a tu QR",
          "Te manda una captura por WhatsApp",
          "Abres la app de tu banco",
          "Buscas la transferencia entre todas",
          "Comparas monto y nombre con el pedido",
          "Vuelves al panel y lo marcas «pagado»",
        ]
      : ["Tu cliente paga el QR del pedido", "Listo: el pedido ya está pagado y te avisamos"];

  return (
    <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-bold text-ink">¿Qué cambia para ti?</h3>
      <p className="mt-0.5 text-xs text-ink/50">Lo que haces por cada pedido pagado con QR.</p>
      <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-paper p-1">
        {(["manual", "auto"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-lg py-2 text-xs font-semibold transition ${mode === m ? "bg-white text-ink shadow-sm" : "text-ink/50"}`}
          >
            {m === "manual" ? "Con tu QR (manual)" : "Con QR automático"}
          </button>
        ))}
      </div>
      <div className="mt-4 min-h-[13rem]">
        <AnimatePresence mode="popLayout">
          {steps.map((s, i) => (
            <motion.div
              key={`${mode}-${s}`}
              layout
              initial={{ opacity: 0, x: mode === "auto" ? 16 : -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: i * 0.07 }}
              className="mb-1.5 flex items-center gap-2.5"
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  mode === "auto" ? "bg-jade-500 text-white" : "bg-ink/5 text-ink/50"
                }`}
              >
                {i + 1}
              </span>
              <span className="text-sm text-ink/80">{s}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        <motion.div
          key={`${mode}-sum`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`mt-3 rounded-xl p-3 text-xs ${mode === "auto" ? "bg-jade-50 text-jade-700" : "bg-amber-50 text-amber-800"}`}
        >
          {mode === "auto"
            ? "Tu tiempo va a vender, no a revisar transferencias. Y no hay forma de que te engañen con una captura falsa."
            : "Varios minutos por pedido, y el riesgo de despachar con una captura editada si te olvidas de revisar tu banco."}
        </motion.div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calculadora
// ---------------------------------------------------------------------------

function EarningsCalculator({ commissionPercent, payer }: { commissionPercent: number; payer: Payer }) {
  const [price, setPrice] = useState(150);
  const safe = Number.isFinite(price) && price > 0 ? price : 0;
  const fee = Math.round(safe * commissionPercent) / 100;
  const clientPays = payer === "vendedor" ? safe : safe + fee;
  const youGet = payer === "vendedor" ? Math.round((safe - fee) * 100) / 100 : safe;
  return (
    <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-bold text-ink">¿Cuánto te llega?</h3>
      <label className="mt-3 block text-xs font-medium text-ink/60" htmlFor="calc-price">
        Si tu producto cuesta
      </label>
      <div className="mt-1 flex items-center gap-2 rounded-xl border border-ink/15 px-3 py-2 focus-within:border-jade-400">
        <span className="text-sm text-ink/40">Bs</span>
        <input
          id="calc-price"
          type="number"
          inputMode="decimal"
          min={0}
          value={Number.isFinite(price) ? price : ""}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="w-full bg-transparent font-mono text-lg font-bold text-ink outline-none"
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-paper p-3">
          <p className="text-[11px] text-ink/50">Tu cliente paga</p>
          <p className="font-mono text-base font-bold text-ink">{formatBs(clientPays)}</p>
          <p className="text-[10px] text-ink/40">
            {payer === "vendedor"
              ? "tu precio exacto, sin recargos"
              : `incluye ${formatBs(fee)} de pago verificado (${commissionPercent}%)`}
          </p>
        </div>
        <div className="rounded-xl bg-jade-50 p-3">
          <p className="text-[11px] text-jade-700/70">A ti te llega</p>
          <p className="font-mono text-base font-bold text-jade-700">{formatBs(youGet)}</p>
          <p className="text-[10px] text-jade-700/60">
            {payer === "vendedor" ? `tu precio menos ${formatBs(fee)} (${commissionPercent}%)` : "el 100% de tu precio"}
          </p>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-ink/45">
        Quién paga el pago verificado lo eliges tú en «Datos y cobros». Los pedidos contra entrega o con
        pago coordinado no tienen ningún cargo: esos te llegan directo.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Seguridad y preguntas frecuentes
// ---------------------------------------------------------------------------

function SecurityPoints() {
  const points = [
    { title: "Confirmación directa del banco", text: "El aviso de pago llega firmado digitalmente desde el proveedor de pagos. Una captura de pantalla nunca marca un pedido como pagado." },
    { title: "Monto verificado", text: "Si lo que se pagó no coincide con el pedido, no avanza: queda en espera y nuestro equipo recibe una alerta para revisarlo." },
    { title: "Comprobante en cada liquidación", text: "Cada transferencia que te hacemos viene con su comprobante y número de referencia." },
    { title: "Tu confirmación cierra el ciclo", text: "Una liquidación solo figura como pagada cuando tú confirmas que el dinero te llegó." },
    { title: "Todo queda registrado", text: "Tienes el historial de tus liquidaciones y un reporte de ventas por período para cuadrar con tu banco." },
  ];
  return (
    <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-jade-600">
          <ShieldStatic />
        </span>
        <h3 className="text-sm font-bold text-ink">Cómo cuidamos tu dinero</h3>
      </div>
      <ul className="mt-3 space-y-3">
        {points.map((p, i) => (
          <motion.li
            key={p.title}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: i * 0.06 }}
            className="flex gap-3"
          >
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-jade-500 text-[11px] font-bold text-white">
              ✓
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink">{p.title}</span>
              <span className="block text-xs text-ink/55">{p.text}</span>
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function ShieldStatic() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
      <path d="M8.5 12l2.5 2.5 4.5-5" />
    </svg>
  );
}

function PayoutFaq({ commissionPercent, payer }: { commissionPercent: number; payer: Payer }) {
  const faqs = [
    {
      q: "¿Cuánto me cobra Dcompras?",
      a:
        payer === "vendedor"
          ? `En los pedidos con QR automático, el pago verificado es el ${commissionPercent}% y elegiste asumirlo tú: tu cliente paga tu precio exacto y a ti te llega tu precio menos ese ${commissionPercent}%. Contra entrega o pago coordinado: sin cargo. Puedes cambiarlo en «Datos y cobros».`
          : `Nada a ti. En los pedidos con QR automático, tu cliente paga un ${commissionPercent}% extra por el pago verificado y a ti te llega el 100% de tu precio. Contra entrega o pago coordinado: sin cargo. Puedes cambiarlo en «Datos y cobros».`,
    },
    {
      q: "¿Cuándo puedo pedir mi liquidación?",
      a: "Cuando tengas saldo en tu billetera. Se junta todo lo pendiente en una sola solicitud. Puedes tener una liquidación en camino a la vez: cuando se cierra, ya puedes pedir la siguiente.",
    },
    {
      q: "¿Cuánto tarda en llegarme?",
      a: `Normalmente en ${PAYOUT_PROCESSING_TIME} desde que la agendas. Te avisamos cuando hacemos la transferencia.`,
    },
    {
      q: "¿A dónde me llega el dinero?",
      a: "Al QR que cargaste en «Datos y cobros». Es obligatorio: sin tu QR no puedes agendar una liquidación (tu saldo queda guardado). Revisa que sea el correcto antes de agendar.",
    },
    {
      q: "¿Qué hago si el comprobante no coincide o no me llegó?",
      a: "No confirmes la liquidación. Escríbenos desde «Ayuda» y lo revisamos. Mientras no confirmes, la liquidación sigue abierta.",
    },
    {
      q: "¿Y los pedidos contra entrega o con pago coordinado?",
      a: "Esos los cobras tú directamente, así que no pasan por la billetera ni se liquidan.",
    },
  ];
  return (
    <div className="rounded-2xl border border-ink/5 bg-white px-4 pt-2 shadow-sm">
      <h3 className="pt-2 text-sm font-bold text-ink">Preguntas frecuentes</h3>
      {faqs.map((f) => (
        <Accordion key={f.q} question={f.q} answer={f.a} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Escenas del capítulo "Tu panel" (tutorial de bienvenida)
// ---------------------------------------------------------------------------

function SceneWelcome() {
  return (
    <div className="flex flex-col items-center text-center">
      <motion.div
        initial={{ scale: 0, rotate: -12 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.1 }}
        className="flex h-20 w-20 items-center justify-center rounded-3xl bg-ink shadow-xl"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.png" alt="" className="h-12 w-12 object-contain" />
      </motion.div>
      <motion.p {...pop(0.5)} className="mt-5 font-display text-2xl font-bold text-ink">
        ¡Bienvenido a tu panel!
      </motion.p>
      <motion.div {...pop(0.9)} className="mt-4 flex flex-wrap justify-center gap-2">
        {[
          ["bag", "Vende"],
          ["qr", "Cobra"],
          ["wallet", "Recibe tu dinero"],
        ].map(([icon, label], i) => (
          <motion.span
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 + i * 0.25 }}
            className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm"
          >
            <Icon name={icon as "bag"} className="h-4 w-4" />
            {label}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}

function SceneProducts() {
  return (
    <div className="flex items-center gap-4">
      <Phone>
        <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Productos</p>
        {[
          ["Chamarra café", "Bs 150", "from-amber-400 to-coral-400"],
          ["Vestido negro", "Bs 120", "from-ink to-ink/60"],
          ["Polera básica", "Bs 45", "from-jade-400 to-jade-100"],
        ].map(([name, price, grad], i) => (
          <motion.div key={name} {...pop(0.2 + i * 0.2)} className="mt-2 flex items-center gap-2 rounded-lg border border-ink/10 p-1.5">
            <div className={`h-8 w-8 shrink-0 rounded-md bg-gradient-to-br ${grad}`} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-semibold text-ink">{name}</p>
              <p className="text-[9px] text-ink/50">{price}</p>
            </div>
            {i === 0 && (
              <motion.span
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ delay: 1.4, duration: 0.5 }}
                className="rounded bg-jade-50 px-1 text-[8px] font-bold text-jade-700"
              >
                Historia
              </motion.span>
            )}
          </motion.div>
        ))}
      </Phone>
      <motion.div
        initial={{ opacity: 0, x: -20, rotate: 6 }}
        animate={{ opacity: 1, x: 0, rotate: 3 }}
        transition={{ delay: 1.9, type: "spring", stiffness: 160, damping: 16 }}
        className="hidden h-[220px] w-[124px] flex-col justify-between rounded-2xl bg-gradient-to-b from-[#8B5CF6] to-[#6D28D9] p-3 text-white shadow-xl sm:flex"
      >
        <p className="text-[9px] font-bold">Moda Chapaca</p>
        <div className="h-24 rounded-lg bg-gradient-to-br from-amber-400 to-coral-400" />
        <div>
          <p className="text-[10px] font-bold leading-tight">Chamarra café</p>
          <p className="text-sm font-black">Bs 150</p>
          <p className="mt-1 rounded-full bg-white py-0.5 text-center text-[7px] font-bold text-[#6D28D9]">Pide en dcompras.shop</p>
        </div>
      </motion.div>
    </div>
  );
}

function SceneToCollect() {
  return (
    <Phone>
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Por cobrar</p>
      <motion.div {...pop(0.3)} className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2">
        <p className="text-[10px] font-semibold text-ink">#A1B2 · Ana</p>
        <p className="text-[9px] text-ink/50">Bs 180 · hace 3 h sin pagar</p>
        <motion.div
          animate={{ scale: [1, 0.93, 1] }}
          transition={{ delay: 1.3, duration: 0.3 }}
          className="mt-1.5 rounded bg-green-500 py-1 text-center text-[9px] font-bold text-white"
        >
          <TextSwap from="Recordar por WhatsApp" to="¡Recordatorio enviado!" delay={1.6} />
        </motion.div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.6 }}
        className="mt-3 rounded-lg bg-jade-500 p-2 text-center text-[10px] font-bold text-white"
      >
        ✓ Ana pagó · venta recuperada
      </motion.div>
    </Phone>
  );
}

function SceneCustomers() {
  return (
    <div className="w-full max-w-xs rounded-2xl border border-ink/5 bg-white p-3 shadow-lg">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink/40">Mis clientes</p>
      {[
        ["Ana Rojas", "4 compras · Bs 720", true],
        ["Carla Méndez", "2 compras · Bs 310", false],
        ["Luis Pérez", "1 compra · Bs 95", false],
      ].map(([name, info, top], i) => (
        <motion.div key={String(name)} {...pop(0.3 + i * 0.3)} className="flex items-center justify-between border-b border-ink/5 py-2 last:border-0">
          <div>
            <p className="text-xs font-bold text-ink">
              {name} {top && <span className="ml-1 rounded-full bg-amber-50 px-1.5 text-[9px] text-amber-700">⭐ Top</span>}
            </p>
            <p className="text-[10px] text-ink/50">{info}</p>
          </div>
          <span className="rounded-md border border-ink/15 px-1.5 py-0.5 text-[9px] font-semibold text-ink/60">WhatsApp</span>
        </motion.div>
      ))}
    </div>
  );
}

function SceneUploadQr() {
  return (
    <Phone>
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Datos y cobros</p>
      <p className="mt-2 text-[10px] font-semibold text-ink">Tu QR para recibir tu dinero</p>
      <motion.div
        initial={{ borderColor: "rgba(20,16,42,0.2)" }}
        animate={{ borderColor: "#0EA57A" }}
        transition={{ delay: 1.2 }}
        className="mx-auto mt-3 flex h-28 w-28 items-center justify-center rounded-xl border-2 border-dashed"
      >
        <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.2, type: "spring" }}>
          <QrGlyph size={84} />
        </motion.div>
      </motion.div>
      <motion.p {...pop(2)} className="mt-3 rounded-lg bg-jade-50 py-1.5 text-center text-[10px] font-bold text-jade-700">
        ✓ QR cargado: ya puedes cobrar
      </motion.p>
    </Phone>
  );
}

// "Tú eliges quién paga el 1%": la misma compra vista con cada opción,
// alternando sola, para que se entienda la diferencia sin leer.
function SceneWhoPays({ percent }: { percent: number }) {
  const price = 150;
  const fee = Math.round(price * percent) / 100;
  const [mode, setMode] = useState<"comprador" | "vendedor">("comprador");
  useEffect(() => {
    const a = window.setTimeout(() => setMode("vendedor"), 2600);
    const b = window.setTimeout(() => setMode("comprador"), 5200);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, []);
  const absorbs = mode === "vendedor";
  return (
    <div className="w-full max-w-xs">
      <motion.p {...pop(0.1)} className="mb-2 text-center text-[11px] font-bold uppercase tracking-wider text-ink/40">
        ¿Quién paga el {percent}%?
      </motion.p>
      <motion.div {...pop(0.2)} className="grid grid-cols-2 gap-1 rounded-xl bg-white p-1 shadow-sm">
        {(["comprador", "vendedor"] as const).map((m) => (
          <div key={m} className="relative rounded-lg py-2 text-center text-[11px] font-bold">
            {mode === m && (
              <motion.span layoutId="who-pays" className="absolute inset-0 rounded-lg bg-ink" transition={{ type: "spring", stiffness: 300, damping: 28 }} />
            )}
            <span className={`relative ${mode === m ? "text-white" : "text-ink/50"}`}>
              {m === "comprador" ? "Mi cliente" : "Yo lo asumo"}
            </span>
          </div>
        ))}
      </motion.div>
      <motion.div {...pop(0.4)} className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white p-3 shadow-sm">
          <p className="text-[10px] text-ink/50">Tu cliente paga</p>
          <motion.p key={`c-${mode}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="font-mono text-base font-bold text-ink">
            {formatBs(absorbs ? price : price + fee)}
          </motion.p>
        </div>
        <div className="rounded-xl bg-jade-50 p-3 shadow-sm">
          <p className="text-[10px] text-jade-700/70">A ti te llega</p>
          <motion.p key={`v-${mode}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="font-mono text-base font-bold text-jade-700">
            {formatBs(absorbs ? price - fee : price)}
          </motion.p>
        </div>
      </motion.div>
      <div className="mt-3 flex h-7 items-center justify-center">
        <AnimatePresence mode="wait">
          {absorbs ? (
            <motion.span
              key="badge"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              className="bg-ink px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white"
            >
              Sin recargos
            </motion.span>
          ) : (
            <motion.span key="full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[11px] font-semibold text-jade-700">
              Recibes el 100% de tu precio
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <motion.p {...pop(1)} className="mt-1 text-center text-[10px] text-ink/45">
        Lo eliges en «Datos y cobros»
      </motion.p>
    </div>
  );
}
