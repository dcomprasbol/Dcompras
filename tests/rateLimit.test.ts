import { beforeEach, describe, expect, it, vi } from "vitest";

// lib/db.ts se conecta a Postgres al importarse: lo reemplazamos por un
// contador en memoria que imita el INSERT ... ON CONFLICT ... RETURNING.
const counters = new Map<string, number>();
let failNext = false;

vi.mock("@/lib/db", () => {
  const sql = (strings: TemplateStringsArray, ...values: unknown[]) => {
    const text = strings.join("?");
    if (text.includes("DELETE FROM rate_limits")) return Promise.resolve([]);
    if (failNext) {
      failNext = false;
      return Promise.reject(new Error("db caída"));
    }
    const [key, start] = values as [string, Date];
    const k = `${key}@${start.toISOString()}`;
    const count = (counters.get(k) ?? 0) + 1;
    counters.set(k, count);
    return Promise.resolve([{ count }]);
  };
  return { sql, dbReady: Promise.resolve() };
});

const { checkRateLimit, clientIp, windowStart, hashKey, rateLimit } = await import("@/lib/rateLimit");

const rule = { name: "test", limit: 3, windowSec: 60 };

beforeEach(() => {
  counters.clear();
  failNext = false;
});

describe("clientIp", () => {
  it("toma la primera IP de x-forwarded-for", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
  });
  it("cae a x-real-ip y luego a 'unknown'", () => {
    expect(clientIp(new Headers({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

describe("windowStart", () => {
  it("alinea al inicio de la ventana", () => {
    const t = Date.UTC(2026, 0, 1, 10, 7, 42);
    expect(windowStart(t, 600).toISOString()).toBe("2026-01-01T10:00:00.000Z");
    expect(windowStart(t, 60).toISOString()).toBe("2026-01-01T10:07:00.000Z");
  });
});

describe("hashKey", () => {
  it("no guarda la IP en claro y es estable", () => {
    const h = hashKey(["1.2.3.4", "tienda"]);
    expect(h).not.toContain("1.2.3.4");
    expect(h).toHaveLength(32);
    expect(hashKey(["1.2.3.4", "tienda"])).toBe(h);
    expect(hashKey(["1.2.3.4", "otra"])).not.toBe(h);
  });
});

describe("checkRateLimit", () => {
  const now = Date.UTC(2026, 0, 1, 12, 0, 10);

  it("deja pasar hasta el límite y bloquea después", async () => {
    const results = [];
    for (let i = 0; i < 5; i++) results.push(await checkRateLimit(rule, ["ip"], now));
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false, false]);
    expect(results[0].remaining).toBe(2);
    expect(results[3].retryAfterSec).toBe(50);
  });

  it("cada identidad tiene su propio contador", async () => {
    for (let i = 0; i < 3; i++) await checkRateLimit(rule, ["ip-a"], now);
    expect((await checkRateLimit(rule, ["ip-a"], now)).allowed).toBe(false);
    expect((await checkRateLimit(rule, ["ip-b"], now)).allowed).toBe(true);
  });

  it("la ventana siguiente arranca de cero", async () => {
    for (let i = 0; i < 4; i++) await checkRateLimit(rule, ["ip"], now);
    expect((await checkRateLimit(rule, ["ip"], now + 60_000)).allowed).toBe(true);
  });

  it("si la base falla, deja pasar (no frena una compra real)", async () => {
    failNext = true;
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await checkRateLimit(rule, ["ip"], now)).allowed).toBe(true);
    spy.mockRestore();
  });
});

describe("rateLimit (respuesta HTTP)", () => {
  it("devuelve 429 con Retry-After al pasarse", async () => {
    const req = new Request("http://x/api", { headers: { "x-forwarded-for": "9.9.9.9" } });
    for (let i = 0; i < 3; i++) expect(await rateLimit(req, rule)).toBeNull();
    const res = await rateLimit(req, rule);
    expect(res?.status).toBe(429);
    expect(Number(res?.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect((await res!.json()).error).toMatch(/Demasiados intentos/);
  });
});
