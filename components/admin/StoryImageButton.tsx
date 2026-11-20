"use client";

// "Crear historia": arma en el navegador una imagen vertical 1080×1920 del
// producto (foto, nombre, precio, marca de la tienda y el link) lista para
// subir a historias de Instagram, TikTok o estados de WhatsApp. En el
// celular abre el menú de compartir; en la compu la descarga.
//
// Cada historia lleva "dcompras.shop/<tienda>": publicidad gratis para el
// vendedor y para Dcompras.

import { useState } from "react";
import Icon from "@/components/Icon";
import { formatBs } from "@/lib/utils";

export type StoryStore = { name: string; slug: string; themeColor: string; logoUrl: string | null };
export type StoryProduct = { id: string; name: string; price: number; compareAtPrice: number | null; imageUrl: string | null };

const W = 1080;
const H = 1920;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    // Las fotos de Storage permiten CORS; sin esto el canvas quedaría
    // "contaminado" y no se podría exportar.
    if (!src.startsWith("data:")) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = test;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && words.join(" ") !== lines.join(" ")) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, "") + "…";
  }
  return lines;
}

/** Texto oscuro o claro según el color de fondo (contraste simple por luminancia). */
function readableOn(hex: string): string {
  const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return "#ffffff";
  const [r, g, b] = m.slice(1).map((v) => parseInt(v, 16) / 255);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.6 ? "#14102A" : "#FFFFFF";
}

export async function renderStory(product: StoryProduct, store: StoryStore, host: string): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const font = getComputedStyle(document.body).fontFamily || "sans-serif";
  const accent = /^#[0-9a-f]{6}$/i.test(store.themeColor) ? store.themeColor : "#0EA57A";
  const onAccent = readableOn(accent);

  // Fondo: color de la tienda con un brillo suave arriba.
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.2, H * 0.1, 50, W * 0.2, H * 0.1, W);
  glow.addColorStop(0, "rgba(255,255,255,0.28)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Marca de la tienda arriba.
  let headerX = 90;
  if (store.logoUrl) {
    const logo = await loadImage(store.logoUrl);
    if (logo) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(90 + 55, 150, 55, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.clip();
      drawCover(ctx, logo, 90, 95, 110, 110);
      ctx.restore();
      headerX = 230;
    }
  }
  ctx.fillStyle = onAccent;
  ctx.font = `700 52px ${font}`;
  ctx.textBaseline = "middle";
  ctx.fillText(wrapLines(ctx, store.name, W - headerX - 90, 1)[0] ?? store.name, headerX, 150);

  // Foto del producto en una tarjeta blanca.
  const cardX = 90;
  const cardY = 270;
  const cardW = W - 180;
  const cardH = 1080;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 24;
  roundRect(ctx, cardX, cardY, cardW, cardH, 48);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();
  const photo = product.imageUrl ? await loadImage(product.imageUrl) : null;
  ctx.save();
  roundRect(ctx, cardX + 24, cardY + 24, cardW - 48, cardH - 48, 32);
  ctx.clip();
  if (photo) {
    drawCover(ctx, photo, cardX + 24, cardY + 24, cardW - 48, cardH - 48);
  } else {
    ctx.fillStyle = "#F4F3EF";
    ctx.fillRect(cardX + 24, cardY + 24, cardW - 48, cardH - 48);
  }
  ctx.restore();

  // Etiqueta de oferta.
  const onSale = product.compareAtPrice != null && product.compareAtPrice > product.price;
  if (onSale) {
    const pct = Math.round((1 - product.price / product.compareAtPrice!) * 100);
    ctx.fillStyle = "#E8365A";
    roundRect(ctx, cardX + 60, cardY + 60, 230, 90, 45);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = `800 48px ${font}`;
    ctx.textAlign = "center";
    ctx.fillText(`-${pct}%`, cardX + 175, cardY + 106);
    ctx.textAlign = "left";
  }

  // Nombre y precio.
  ctx.fillStyle = onAccent;
  ctx.font = `800 76px ${font}`;
  ctx.textBaseline = "alphabetic";
  const nameLines = wrapLines(ctx, product.name, W - 180, 2);
  nameLines.forEach((line, i) => ctx.fillText(line, 90, 1470 + i * 88));
  const priceY = 1470 + nameLines.length * 88 + 40;
  ctx.font = `800 96px ${font}`;
  ctx.fillText(formatBs(product.price), 90, priceY);
  if (onSale) {
    const priceW = ctx.measureText(formatBs(product.price)).width;
    ctx.font = `500 52px ${font}`;
    ctx.globalAlpha = 0.7;
    const old = formatBs(product.compareAtPrice!);
    const oldX = 90 + priceW + 36;
    ctx.fillText(old, oldX, priceY);
    const oldW = ctx.measureText(old).width;
    ctx.fillRect(oldX, priceY - 18, oldW, 5);
    ctx.globalAlpha = 1;
  }

  // Botón con el link de la tienda.
  const linkText = `Pide en ${host}/${store.slug}`;
  ctx.font = `700 46px ${font}`;
  const btnW = Math.min(W - 180, ctx.measureText(linkText).width + 120);
  ctx.fillStyle = onAccent;
  roundRect(ctx, (W - btnW) / 2, 1740, btnW, 110, 55);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(linkText, W / 2, 1796, W - 220);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo crear la imagen"))), "image/png")
  );
}

export default function StoryImageButton({ product, store }: { product: StoryProduct; store: StoryStore | null }) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (!store) return;
    setBusy(true);
    try {
      const blob = await renderStory(product, store, window.location.host);
      const fileName = `historia-${product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}.png`;
      const file = new File([blob], fileName, { type: "image/png" });
      // Celular: menú nativo de compartir (Instagram, WhatsApp, etc.).
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: product.name });
          return;
        } catch (err: any) {
          if (err?.name === "AbortError") return;
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch {
      window.alert("No se pudo crear la imagen. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy || !store}
      className="text-xs font-medium text-jade-600 hover:text-jade-700 disabled:opacity-50"
      title="Imagen vertical lista para historias de Instagram, TikTok o estados de WhatsApp"
    >
      <Icon name="spark" className="mr-1 h-3.5 w-3.5" />
      {busy ? "Creando..." : "Historia"}
    </button>
  );
}
