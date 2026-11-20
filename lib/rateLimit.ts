// Límite de intentos para los endpoints públicos (sin login): búsqueda de
// pedidos por teléfono, checkout, reportes, "avísame", etc. Sin esto
// cualquiera podía, por ejemplo, probar miles de teléfonos en
// /orders/lookup o llenar una tienda de pedidos falsos.
//
// Ventana fija con un contador en Postgres (tabla rate_limits, ver lib/db.ts)
// en vez de un servicio externo (Upstash/Redis): una query por request,
// sin otra cuenta que mantener. Si algún día el tráfico lo pide, se cambia
// solo este archivo.
//
// Si la base falla al contar, se deja pasar el request (fail-open): es
// preferible no frenar una compra real por un problema del limitador.

import crypto from "crypto";
import { NextResponse } from "next/server";
import { sql, dbReady } from "@/lib/db";

export type RateLimitRule = {
  /** Nombre del endpoint, forma parte de la llave (ej. "orders-lookup"). */
  name: string;
  /** Intentos permitidos por ventana. */
  limit: number;
  /** Largo de la ventana en segundos. */
  windowSec: number;
};

// Reglas centralizadas para poder ajustarlas en un solo lugar.
export const RATE_LIMITS = {
  ordersLookup: { name: "orders-lookup", limit: 10, windowSec: 10 * 60 },
  checkout: { name: "checkout", limit: 15, windowSec: 10 * 60 },
  confirmReceived: { name: "confirm-received", limit: 20, windowSec: 10 * 60 },
  report: { name: "report", limit: 5, windowSec: 60 * 60 },
  stockNotify: { name: "stock-notify", limit: 10, windowSec: 60 * 60 },
  geo: { name: "geo", limit: 30, windowSec: 60 },
  createStore: { name: "create-store", limit: 5, windowSec: 60 * 60 },
  paymentReceipt: { name: "payment-receipt", limit: 6, windowSec: 60 * 60 },
} satisfies Record<string, RateLimitRule>;

/** IP del cliente. En Vercel la primera de x-forwarded-for es la real. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/** Inicio de la ventana fija que contiene `nowMs`. */
export function windowStart(nowMs: number, windowSec: number): Date {
  const size = windowSec * 1000;
  return new Date(Math.floor(nowMs / size) * size);
}

// No guardamos IPs ni teléfonos en claro: solo un hash corto.
export function hashKey(parts: string[]): string {
  return crypto.createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 32);
}

export type RateLimitResult = { allowed: boolean; remaining: number; retryAfterSec: number };

export async function checkRateLimit(
  rule: RateLimitRule,
  identity: string[],
  nowMs = Date.now()
): Promise<RateLimitResult> {
  const start = windowStart(nowMs, rule.windowSec);
  const retryAfterSec = Math.max(1, Math.ceil((start.getTime() + rule.windowSec * 1000 - nowMs) / 1000));
  const key = `${rule.name}:${hashKey(identity)}`;
  try {
    await dbReady;
    const [row] = await sql<{ count: number }[]>`
      INSERT INTO rate_limits (key, window_start, count)
      VALUES (${key}, ${start}, 1)
      ON CONFLICT (key, window_start) DO UPDATE SET count = rate_limits.count + 1
      RETURNING count
    `;
    // Limpieza perezosa: ~1 de cada 50 requests borra ventanas de hace más
    // de un día, sin esperar el resultado.
    if (Math.random() < 0.02) {
      sql`DELETE FROM rate_limits WHERE window_start < now() - interval '1 day'`.catch(() => {});
    }
    const count = row?.count ?? 1;
    return { allowed: count <= rule.limit, remaining: Math.max(0, rule.limit - count), retryAfterSec };
  } catch (err) {
    console.error(`rateLimit(${rule.name}) falló, se deja pasar:`, err);
    return { allowed: true, remaining: rule.limit, retryAfterSec: 0 };
  }
}

/**
 * Para usar al principio de una ruta API:
 *   const limited = await rateLimit(req, RATE_LIMITS.checkout);
 *   if (limited) return limited;
 * Devuelve una respuesta 429 si se pasó del límite, o null si puede seguir.
 * `extra` suma partes a la llave (ej. el slug de la tienda).
 */
export async function rateLimit(
  req: Request,
  rule: RateLimitRule,
  extra: string[] = []
): Promise<NextResponse | null> {
  const result = await checkRateLimit(rule, [clientIp(req.headers), ...extra]);
  if (result.allowed) return null;
  const minutes = Math.ceil(result.retryAfterSec / 60);
  return NextResponse.json(
    {
      error:
        minutes > 1
          ? `Demasiados intentos. Espera ${minutes} minutos y vuelve a probar.`
          : "Demasiados intentos. Espera un momento y vuelve a probar.",
    },
    { status: 429, headers: { "Retry-After": String(result.retryAfterSec) } }
  );
}
