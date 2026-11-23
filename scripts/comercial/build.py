"""Arma el comercial vertical de Dcompras (720x1280, 30 fps) con ffmpeg.

Escenas: clip de stock (Mixkit, licencia Free) + capa gráfica PNG + locución.
Uso: python build.py <ffmpeg.exe> <carpeta de trabajo> <carpeta de clips> <musica.mp3>
"""
import subprocess
import sys
from pathlib import Path

FF, WORK, CLIPS, MUSIC = sys.argv[1], Path(sys.argv[2]), Path(sys.argv[3]), sys.argv[4]
OV, VO, SEG = WORK / "ov", WORK / "vo", WORK / "seg"
SEG.mkdir(exist_ok=True)

# (clip, inicio en el clip, duración, capa, locución, horizontal?, fondo desenfocado?)
SCENES = [
    ("43270", 1.0, 3.6, "o1", "s1", False, False),
    ("4915", 3.0, 5.0, "o2", "s2", True, False),
    ("42123", 8.0, 4.2, "o3", "s3", True, True),
    ("42123", 2.0, 4.4, "o4", "s4", True, True),
    ("41174", 0.8, 3.8, "o5", "s5", False, False),
    ("42137", 3.0, 2.4, "o6", "s6", False, False),
    ("42130", 2.0, 2.4, "o7", "s7", True, False),
    (None, 0.0, 4.2, "o8", "s8", False, False),  # cierre de marca
]


def run(args):
    r = subprocess.run([FF, "-y", "-hide_banner", "-loglevel", "error", *args], capture_output=True, text=True)
    if r.returncode != 0:
        raise SystemExit(r.stderr)


segments = []
for i, (clip, start, dur, ov, _vo, horizontal, blurred) in enumerate(SCENES, 1):
    out = SEG / f"seg{i}.mp4"
    # Zoom lento hacia adentro durante la escena (6%), recorte centrado a 9:16.
    push = f"scale=w='trunc(720*(1+0.06*t/{dur})/2)*2':h=-2:eval=frame,crop=720:1280"
    # El texto entra deslizándose desde abajo y apareciendo.
    over = (
        "[1:v]format=rgba,fade=t=in:st=0.12:d=0.35:alpha=1[ov];"
        "[bg][ov]overlay=x=0:y='if(lt(t,0.5),70*(1-t/0.5),0)':shortest=1,format=yuv420p[v]"
    )
    if clip is None:
        args = [
            "-loop", "1", "-t", str(dur), "-i", str(OV / f"{ov}.png"),
            "-filter_complex",
            f"[0:v]fps=30,scale=720:1280,{push},fade=t=in:st=0:d=0.4,format=yuv420p[v]",
        ]
    else:
        fit = "scale=-2:1280,crop=720:1280" if horizontal else "scale=720:1280"
        extra = ",boxblur=18:2,eq=brightness=-0.18:saturation=0.8" if blurred else ""
        args = [
            "-ss", str(start), "-t", str(dur), "-i", str(CLIPS / f"{clip}.mp4"),
            "-loop", "1", "-t", str(dur), "-i", str(OV / f"{ov}.png"),
            "-filter_complex", f"[0:v]fps=30,{fit}{extra},{push}[bg];{over}",
        ]
    run([*args, "-map", "[v]", "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-r", "30", str(out)])
    segments.append((out, dur))
    print(f"escena {i} lista ({dur}s)")

# Une las escenas (mismo códec y tamaño: concat sin recodificar).
lst = SEG / "list.txt"
lst.write_text("".join(f"file '{p.as_posix()}'\n" for p, _ in segments))
video = WORK / "video.mp4"
run(["-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(video)])

# Audio: cada frase entra 0,25 s después del corte de su escena; la música
# va de fondo bajita, con entrada y salida suaves.
total = sum(d for _, d in segments)
inputs, filters, labels, t = [], [], [], 0.0
for i, (scene, (_, dur)) in enumerate(zip(SCENES, segments)):
    inputs += ["-i", str(VO / f"{scene[4]}.mp3")]
    ms = int((t + 0.25) * 1000)
    filters.append(f"[{i}:a]adelay={ms}|{ms},volume=1.35[a{i}]")
    labels.append(f"[a{i}]")
    t += dur
m = len(SCENES)
inputs += ["-i", MUSIC]
filters.append(
    f"[{m}:a]atrim=0:{total},asetpts=N/SR/TB,volume=0.20,afade=t=in:st=0:d=0.6,afade=t=out:st={total-1.6}:d=1.6[mus]"
)
filters.append(f"{''.join(labels)}[mus]amix=inputs={m+1}:normalize=0:dropout_transition=0,alimiter=limit=0.95,aformat=sample_rates=44100:channel_layouts=stereo[aout]")
audio = WORK / "audio.m4a"
run([*inputs, "-filter_complex", ";".join(filters), "-map", "[aout]", "-t", str(total), "-c:a", "aac", "-b:a", "128k", str(audio)])

final = WORK / "comercial-dcompras.mp4"
run(["-i", str(video), "-i", str(audio), "-c:v", "copy", "-c:a", "copy", "-shortest", "-movflags", "+faststart", str(final)])
# Imagen de portada (fotograma de la escena 3: el celular con la tienda).
run(["-ss", "9.6", "-i", str(final), "-frames:v", "1", "-q:v", "3", str(WORK / "comercial-portada.jpg")])
print(f"listo: {final} ({total:.1f}s)")
