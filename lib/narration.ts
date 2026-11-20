// Narración por voz del tutorial del vendedor (solo navegador).
//
// Dos fuentes, en este orden:
//  1. Locución grabada (MP3, voz neuronal de Azure): cada frase del guion
//     (lib/tutorialScript.ts) tiene su archivo en public/tutorial/voz/<id>.mp3,
//     donde <id> sale del propio texto (narrationFileId). La lista de los que
//     existen está en lib/tutorialVoice.json; ambos los genera
//     `npm run voice:tutorial` (scripts/generate-tutorial-voice.ts).
//  2. Voz del dispositivo (Web Speech API): si no hay MP3 o falla, se usa la
//     mejor voz en español disponible. En Edge/Windows y en la mayoría de los
//     celulares hay voces neuronales que suenan naturales.
// Si no hay ninguna, el tutorial sigue con subtítulos y su ritmo normal.

import voiceManifest from "@/lib/tutorialVoice.json";

const AUDIO_BASE = "/tutorial/voz";
const RECORDED = new Set<string>((voiceManifest as { files: string[] }).files);

/** Hay locución grabada para al menos una frase. */
export function hasRecordedVoice(): boolean {
  return RECORDED.size > 0;
}

/**
 * Nombre del MP3 de una frase: hash corto del texto que se lee en voz alta.
 * Si el texto cambia, cambia el nombre: así nunca suena una grabación vieja.
 */
export function narrationFileId(caption: string): string {
  const text = toSpeech(caption);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${h.toString(36)}-${text.length.toString(36)}`;
}

// Preferimos español latinoamericano (más cercano a Bolivia) y voces
// neuronales ("Natural"/"Neural"/"Online"/"Google") antes que las clásicas.
const LANG_PRIORITY = ["es-BO", "es-419", "es-MX", "es-US", "es-AR", "es-CO", "es-PE", "es-CL", "es-ES"];

let cachedVoice: SpeechSynthesisVoice | null | undefined;

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

function scoreVoice(v: SpeechSynthesisVoice): number {
  if (!v.lang.toLowerCase().startsWith("es")) return -1;
  let score = 0;
  const langIdx = LANG_PRIORITY.findIndex((l) => v.lang.toLowerCase() === l.toLowerCase());
  score += langIdx === -1 ? 1 : (LANG_PRIORITY.length - langIdx) * 2;
  if (/natural|neural|online|premium|enhanced/i.test(v.name)) score += 40;
  if (/google/i.test(v.name)) score += 25;
  // Voces femeninas comunes en español suenan más claras en tutoriales.
  if (/dalia|paulina|elena|sabina|camila|lupe|salome|elvira|helena/i.test(v.name)) score += 3;
  return score;
}

export function pickSpanishVoice(): SpeechSynthesisVoice | null {
  if (!speechSupported()) return null;
  if (cachedVoice !== undefined && cachedVoice !== null) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null; // todavía cargando (ver warmUpVoices)
  const best = voices
    .map((v) => ({ v, s: scoreVoice(v) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => b.s - a.s)[0];
  cachedVoice = best?.v ?? null;
  return cachedVoice;
}

/** Las voces cargan asíncronas en Chrome/Edge: esto las precarga. */
export function warmUpVoices(): void {
  if (!speechSupported()) return;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener?.("voiceschanged", () => {
    cachedVoice = undefined;
    pickSpanishVoice();
  });
}

/** Texto de subtítulo → texto para leer en voz alta. */
export function toSpeech(caption: string): string {
  return caption
    .replace(/Bs\s?([\d.]+(?:,\d+)?)/g, "$1 bolivianos")
    .replace(/(\d+(?:,\d+)?)\s?%/g, "$1 por ciento")
    .replace(/[«»"]/g, "")
    .replace(/\s·\s/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}

let currentAudio: HTMLAudioElement | null = null;

export function stopNarration(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (speechSupported()) window.speechSynthesis.cancel();
}

/**
 * Narra una escena. Llama a `onEnd` cuando termina (o enseguida si no hay
 * cómo narrar). Devuelve una función para cancelar.
 */
export function narrate(sceneId: string, caption: string, onEnd: () => void): () => void {
  stopNarration();
  let cancelled = false;
  const done = () => {
    if (!cancelled) onEnd();
  };

  let spoke = false;
  const speak = () => {
    // onerror y play().catch pueden llegar los dos: hablar una sola vez.
    if (cancelled || spoke) return;
    spoke = true;
    if (!speechSupported()) return done();
    const u = new SpeechSynthesisUtterance(toSpeech(caption));
    const voice = pickSpanishVoice();
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    } else {
      u.lang = "es-419";
    }
    u.rate = 1;
    u.pitch = 1;
    u.onend = done;
    u.onerror = done;
    window.speechSynthesis.speak(u);
  };

  const fileId = narrationFileId(caption);
  if (RECORDED.has(fileId)) {
    const audio = new Audio(`${AUDIO_BASE}/${fileId}.mp3`);
    currentAudio = audio;
    audio.onended = done;
    audio.onerror = speak; // sin archivo para esta escena: voz del dispositivo
    audio.play().catch(speak);
  } else {
    speak();
  }

  return () => {
    cancelled = true;
    stopNarration();
  };
}
