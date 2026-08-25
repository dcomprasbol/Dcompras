export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function formatBs(amount: number): string {
  return `Bs ${amount.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const ORDER_STATUSES = [
  { value: "pendiente", label: "Pendiente" },
  { value: "pagado", label: "Pagado" },
  { value: "en_preparacion", label: "En preparación" },
  { value: "enviado", label: "Enviado" },
  { value: "entregado", label: "Entregado" },
] as const;

export function statusLabel(value: string): string {
  return ORDER_STATUSES.find((s) => s.value === value)?.label ?? value;
}

export const STORE_STATUSES = [
  { value: "pendiente", label: "Pendiente de revisión" },
  { value: "aprobada", label: "Aprobada" },
  { value: "rechazada", label: "Rechazada" },
] as const;

export function storeStatusLabel(value: string): string {
  return STORE_STATUSES.find((s) => s.value === value)?.label ?? value;
}

export const DELIVERY_TYPES = [
  { value: "domicilio", label: "Entrega a domicilio", icon: "🏠" },
  { value: "punto_encuentro", label: "Punto de encuentro", icon: "🤝" },
] as const;

export function deliveryTypeLabel(value: string): string {
  return DELIVERY_TYPES.find((d) => d.value === value)?.label ?? value;
}

export const BANK_ACCOUNT_TYPES = [
  { value: "ahorro", label: "Caja de ahorro" },
  { value: "corriente", label: "Cuenta corriente" },
] as const;

// Los 9 departamentos de Bolivia. Reemplaza al campo de ciudad libre para
// que sea consistente entre tiendas (filtros, estadísticas de plataforma,
// etc.) en vez de texto suelto ("Santa Cruz" vs "santa cruz" vs "SCZ").
export const BOLIVIA_DEPARTMENTS = [
  "La Paz",
  "Santa Cruz",
  "Cochabamba",
  "Oruro",
  "Potosí",
  "Chuquisaca",
  "Tarija",
  "Beni",
  "Pando",
] as const;

// ---------- Personalización de tienda ----------

export const STORE_CATEGORIES = [
  { value: "ropa", label: "Ropa" },
  { value: "joyeria", label: "Joyería y accesorios" },
  { value: "electronicos", label: "Electrónicos" },
  { value: "belleza", label: "Belleza y cuidado personal" },
  { value: "hogar", label: "Hogar y decoración" },
  { value: "comida", label: "Comida y bebidas" },
  { value: "otros", label: "Otros" },
] as const;

export function categoryLabel(value: string | null): string {
  return STORE_CATEGORIES.find((c) => c.value === value)?.label ?? "Otros";
}

// Arranque de "esta semana" (lunes 00:00 UTC) para el ranking de tiendas por
// categoría (ver /categoria/[category] y lib/repo.ts →
// listStoresByCategoryRanked). Se resetea cada lunes a propósito: así el
// ranking siempre tiene incentivo activo en vez de quedar dominado para
// siempre por las primeras tiendas que se unieron.
export function startOfWeekISO(): string {
  const now = new Date();
  const day = now.getUTCDay(); // 0=domingo, 1=lunes, ...
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMonday)
  );
  return monday.toISOString();
}

// Tipografías que puede elegir cada tienda para su catálogo público. Todas
// ya están auto-hospedadas (@fontsource) o son fuentes del sistema, así que
// elegir una no agrega ninguna carga extra ni depende de Google Fonts.
export const STORE_FONTS = [
  { value: "inter", label: "Moderna", stack: '"Inter", sans-serif' },
  { value: "space-grotesk", label: "Bold / llamativa", stack: '"Space Grotesk", sans-serif' },
  { value: "plex-mono", label: "Técnica", stack: '"IBM Plex Mono", monospace' },
  { value: "serif", label: "Elegante", stack: 'Georgia, "Times New Roman", serif' },
] as const;

export function fontStack(value: string | null): string {
  return STORE_FONTS.find((f) => f.value === value)?.stack ?? STORE_FONTS[0].stack;
}

export const DEFAULT_STORE_COLOR = "#0EA57A";

export function isValidHexColor(value: string): boolean {
  return /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(value);
}
