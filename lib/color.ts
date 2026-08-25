// Utilidades de contraste para que el color de marca que elige cada
// vendedor (lib/utils.ts → STORE_CATEGORIES/DEFAULT_STORE_COLOR) siempre se
// pueda leer, sea cual sea el color: un amarillo o celeste pastel como texto
// plano sobre blanco es ilegible, y texto blanco sobre un botón de ese mismo
// pastel también. Se resuelve una sola vez por request en
// app/[slug]/layout.tsx y se expone como variables CSS.

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16) || 0;
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex([r, g, b]: RGB): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0"))
      .join("")
  );
}

function srgbToLinear(c: number): number {
  const cs = c / 255;
  return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
}

function relativeLuminance([r, g, b]: RGB): number {
  const [rl, gl, bl] = [r, g, b].map(srgbToLinear);
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function contrastRatio(a: RGB, b: RGB): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const WHITE: RGB = [255, 255, 255];
const INK: RGB = [20, 16, 42]; // #14102A, la tinta de la marca

/**
 * Versión del color de marca segura para usar como texto sobre fondo claro
 * (precios, links, eyebrows). Si el color elegido es muy claro (amarillos,
 * celestes pastel...) lo va oscureciendo hasta un contraste legible (4.5:1),
 * manteniendo el tono. Colores ya oscuros vuelven sin cambios.
 */
export function readableAccentText(hex: string): string {
  let rgb = hexToRgb(hex);
  let steps = 0;
  while (contrastRatio(rgb, WHITE) < 4.5 && steps < 24) {
    rgb = rgb.map((c) => c * 0.92) as RGB;
    steps++;
  }
  return rgbToHex(rgb);
}

/**
 * Blanco o tinta oscura — el que mejor contraste dé como texto ENCIMA de un
 * fondo pintado con el color de marca real (botones, badges), sin alterar
 * ese color de fondo.
 */
export function readableOnAccent(hex: string): "#FFFFFF" | "#14102A" {
  const rgb = hexToRgb(hex);
  return contrastRatio(rgb, WHITE) >= contrastRatio(rgb, INK) ? "#FFFFFF" : "#14102A";
}
