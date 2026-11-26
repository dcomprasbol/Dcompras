"""Arma los anuncios verticales de Dcompras (720x1280, 30 fps) con ffmpeg.

Dos anuncios de unos 20 segundos:
  - vendedor:  "¿Vendes por redes?"  (cómo funciona para quien vende)
  - comprador: "¿Te gustó algo en redes?" (cómo funciona para quien compra)

Cada escena = toma de video (stock de Mixkit con licencia Free, o grabación
propia) + gráficos animados (escenas.mjs) + frase de la voz + efectos.
La duración de cada escena se ajusta sola al largo de su frase, así que se
puede cambiar la voz (por ejemplo, por una de ElevenLabs) sin tocar nada más.

Voz: usa vo-nueva/<anuncio>/s1.mp3 … s7.mp3 si existen; si no, vo/<anuncio>/.

Uso:
  python anuncios.py --ffmpeg <ffmpeg.exe> --clips <carpeta de tomas> \
      --music <carpeta con 1167.mp3 y 744.mp3> --work <carpeta temporal> \
      [--anuncio vendedor|comprador|todos] [--salida public/video]
  Variable PLAYWRIGHT_CORE=<ruta> si playwright-core no está en node_modules.
"""
import argparse
import json
import re
import shutil
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
PROJECT = HERE.parent.parent

# Tomas: (clip, segundo de inicio, fracción de la escena, encuadre)
#   encuadre: "v" = clip vertical; "h:0.5" = clip horizontal recortado a 9:16
#   (el número es la posición del recorte, 0 = izquierda, 1 = derecha);
#   "+blur" = fondo desenfocado (para escenas con el celular dibujado encima).
# sfx: (sonido, segundo dentro de la escena); "fin" = escena de cierre.
ADS = {
    "vendedor": {
        "music": "1167.mp3",
        "scenes": [
            {"key": "v1", "parts": [("43270", 1.0, 1, "v")], "sfx": [("whoosh", 0), ("pop", 0.1), ("pop", 0.32), ("pop", 0.54), ("pop", 0.76)]},
            {"key": "v2", "parts": [("4915", 3.0, 1, "h:0.5")], "sfx": [("whoosh", 0), ("pop", 0.15), ("swipe", "0.4d")]},
            {"key": "v3", "parts": [("42123", 8.0, 1, "h:0.5+blur")], "sfx": [("whoosh", 0), ("pop", 0.4), ("pop", 0.6)]},
            {"key": "v4", "parts": [("42123", 2.0, 1, "h:0.5+blur")], "sfx": [("whoosh", 0), ("chime", "0.62d")]},
            {"key": "v5", "parts": [("41174", 0.8, 1, "v")], "sfx": [("whoosh", 0), ("chime", 0.25)]},
            {"key": "v6", "parts": [("42137", 3.0, 0.5, "v"), ("42130", 1.6, 0.5, "h:0.4")], "sfx": [("whoosh", 0), ("whoosh", "0.5d")]},
            {"key": "v7", "parts": [], "sfx": [("whoosh", 0), ("pop", 1.1)], "fin": True},
        ],
    },
    "comprador": {
        "music": "744.mp3",
        "scenes": [
            {"key": "c1", "parts": [("42123", 1.0, 1, "h:0")], "sfx": [("whoosh", 0), ("pop", 1.0)]},
            {"key": "c2", "parts": [("4915", 8.0, 1, "h:0.5")], "sfx": [("whoosh", 0), ("pop", 0.15), ("tick", 0.6), ("pop", "0.55d")]},
            {"key": "c3", "parts": [("42136", 2.0, 1, "v+blur")], "sfx": [("whoosh", 0), ("pop", "0.42d")]},
            {"key": "c4", "parts": [("42133", 3.0, 1, "v+blur")], "sfx": [("whoosh", 0), ("chime", "0.62d")]},
            {"key": "c5", "parts": [("43270", 3.5, 1, "v")], "sfx": [("whoosh", 0), ("swipe", "0.22d"), ("chime", "0.45d")]},
            {"key": "c6", "parts": [("31136", 1.0, 0.5, "h:0.45"), ("42130", 3.6, 0.5, "h:0.5")], "sfx": [("whoosh", 0), ("tick", 0.15), ("tick", "0.25d"), ("tick", "0.45d"), ("whoosh", "0.5d"), ("chime", "0.68d")]},
            {"key": "c7", "parts": [], "sfx": [("whoosh", 0), ("pop", 1.1)], "fin": True},
        ],
    },
}

VO_DELAY = 0.18  # la frase entra un poquito después del corte
VO_TAIL = 0.42   # aire después de la frase antes del siguiente corte
MIN_SCENE = 2.2
FPS = 30

# Efectos de sonido sintetizados (sin archivos de terceros).
SFX = {
    "whoosh": "anoisesrc=d=0.45:c=pink:a=0.6,highpass=f=500,lowpass=f=5000,afade=t=in:d=0.18,afade=t=out:st=0.2:d=0.25,volume=0.55",
    "swipe": "anoisesrc=d=0.25:c=white:a=0.4,bandpass=f=2500:w=1800,afade=t=in:d=0.05,afade=t=out:st=0.08:d=0.17,volume=0.5",
    "pop": "aevalsrc='0.7*sin(2*PI*(500+1800*t)*t)*exp(-38*t)':d=0.14:s=44100",
    "tick": "aevalsrc='0.5*sin(2*PI*1500*t)*exp(-60*t)':d=0.08:s=44100",
    "chime": "aevalsrc='0.45*sin(2*PI*1318.5*t)*exp(-5*t)+0.4*gte(t,0.11)*sin(2*PI*1975.5*(t-0.11))*exp(-5*(t-0.11))':d=1.0:s=44100",
}


def run(ff, args):
    r = subprocess.run([ff, "-y", "-hide_banner", "-loglevel", "error", *args], capture_output=True, text=True)
    if r.returncode != 0:
        raise SystemExit(f"ffmpeg falló:\n{r.stderr}")


def duration(ff, f):
    out = subprocess.run([ff, "-i", str(f)], capture_output=True, text=True).stderr
    h, m, s = re.search(r"Duration: (\d+):(\d+):([\d.]+)", out).groups()
    return int(h) * 3600 + int(m) * 60 + float(s)


def at(value, dur):
    """'0.5d' = mitad de la escena; un número = segundos."""
    return float(value[:-1]) * dur if isinstance(value, str) else float(value)


def build(ad_name, args):
    ff = args.ffmpeg
    ad = ADS[ad_name]
    work = Path(args.work) / ad_name
    seg_dir = work / "seg"
    seg_dir.mkdir(parents=True, exist_ok=True)

    vo_new = HERE / "vo-nueva" / ad_name
    vo_dir = vo_new if (vo_new / "s1.mp3").exists() else HERE / "vo" / ad_name
    print(f"[{ad_name}] voz: {vo_dir}")

    scenes = []
    for i, sc in enumerate(ad["scenes"], 1):
        vo = vo_dir / f"s{i}.mp3"
        vo_len = duration(ff, vo)
        dur = round(max(MIN_SCENE, VO_DELAY + vo_len + VO_TAIL + (0.6 if sc.get("fin") else 0)) * FPS) / FPS
        scenes.append({**sc, "vo": vo, "dur": dur})

    video = work / "video.mp4"
    # --solo-audio: reusa el video ya armado y rehace solo el sonido (sirve
    # para probar otra mezcla sin volver a filmar los gráficos).
    skip_video = args.solo_audio and video.exists()

    # 1) Gráficos animados, cuadro por cuadro.
    timeline = work / "timeline.json"
    timeline.write_text(json.dumps({"scenes": [{"key": s["key"], "dur": s["dur"]} for s in scenes]}))
    frames_dir = work / "frames"
    if args.escenas:  # volver a dibujar solo algunas escenas (las demás se reusan)
        only = set(args.escenas.split(","))
        timeline.write_text(json.dumps({"scenes": [{"key": s["key"], "dur": s["dur"]} for s in scenes if s["key"] in only]}))
    if not skip_video:
        subprocess.run(["node", str(HERE / "escenas.mjs"), str(timeline), str(frames_dir), str(PROJECT)], check=True)

    # 2) Cada escena: tomas recortadas + zoom lento + destello al cortar + gráficos.
    segments = []
    for i, sc in enumerate([] if skip_video else scenes, 1):
        dur, out = sc["dur"], seg_dir / f"seg{i}.mp4"
        inputs, chains, labels = [], [], []
        if sc.get("fin"):
            inputs += ["-f", "lavfi", "-t", str(dur), "-i", f"color=c=0x14102A:s=720x1280:r={FPS}"]
            chains.append("[0:v]null[bg]")
        else:
            for j, (clip, start, frac, fit) in enumerate(sc["parts"]):
                part_len = dur * frac
                inputs += ["-ss", str(start), "-t", f"{part_len:.3f}", "-i", str(Path(args.clips) / f"{clip}.mp4")]
                blur = "+blur" in fit
                fit = fit.replace("+blur", "")
                if fit.startswith("h"):
                    pos = float(fit.split(":")[1]) if ":" in fit else 0.5
                    crop = f"scale=-2:1280,crop=720:1280:(iw-720)*{pos}:0"
                else:
                    crop = "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280"
                extra = ",boxblur=20:2,eq=brightness=-0.2:saturation=0.75" if blur else ""
                zoom = f"scale=w='trunc(720*(1+0.07*t/{part_len:.3f})/2)*2':h=-2:eval=frame,crop=720:1280"
                flash = ",fade=t=in:st=0:d=0.14:color=white"
                chains.append(f"[{j}:v]fps={FPS},{crop}{extra},{zoom},setsar=1{flash},trim=duration={part_len:.3f},setpts=PTS-STARTPTS[p{j}]")
                labels.append(f"[p{j}]")
            chains.append(f"{''.join(labels)}concat=n={len(labels)}:v=1:a=0[bg]" if len(labels) > 1 else f"{labels[0]}null[bg]")
        n = sum(1 for a in inputs if a == "-i")
        inputs += ["-framerate", str(FPS), "-i", str(frames_dir / sc["key"] / "%04d.png")]
        chains.append(f"[bg][{n}:v]overlay=0:0:shortest=0:eof_action=pass,format=yuv420p,trim=duration={dur:.3f}[v]")
        run(ff, [*inputs, "-filter_complex", ";".join(chains), "-map", "[v]", "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-r", str(FPS), str(out)])
        segments.append(out)
        print(f"[{ad_name}] escena {i} ({sc['key']}) lista: {dur:.2f}s")

    if not skip_video:
        lst = seg_dir / "list.txt"
        lst.write_text("".join(f"file '{p.as_posix()}'\n" for p in segments))
        run(ff, ["-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(video)])

    # 3) Audio: voz + efectos; la música baja sola cuando habla la voz.
    total = duration(ff, video)  # suma real de las escenas armadas
    sfx_dir = work / "sfx"
    sfx_dir.mkdir(exist_ok=True)
    for name, expr in SFX.items():
        run(ff, ["-f", "lavfi", "-i", expr, "-ar", "44100", "-ac", "1", str(sfx_dir / f"{name}.wav")])

    inputs, filters, vo_labels, fx_labels = [], [], [], []
    t = 0.0
    idx = 0
    for sc in scenes:
        ms = int((t + VO_DELAY) * 1000)
        inputs += ["-i", str(sc["vo"])]
        filters.append(f"[{idx}:a]aformat=sample_rates=44100:channel_layouts=mono,adelay={ms},volume=1.5[vo{idx}]")
        vo_labels.append(f"[vo{idx}]")
        idx += 1
        for name, when in sc["sfx"]:
            ms = int((t + at(when, sc["dur"])) * 1000)
            inputs += ["-i", str(sfx_dir / f"{name}.wav")]
            filters.append(f"[{idx}:a]adelay={ms}[fx{idx}]")
            fx_labels.append(f"[fx{idx}]")
            idx += 1
        t += sc["dur"]
    inputs += ["-i", str(Path(args.music) / ad["music"])]
    m = idx
    filters.append(f"{''.join(vo_labels)}amix=inputs={len(vo_labels)}:normalize=0:dropout_transition=0,apad,asplit=2[voice][key]")
    filters.append(f"{''.join(fx_labels)}amix=inputs={len(fx_labels)}:normalize=0:dropout_transition=0,volume=0.8,apad[fx]")
    filters.append(
        f"[{m}:a]aformat=sample_rates=44100:channel_layouts=mono,atrim=0:{total:.3f},asetpts=N/SR/TB,volume=0.55,"
        f"afade=t=in:st=0:d=0.3,afade=t=out:st={total - 1.2:.3f}:d=1.2[mus]"
    )
    filters.append("[mus][key]sidechaincompress=threshold=0.03:ratio=8:attack=15:release=350:makeup=1[duck]")
    filters.append("[voice][duck][fx]amix=inputs=3:normalize=0:dropout_transition=0,alimiter=limit=0.95,aformat=sample_rates=44100:channel_layouts=stereo[aout]")
    audio = work / "audio.m4a"
    run(ff, [*inputs, "-filter_complex", ";".join(filters), "-map", "[aout]", "-t", f"{total:.3f}", "-c:a", "aac", "-b:a", "160k", str(audio)])

    out_dir = Path(args.salida)
    out_dir.mkdir(parents=True, exist_ok=True)
    final = out_dir / f"anuncio-{ad_name}.mp4"
    run(ff, ["-i", str(video), "-i", str(audio), "-c:v", "copy", "-c:a", "copy", "-shortest", "-movflags", "+faststart", str(final)])
    # Portada: un fotograma con el celular de la tienda (escena 3).
    poster_t = sum(s["dur"] for s in scenes[:2]) + scenes[2]["dur"] * 0.7
    run(ff, ["-ss", f"{poster_t:.2f}", "-i", str(final), "-frames:v", "1", "-q:v", "3", str(out_dir / f"anuncio-{ad_name}.jpg")])
    print(f"[{ad_name}] listo: {final} ({total:.1f}s)")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--ffmpeg", required=True)
    p.add_argument("--clips", required=True)
    p.add_argument("--music", required=True)
    p.add_argument("--work", required=True)
    p.add_argument("--anuncio", default="todos", choices=["vendedor", "comprador", "todos"])
    p.add_argument("--salida", default=str(PROJECT / "public" / "video"))
    p.add_argument("--escenas", help="dibuja de nuevo solo estas escenas, p. ej. c1,c6 (las demás se reusan)")
    p.add_argument("--solo-audio", action="store_true", help="reusa el video ya armado y rehace solo el sonido")
    a = p.parse_args()
    for name in (ADS if a.anuncio == "todos" else [a.anuncio]):
        build(name, a)
