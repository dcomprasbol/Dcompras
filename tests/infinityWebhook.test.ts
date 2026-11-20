import crypto from "crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

// INFINITY_WEBHOOK_SECRET se lee al cargar el módulo: hay que fijar el
// entorno y recién después importarlo.
async function loadWithSecret(secret: string | undefined) {
  vi.resetModules();
  vi.stubEnv("INFINITY_WEBHOOK_SECRET", secret ?? "");
  return import("@/lib/infinityPayments");
}

function sign(body: string, secret: string) {
  return "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
}

afterEach(() => vi.unstubAllEnvs());

describe("verifyWebhookSignature", () => {
  const body = JSON.stringify({ event: "payment.completed", status: "paid", amount: 101 });

  it("acepta una firma correcta", async () => {
    const { verifyWebhookSignature } = await loadWithSecret("s3cret");
    expect(verifyWebhookSignature(body, sign(body, "s3cret"))).toBe(true);
  });

  it("rechaza una firma hecha con otro secreto", async () => {
    const { verifyWebhookSignature } = await loadWithSecret("s3cret");
    expect(verifyWebhookSignature(body, sign(body, "otro"))).toBe(false);
  });

  it("rechaza si el cuerpo fue modificado (ej. otro monto)", async () => {
    const { verifyWebhookSignature } = await loadWithSecret("s3cret");
    const sig = sign(body, "s3cret");
    expect(verifyWebhookSignature(body.replace("101", "1"), sig)).toBe(false);
  });

  it("rechaza sin cabecera de firma", async () => {
    const { verifyWebhookSignature } = await loadWithSecret("s3cret");
    expect(verifyWebhookSignature(body, null)).toBe(false);
  });

  it("rechaza todo si no hay secreto configurado", async () => {
    const { verifyWebhookSignature } = await loadWithSecret(undefined);
    expect(verifyWebhookSignature(body, sign(body, ""))).toBe(false);
  });
});

describe("normalizeQrImage", () => {
  it("deja intacto un data URI y completa un base64 pelado", async () => {
    const { normalizeQrImage } = await loadWithSecret("x");
    expect(normalizeQrImage("data:image/png;base64,AAA")).toBe("data:image/png;base64,AAA");
    expect(normalizeQrImage("AAA")).toBe("data:image/png;base64,AAA");
    expect(normalizeQrImage(null)).toBeNull();
  });
});
