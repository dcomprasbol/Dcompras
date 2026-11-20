// Fotos en Supabase Storage en vez de base64 dentro de Postgres.
//
// Antes cada foto (producto, logo, QR de cobro) viajaba como data URL
// (~180 KB) y se guardaba tal cual en la base: cada `SELECT * FROM products`
// arrastraba megas de texto, la base crecía sin control y los catálogos
// cargaban lento con datos móviles. Ahora el cliente sigue mandando el data
// URL igual que siempre (lib/utils.ts → fileToResizedDataUrl, sin cambios en
// los formularios) y es lib/repo.ts el que, antes de guardar, pasa cada
// valor por `persistImage`: si es un data URL lo sube al bucket público
// "media" — la foto completa y una miniatura de THUMB_WIDTH px — y guarda
// solo la URL pública. URLs http que ya existen pasan sin tocar.
//
// Requiere en el entorno (solo servidor, NUNCA con prefijo NEXT_PUBLIC_):
//   SUPABASE_SERVICE_ROLE_KEY — Project Settings → API → service_role
// Sin esa variable `persistImage` devuelve el data URL tal cual y todo sigue
// funcionando como antes (útil en local); en producción tiene que estar.
//
// Las miniaturas viven al lado de la foto con el sufijo "_thumb" — ver
// thumbUrl en lib/utils.ts, que arma esa URL sin tener que guardarla.

import sharp from "sharp";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { STORAGE_BUCKET, THUMB_SUFFIX } from "@/lib/utils";

const FULL_MAX_DIMENSION = 1600;
const THUMB_WIDTH = 640;
const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;
const ALLOWED_MIME = /^image\/(jpeg|jpg|png|webp|gif|avif)$/i;
const DATA_URL_RE = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i;

export type ImageFolder = "products" | "logos" | "payment-qr" | "pickup";

/** Error con un mensaje apto para mostrarle al vendedor (foto inválida, muy pesada, etc.). */
export class ImageError extends Error {}

/** Para las rutas API: ImageError → 400 con su mensaje; cualquier otro error se relanza. */
export function imageErrorResponse(err: unknown): Response {
  if (err instanceof ImageError) return Response.json({ error: err.message }, { status: 400 });
  throw err;
}

let client: SupabaseClient | null = null;
let bucketReady: Promise<void> | null = null;

export function isStorageConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function getClient(): SupabaseClient {
  if (!client) {
    client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

// Crea el bucket la primera vez (público: las fotos de catálogo las ve
// cualquiera, igual que antes por /api/img/product). Si ya existe, nada.
function ensureBucket(): Promise<void> {
  if (!bucketReady) {
    bucketReady = (async () => {
      const supabase = getClient();
      const { data } = await supabase.storage.getBucket(STORAGE_BUCKET);
      if (data) return;
      const { error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: true,
        fileSizeLimit: MAX_UPLOAD_BYTES,
        allowedMimeTypes: ["image/jpeg", "image/webp", "image/png"],
      });
      if (error && !/already exists/i.test(error.message)) throw error;
    })().catch((err) => {
      bucketReady = null; // reintentar en la próxima subida
      throw err;
    });
  }
  return bucketReady;
}

export function isDataUrl(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("data:");
}

/**
 * Sube una imagen en data URL a Storage (foto + miniatura) y devuelve su URL
 * pública. Cualquier otro valor (URL http, null, "") vuelve sin cambios.
 * Tira error si el data URL no es una imagen válida o pesa demasiado.
 */
export async function persistImage<T extends string | null | undefined>(
  value: T,
  folder: ImageFolder
): Promise<T | string> {
  if (!isDataUrl(value)) return value;
  if (!isStorageConfigured()) return value;

  const match = value.match(DATA_URL_RE);
  if (!match || !ALLOWED_MIME.test(match[1])) throw new ImageError("La imagen no tiene un formato válido");
  const input = Buffer.from(match[2], "base64");
  if (input.length > MAX_UPLOAD_BYTES) throw new ImageError("La imagen es demasiado pesada (máximo 6 MB)");

  // El QR de cobro tiene que escanearse: PNG sin pérdida y sin achicar.
  const isQr = folder === "payment-qr";
  let full: Buffer;
  let thumb: Buffer;
  try {
    const base = sharp(input, { failOn: "error" }).rotate();
    full = isQr
      ? await base.clone().png().toBuffer()
      : await base
          .clone()
          .resize({ width: FULL_MAX_DIMENSION, height: FULL_MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 82, mozjpeg: true })
          .toBuffer();
    thumb = await base
      .clone()
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: 74, mozjpeg: true })
      .toBuffer();
  } catch {
    throw new ImageError("No pudimos leer la imagen. Prueba con otra foto (JPG o PNG).");
  }

  const ext = isQr ? "png" : "jpg";
  const id = crypto.randomUUID();
  const path = `${folder}/${id}.${ext}`;
  const thumbPath = `${folder}/${id}${THUMB_SUFFIX}.jpg`;

  await ensureBucket();
  const supabase = getClient();
  const upload = (p: string, body: Buffer, contentType: string) =>
    supabase.storage.from(STORAGE_BUCKET).upload(p, body, {
      contentType,
      // El nombre es un UUID nuevo por subida: el archivo nunca cambia.
      cacheControl: "31536000",
      upsert: false,
    });

  const [a, b] = await Promise.all([
    upload(path, full, isQr ? "image/png" : "image/jpeg"),
    upload(thumbPath, thumb, "image/jpeg"),
  ]);
  if (a.error) throw new Error(`No se pudo guardar la imagen: ${a.error.message}`);
  if (b.error) throw new Error(`No se pudo guardar la miniatura: ${b.error.message}`);

  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function persistImages(values: string[], folder: ImageFolder): Promise<string[]> {
  return Promise.all(values.map((v) => persistImage(v, folder) as Promise<string>));
}
