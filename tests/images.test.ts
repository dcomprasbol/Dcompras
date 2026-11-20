import { afterEach, describe, expect, it, vi } from "vitest";
import { thumbUrl } from "@/lib/utils";
import { ImageError, imageErrorResponse, persistImage } from "@/lib/storage";

afterEach(() => vi.unstubAllEnvs());

const BASE = "https://abc.supabase.co/storage/v1/object/public/media";

describe("thumbUrl", () => {
  it("arma la miniatura de una foto de nuestro Storage", () => {
    expect(thumbUrl(`${BASE}/products/123.jpg`)).toBe(`${BASE}/products/123_thumb.jpg`);
    expect(thumbUrl(`${BASE}/payment-qr/9.png`)).toBe(`${BASE}/payment-qr/9_thumb.jpg`);
  });

  it("no duplica el sufijo si ya es miniatura", () => {
    expect(thumbUrl(`${BASE}/products/123_thumb.jpg`)).toBe(`${BASE}/products/123_thumb.jpg`);
  });

  it("deja igual URLs externas, data URLs y vacíos", () => {
    expect(thumbUrl("https://picsum.photos/400.jpg")).toBe("https://picsum.photos/400.jpg");
    expect(thumbUrl("data:image/jpeg;base64,AAA")).toBe("data:image/jpeg;base64,AAA");
    expect(thumbUrl(null)).toBeNull();
    expect(thumbUrl(undefined)).toBeUndefined();
  });
});

describe("persistImage", () => {
  it("deja pasar URLs, null y vacío sin subir nada", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "k");
    expect(await persistImage("https://x.com/a.jpg", "products")).toBe("https://x.com/a.jpg");
    expect(await persistImage(null, "products")).toBeNull();
    expect(await persistImage("", "products")).toBe("");
  });

  it("sin Storage configurado devuelve el data URL tal cual (modo local)", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const data = "data:image/jpeg;base64,AAAA";
    expect(await persistImage(data, "products")).toBe(data);
  });

  it("rechaza formatos que no son imagen", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "k");
    await expect(persistImage("data:text/html;base64,PGgxPg==", "products")).rejects.toBeInstanceOf(ImageError);
  });

  it("rechaza bytes que dicen ser imagen pero no lo son", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "k");
    const fake = "data:image/jpeg;base64," + Buffer.from("no soy una foto").toString("base64");
    await expect(persistImage(fake, "products")).rejects.toBeInstanceOf(ImageError);
  });
});

describe("imageErrorResponse", () => {
  it("convierte ImageError en 400 con mensaje para el vendedor", async () => {
    const res = imageErrorResponse(new ImageError("La imagen es demasiado pesada"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("La imagen es demasiado pesada");
  });

  it("relanza cualquier otro error", () => {
    expect(() => imageErrorResponse(new Error("db caída"))).toThrow("db caída");
  });
});
