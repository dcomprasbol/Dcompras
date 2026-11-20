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

// ---------- Subida de fotos (cliente) ----------
// Convierte un File a un data URL ya redimensionado, para no guardar fotos
// de celular gigantes en la base (product images, QR de cobro, comprobantes
// de liquidación — todo se guarda como data URI directo en Postgres, no hay
// bucket de storage configurado). Solo se usa desde componentes "use client".
const MAX_IMAGE_DIMENSION = 1024;
const IMAGE_QUALITY = 0.82;

// Cuántas fotos puede tener un producto (ver AdminProducts, ProductGallery).
export const MAX_PRODUCT_IMAGES = 5;

// ---------- Liquidaciones ----------
// Plazo que se le PROMETE al vendedor en la guía de la billetera
// (PaymentsGuide). Es un compromiso con el vendedor: cambiarlo acá solo si
// el equipo de plataforma de verdad puede cumplirlo.
export const PAYOUT_PROCESSING_TIME = "1 a 2 días hábiles";

// ---------- Fotos en Supabase Storage ----------
// lib/storage.ts (servidor) sube cada foto como `<carpeta>/<uuid>.jpg` y su
// miniatura como `<carpeta>/<uuid>_thumb.jpg` en el bucket público "media".
// Viven acá (y no en lib/storage.ts) porque los componentes de cliente
// también necesitan armar la URL de la miniatura.
export const STORAGE_BUCKET = "media";
export const THUMB_SUFFIX = "_thumb";

/**
 * URL de la miniatura (640 px) de una foto subida a Storage, para listados y
 * tarjetas. Si la foto no vino de nuestro Storage (data URL viejo, URL
 * externa) devuelve la misma URL: la tarjeta se ve igual, solo pesa más.
 */
export function thumbUrl<T extends string | null | undefined>(url: T): T | string {
  if (typeof url !== "string") return url;
  if (!url.includes(`/storage/v1/object/public/${STORAGE_BUCKET}/`)) return url;
  if (new RegExp(`${THUMB_SUFFIX}\\.jpg(\\?.*)?$`, "i").test(url)) return url;
  return url.replace(/\.(jpg|png)(\?.*)?$/i, `${THUMB_SUFFIX}.jpg$2`);
}

export function fileToResizedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("El archivo no es una imagen válida"));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > MAX_IMAGE_DIMENSION) {
          height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
          width = MAX_IMAGE_DIMENSION;
        } else if (height > MAX_IMAGE_DIMENSION) {
          width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
          height = MAX_IMAGE_DIMENSION;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Tu navegador no soporta procesar imágenes"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", IMAGE_QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const ORDER_STATUSES = [
  { value: "pendiente", label: "Pendiente" },
  { value: "pagado", label: "Pagado" },
  { value: "en_preparacion", label: "En preparación" },
  { value: "enviado", label: "Enviado" },
  { value: "entregado", label: "Entregado" },
] as const;

// "recibido" no es un botón que el vendedor pueda tocar en su panel: solo lo
// pone el propio comprador al confirmar que le llegó (ver
// ConfirmReceivedButton), así que vive aparte de ORDER_STATUSES.
const EXTRA_STATUS_LABELS: Record<string, string> = {
  recibido: "Recibido",
};

export function statusLabel(value: string): string {
  return ORDER_STATUSES.find((s) => s.value === value)?.label ?? EXTRA_STATUS_LABELS[value] ?? value;
}

export const STORE_STATUSES = [
  { value: "pendiente", label: "Pendiente de revisión" },
  { value: "aprobada", label: "Aprobada" },
  { value: "rechazada", label: "Rechazada" },
  // Moderación (Fase 4): a diferencia de "rechazada" (una tienda nueva que
  // nunca llegó a operar), "suspendida" es una tienda que YA estaba
  // aprobada y el admin le corta el acceso público por reportes/incumplir
  // los Términos — ver ReportsPanel. El storefront público ya la esconde
  // solo (app/[slug]/layout.tsx exige status === 'aprobada').
  { value: "suspendida", label: "Suspendida" },
  // Eliminada por el admin de plataforma (ver softDeleteStore) — nunca se
  // borra de verdad, solo se esconde y queda visible para el admin por un
  // tiempo por temas contables.
  { value: "eliminada", label: "Eliminada" },
] as const;

export function storeStatusLabel(value: string): string {
  return STORE_STATUSES.find((s) => s.value === value)?.label ?? value;
}

// Motivos de reporte (Fase 4): dos familias — sobre el PRODUCTO/vendedor
// (se reporta desde la ficha del producto) o sobre UN PEDIDO puntual (se
// reporta desde su seguimiento). Ver ReportButton y /api/stores/[slug]/reports.
export const PRODUCT_REPORT_REASONS = [
  { value: "ilegal", label: "Es un producto ilegal o prohibido" },
  { value: "sospechoso", label: "Este vendedor me parece sospechoso" },
  { value: "otro", label: "Otro motivo" },
] as const;

export const ORDER_REPORT_REASONS = [
  { value: "no_llego", label: "Mi pedido no llegó" },
  { value: "defectuoso", label: "Llegó defectuoso o incompleto" },
  { value: "otro", label: "Otro motivo" },
] as const;

const ALL_REPORT_REASONS = [...PRODUCT_REPORT_REASONS, ...ORDER_REPORT_REASONS];

export function reportReasonLabel(value: string): string {
  return ALL_REPORT_REASONS.find((r) => r.value === value)?.label ?? value;
}

export const DELIVERY_TYPES = [
  { value: "domicilio", label: "Entrega a domicilio", icon: "home" },
  { value: "punto_encuentro", label: "Punto de encuentro", icon: "meet" },
  // Punto Dcompras (lib/pickup.ts): el checkout solo lo ofrece si hay algún
  // punto activo.
  { value: "punto_dcompras", label: "Retiro en Punto Dcompras", icon: "pin" },
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

// Encuesta al cerrar la tienda (lo ve el admin en Reportes → Tiendas
// eliminadas). "otro" exige escribir el motivo.
export const SELLER_CLOSE_REASONS = [
  { value: "pocas_ventas", label: "No vendí lo suficiente" },
  { value: "dificil", label: "Me resultó difícil de usar" },
  { value: "costos", label: "Las comisiones o los costos" },
  { value: "otra_plataforma", label: "Me cambio a otra plataforma" },
  { value: "cierre_negocio", label: "Cerré mi negocio o ya no vendo" },
  { value: "problemas_tecnicos", label: "Tuve problemas técnicos" },
  { value: "otro", label: "Otro motivo" },
] as const;

export function closeReasonLabel(value: string | null): string {
  return SELLER_CLOSE_REASONS.find((r) => r.value === value)?.label ?? "Sin motivo";
}

// Frase que el vendedor escribe dos veces para confirmar que cierra su tienda.
export const SELLER_CLOSE_PHRASE = "eliminar cuenta";

// Slugs que no puede tomar una tienda porque son rutas de la app (las
// tiendas viven en /[slug] y una ruta fija siempre le gana). Al crear una
// tienda con uno de estos nombres se le agrega un sufijo (ver
// app/api/stores/route.ts).
export const RESERVED_SLUGS = new Set([
  "admin", "api", "auth", "categoria", "crear-tienda", "login", "mis-pedidos", "plataforma",
  "privacidad", "punto", "terminos", "tiendas", "monitoring", "logo", "icon", "_next",
]);
