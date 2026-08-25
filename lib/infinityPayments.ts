// Cliente para Infinity Payments (proveedor de cobro por QR contratado en
// reemplazo de BISA/SIP mientras no tengamos esas credenciales — ver
// lib/sip.ts, que queda intacto y sin usar por ahora). Ver
// "Infinity Payments API - Documentación de Integración" para el detalle.
//
// Mientras INFINITY_API_KEY no esté seteada, el checkout sigue usando el QR
// estático (foto subida a mano) sin ningún cambio — ver
// app/api/stores/[slug]/orders/route.ts.

import crypto from "crypto";

// El proveedor movió su API de api.infinityeventapp.com a
// apipayments.deviajeapp.com (mismo dueño, mismas credenciales) — pero en el
// dominio nuevo los endpoints viven bajo /api (probado a mano: /payments/create
// da 404, /api/payments/create da 200), así que el prefijo va en la base y
// el resto de las rutas de este archivo queda sin tocar. Se puede pisar con
// INFINITY_BASE_URL si vuelve a cambiar.
const INFINITY_BASE_URL = process.env.INFINITY_BASE_URL || "https://apipayments.deviajeapp.com/api";
const INFINITY_API_KEY = process.env.INFINITY_API_KEY;
const INFINITY_WEBHOOK_SECRET = process.env.INFINITY_WEBHOOK_SECRET;

export function isInfinityConfigured(): boolean {
  return Boolean(INFINITY_API_KEY);
}

// La clave "ik_live_..." mueve dinero real; "ik_test_..." es de sandbox (y
// ahí es donde vive /simulate-payment, que marca pagos como pagados sin que
// pase plata real — no la llamamos nunca desde este archivo, es solo para
// pruebas manuales tuyas contra sandbox). Si por error queda una key de
// sandbox en el checkout real, mejor frenar que dejar pasar pedidos "pagados"
// que nadie pagó de verdad.
export function isLiveMode(): boolean {
  return Boolean(INFINITY_API_KEY?.startsWith("ik_live_"));
}

export class InfinityError extends Error {}

type InfinityPaymentData = {
  orderId: string;
  status: "pending" | "paid" | "expired" | "cancelled" | "failed";
  amount: number;
  currency?: string;
  checkoutUrl?: string;
  qrImageBase64?: string;
};

type InfinityEnvelope<T> = { success: boolean; data?: T; error?: string; message?: string };

async function request<T>(path: string, init: RequestInit): Promise<T> {
  if (!INFINITY_API_KEY) {
    throw new InfinityError("Infinity Payments no está configurado (falta INFINITY_API_KEY)");
  }
  const res = await fetch(`${INFINITY_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${INFINITY_API_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const data = (await res.json().catch(() => ({}))) as InfinityEnvelope<T>;
  if (!res.ok || !data.success) {
    throw new InfinityError(data.error || data.message || `Infinity Payments respondió ${res.status}`);
  }
  return data.data as T;
}

export async function createPayment(params: {
  amount: number;
  currency: "BOB" | "USD";
  description: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}): Promise<InfinityPaymentData> {
  return request<InfinityPaymentData>("/payments/create", {
    method: "POST",
    body: JSON.stringify({
      amount: Number(params.amount.toFixed(2)),
      currency: params.currency,
      description: params.description,
      callbackUrl: params.callbackUrl,
      metadata: params.metadata,
    }),
  });
}

export async function getPaymentStatus(orderId: string): Promise<InfinityPaymentData> {
  return request<InfinityPaymentData>(`/payments/${encodeURIComponent(orderId)}`, {
    method: "GET",
  });
}

// El header viene como "sha256=<hex>". Comparamos en tiempo constante para
// no filtrar el secreto por diferencias de timing.
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!INFINITY_WEBHOOK_SECRET || !signatureHeader) return false;

  const expected =
    "sha256=" + crypto.createHmac("sha256", INFINITY_WEBHOOK_SECRET).update(rawBody).digest("hex");

  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Infinity ya manda el QR como data URI completo ("data:image/png;base64,...");
// SIP en cambio manda el base64 pelado. Normalizamos acá para que el
// checkout siempre reciba algo listo para poner en un <img src>.
export function normalizeQrImage(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.startsWith("data:") ? value : `data:image/png;base64,${value}`;
}
