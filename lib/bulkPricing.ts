// Edición de precios en lote (puro: lo usan la API y los tests).
//
// Operaciones:
//  - pct_up / pct_down: subir o bajar un %       (ej. +8% por el dólar)
//  - add / sub:          sumar o restar Bs fijos
//  - set:                poner el mismo precio a todos
//  - offer:              poner en oferta: el precio actual pasa a "antes" y
//                        el nuevo precio es X% menos
//  - remove_offer:       quitar la oferta (vuelve al precio de antes)
//
// Redondeo, para que nadie venda a Bs 162,36:
//  - none:    a centavos
//  - integer: al entero más cercano          162,36 → 162
//  - end9:    al número terminado en 9 más cercano  162,36 → 159 · 165 → 169
//             (el más cercano y no "siempre hacia arriba": hacia arriba, un
//             producto de Bs 20 podía saltar a 29, +45%)
//  - end0:    a la decena más cercana        162,36 → 160

export type BulkOp = "pct_up" | "pct_down" | "add" | "sub" | "set" | "offer" | "remove_offer";
export type Rounding = "none" | "integer" | "end9" | "end0";

export const BULK_OPS: { value: BulkOp; label: string; needsValue: boolean; unit: "%" | "Bs" | null }[] = [
  { value: "pct_up", label: "Subir un porcentaje", needsValue: true, unit: "%" },
  { value: "pct_down", label: "Bajar un porcentaje", needsValue: true, unit: "%" },
  { value: "add", label: "Sumar un monto", needsValue: true, unit: "Bs" },
  { value: "sub", label: "Restar un monto", needsValue: true, unit: "Bs" },
  { value: "set", label: "Poner el mismo precio", needsValue: true, unit: "Bs" },
  { value: "offer", label: "Poner en oferta (% de descuento)", needsValue: true, unit: "%" },
  { value: "remove_offer", label: "Quitar la oferta", needsValue: false, unit: null },
];

export const ROUNDINGS: { value: Rounding; label: string }[] = [
  { value: "none", label: "Sin redondear" },
  { value: "integer", label: "Al entero (Bs 162)" },
  { value: "end9", label: "Terminado en 9 (Bs 159, 169…)" },
  { value: "end0", label: "A la decena (Bs 160)" },
];

export function isBulkOp(v: unknown): v is BulkOp {
  return BULK_OPS.some((o) => o.value === v);
}
export function isRounding(v: unknown): v is Rounding {
  return ROUNDINGS.some((r) => r.value === v);
}

export function roundPrice(price: number, rounding: Rounding): number {
  switch (rounding) {
    case "integer":
      return Math.round(price);
    case "end9": {
      const candidate = Math.round((price - 9) / 10) * 10 + 9;
      return Math.max(9, candidate);
    }
    case "end0":
      return Math.round(price / 10) * 10;
    default:
      return Math.round(price * 100) / 100;
  }
}

export type PriceState = { price: number; compareAtPrice: number | null };

/**
 * Nuevo precio (y precio "antes" de oferta) de un producto. Devuelve null si
 * la operación no aplica a ese producto (ej. quitar oferta a uno sin oferta)
 * o daría un precio inválido (≤ 0).
 */
export function applyBulkOp(
  current: PriceState,
  op: BulkOp,
  value: number,
  rounding: Rounding
): PriceState | null {
  const hasOffer = current.compareAtPrice != null && current.compareAtPrice > current.price;

  if (op === "remove_offer") {
    if (!hasOffer) return null;
    return { price: current.compareAtPrice!, compareAtPrice: null };
  }

  if (op === "offer") {
    if (!(value > 0 && value < 100)) return null;
    // Si ya estaba en oferta, el descuento se calcula sobre el precio "antes".
    const base = hasOffer ? current.compareAtPrice! : current.price;
    const price = roundPrice(base * (1 - value / 100), rounding);
    if (price <= 0 || price >= base) return null;
    return { price, compareAtPrice: base };
  }

  const transform = (p: number): number => {
    switch (op) {
      case "pct_up":
        return p * (1 + value / 100);
      case "pct_down":
        return p * (1 - value / 100);
      case "add":
        return p + value;
      case "sub":
        return p - value;
      case "set":
        return value;
    }
  };

  const price = roundPrice(transform(current.price), rounding);
  if (!(price > 0)) return null;

  // Si estaba en oferta, el precio "antes" se mueve igual (así el descuento
  // se mantiene). Con "poner el mismo precio" la oferta se quita: un precio
  // fijo para todos no tiene un "antes" que tenga sentido.
  let compareAtPrice: number | null = null;
  if (hasOffer && op !== "set") {
    const moved = roundPrice(transform(current.compareAtPrice!), rounding);
    compareAtPrice = moved > price ? moved : null;
  }
  if (price === current.price && compareAtPrice === current.compareAtPrice) return null;
  return { price, compareAtPrice };
}

export function describeBulkOp(op: BulkOp, value: number, rounding: Rounding): string {
  const label = ROUNDINGS.find((x) => x.value === rounding)!.label;
  const r = rounding === "none" ? "" : `, ${label.charAt(0).toLowerCase()}${label.slice(1)}`;
  switch (op) {
    case "pct_up":
      return `+${value}%${r}`;
    case "pct_down":
      return `−${value}%${r}`;
    case "add":
      return `+Bs ${value}${r}`;
    case "sub":
      return `−Bs ${value}${r}`;
    case "set":
      return `Precio Bs ${value}${r}`;
    case "offer":
      return `Oferta −${value}%${r}`;
    case "remove_offer":
      return "Quitar oferta";
  }
}
