// Migra las fotos que todavía están como data URL (base64) dentro de
// Postgres a Supabase Storage — mismo formato que lib/storage.ts: foto +
// miniatura "_thumb" en el bucket público "media". Pensado para correrse
// UNA vez después de desplegar lib/storage.ts (las fotos nuevas ya se suben
// solas a Storage).
//
//   node scripts/migrate-images-to-storage.mjs            → solo cuenta, no cambia nada
//   node scripts/migrate-images-to-storage.mjs --apply    → sube y actualiza la base
//
// Lee DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY de
// .env.local (o del entorno). Es idempotente: solo toca valores que todavía
// empiezan con "data:", así que si se corta se puede volver a correr.
// Los comprobantes de liquidación (payouts.receipt_image_url) se dejan en la
// base a propósito: contienen datos bancarios y no deben ir a un bucket público.

import fs from "node:fs";
import crypto from "node:crypto";
import postgres from "postgres";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const BUCKET = "media";
const DATA_URL_RE = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i;

function loadEnvFile(path) {
  if (!fs.existsSync(path)) return;
  for (const line of fs.readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnvFile(".env.local");

const { DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!DATABASE_URL) throw new Error("Falta DATABASE_URL");
if (APPLY && (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)) {
  throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
}

const sql = postgres(DATABASE_URL, { ssl: "require", prepare: false, max: 2 });
const supabase = APPLY
  ? createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;

async function ensureBucket() {
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (data) return;
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 6 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/webp", "image/png"],
  });
  if (error && !/already exists/i.test(error.message)) throw error;
}

async function upload(dataUrl, folder) {
  const match = dataUrl.match(DATA_URL_RE);
  if (!match) throw new Error("data URL inválido");
  const input = Buffer.from(match[2], "base64");
  const isQr = folder === "payment-qr";
  const base = sharp(input).rotate();
  const full = isQr
    ? await base.clone().png().toBuffer()
    : await base.clone().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  const thumb = await base.clone().resize({ width: 640, withoutEnlargement: true }).jpeg({ quality: 74, mozjpeg: true }).toBuffer();
  const id = crypto.randomUUID();
  const ext = isQr ? "png" : "jpg";
  const opts = { cacheControl: "31536000", upsert: false };
  const a = await supabase.storage.from(BUCKET).upload(`${folder}/${id}.${ext}`, full, { ...opts, contentType: isQr ? "image/png" : "image/jpeg" });
  if (a.error) throw a.error;
  const b = await supabase.storage.from(BUCKET).upload(`${folder}/${id}_thumb.jpg`, thumb, { ...opts, contentType: "image/jpeg" });
  if (b.error) throw b.error;
  return supabase.storage.from(BUCKET).getPublicUrl(`${folder}/${id}.${ext}`).data.publicUrl;
}

const stats = { logos: 0, qrs: 0, products: 0, photos: 0, errors: 0 };

async function main() {
  if (APPLY) await ensureBucket();

  // Tiendas: logo y QR de cobro. Solo traemos ids primero para no cargar
  // todos los base64 en memoria de una.
  const storeIds = await sql`
    SELECT id FROM stores WHERE logo_url LIKE 'data:%' OR payment_qr_image_url LIKE 'data:%'
  `;
  for (const { id } of storeIds) {
    const [s] = await sql`SELECT logo_url, payment_qr_image_url FROM stores WHERE id = ${id}`;
    try {
      if (s.logo_url?.startsWith("data:")) {
        stats.logos++;
        if (APPLY) {
          const url = await upload(s.logo_url, "logos");
          await sql`UPDATE stores SET logo_url = ${url} WHERE id = ${id} AND logo_url = ${s.logo_url}`;
        }
      }
      if (s.payment_qr_image_url?.startsWith("data:")) {
        stats.qrs++;
        if (APPLY) {
          const url = await upload(s.payment_qr_image_url, "payment-qr");
          await sql`UPDATE stores SET payment_qr_image_url = ${url} WHERE id = ${id} AND payment_qr_image_url = ${s.payment_qr_image_url}`;
        }
      }
    } catch (err) {
      stats.errors++;
      console.error(`Tienda ${id}:`, err.message ?? err);
    }
  }

  // Productos: la galería (images jsonb) y la portada (image_url = images[0]).
  const productIds = await sql`
    SELECT id FROM products WHERE image_url LIKE 'data:%' OR images::text LIKE '%"data:%'
  `;
  for (const { id } of productIds) {
    const [p] = await sql`SELECT image_url, images FROM products WHERE id = ${id}`;
    try {
      stats.products++;
      const gallery = Array.isArray(p.images) && p.images.length > 0 ? p.images : p.image_url ? [p.image_url] : [];
      const pending = gallery.filter((v) => typeof v === "string" && v.startsWith("data:")).length;
      stats.photos += pending;
      if (!APPLY) continue;
      const next = [];
      for (const v of gallery) next.push(typeof v === "string" && v.startsWith("data:") ? await upload(v, "products") : v);
      await sql`
        UPDATE products SET images = ${sql.json(next)}, image_url = ${next[0] ?? null}
        WHERE id = ${id}
      `;
    } catch (err) {
      stats.errors++;
      console.error(`Producto ${id}:`, err.message ?? err);
    }
    if (APPLY && stats.products % 10 === 0) console.log(`  ...${stats.products}/${productIds.length} productos`);
  }

  console.log(APPLY ? "Migración terminada:" : "Simulación (no se cambió nada; usa --apply para migrar):");
  console.log(`  Logos: ${stats.logos}`);
  console.log(`  QR de cobro: ${stats.qrs}`);
  console.log(`  Productos: ${stats.products} (${stats.photos} fotos)`);
  if (stats.errors) console.log(`  Errores: ${stats.errors} (ver arriba; se puede volver a correr)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
