// Genera la locución del tutorial del vendedor con una voz neuronal de
// Azure Speech (suena como una persona, no como robot) y la guarda como MP3
// en public/tutorial/voz/. Se corre UNA vez (y de nuevo solo si cambia el
// guion de lib/tutorialScript.ts):
//
//   npm run voice:tutorial                          → voz Sofía (Bolivia)
//   npm run voice:tutorial -- --voz=es-BO-MarceloNeural
//   npm run voice:tutorial -- --rehacer             → regraba todo (otra voz)
//
// Lee de .env.local (nunca se sube a Vercel ni al repo):
//   AZURE_SPEECH_KEY     clave del recurso Speech (Azure Portal → Keys and Endpoint)
//   AZURE_SPEECH_REGION  región del recurso, ej. eastus, brazilsouth
//
// El tutorial usa estos MP3 solo (lib/narration.ts lee lib/tutorialVoice.json);
// las frases sin archivo usan la voz del dispositivo.

import fs from "node:fs";
import path from "node:path";
import { allTutorialLines } from "@/lib/tutorialScript";
import { narrationFileId, toSpeech } from "@/lib/narration";

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "tutorial", "voz");
const MANIFEST = path.join(ROOT, "lib", "tutorialVoice.json");

function loadEnv() {
  const file = path.join(ROOT, ".env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
}

async function synthesize(text: string, voice: string, key: string, region: string): Promise<Buffer> {
  const lang = voice.split("-").slice(0, 2).join("-");
  // Un poco más pausado que el ritmo por defecto: es un tutorial, no un aviso.
  const ssml =
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}">` +
    `<voice name="${voice}"><prosody rate="-6%">${escapeXml(text)}</prosody></voice></speak>`;
  const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-24khz-96kbitrate-mono-mp3",
      "User-Agent": "tutorial-voice-generator",
    },
    body: ssml,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Azure respondió ${res.status} ${res.statusText} ${detail}`.trim());
  }
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  loadEnv();
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) {
    throw new Error("Faltan AZURE_SPEECH_KEY y/o AZURE_SPEECH_REGION en .env.local");
  }
  const voice = arg("voz") || process.env.AZURE_SPEECH_VOICE || "es-BO-SofiaNeural";
  const redo = process.argv.includes("--rehacer");

  // Mismo porcentaje que usa la app (COMMISSION_PERCENT), porque aparece en el guion.
  const { commissionPercent } = await import("@/lib/commission");
  const lines = allTutorialLines(commissionPercent());

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const previous = JSON.parse(fs.readFileSync(MANIFEST, "utf8")) as { voice: string | null; files: string[] };
  const voiceChanged = previous.voice && previous.voice !== voice;

  const files: string[] = [];
  let created = 0;
  for (const line of lines) {
    const id = narrationFileId(line);
    const file = path.join(OUT_DIR, `${id}.mp3`);
    files.push(id);
    if (fs.existsSync(file) && !redo && !voiceChanged) continue;
    process.stdout.write(`  grabando: ${toSpeech(line).slice(0, 70)}…\n`);
    fs.writeFileSync(file, await synthesize(toSpeech(line), voice, key, region));
    created++;
  }

  // Borra grabaciones de frases que ya no están en el guion.
  for (const f of fs.readdirSync(OUT_DIR)) {
    if (f.endsWith(".mp3") && !files.includes(f.replace(/\.mp3$/, ""))) fs.unlinkSync(path.join(OUT_DIR, f));
  }

  fs.writeFileSync(MANIFEST, JSON.stringify({ voice, files: files.sort() }, null, 2) + "\n");
  console.log(`Listo: ${lines.length} frases con la voz ${voice} (${created} grabadas ahora).`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
