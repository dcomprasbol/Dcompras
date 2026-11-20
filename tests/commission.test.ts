import { afterEach, describe, expect, it, vi } from "vitest";
import { calculateCommission, commissionPercent } from "@/lib/commission";

afterEach(() => vi.unstubAllEnvs());

describe("commissionPercent", () => {
  it("usa 1% por defecto", () => {
    vi.stubEnv("COMMISSION_PERCENT", "");
    expect(commissionPercent()).toBe(1);
  });

  it("respeta COMMISSION_PERCENT", () => {
    vi.stubEnv("COMMISSION_PERCENT", "2.5");
    expect(commissionPercent()).toBe(2.5);
  });

  it("ignora valores inválidos o negativos", () => {
    vi.stubEnv("COMMISSION_PERCENT", "abc");
    expect(commissionPercent()).toBe(1);
    vi.stubEnv("COMMISSION_PERCENT", "-3");
    expect(commissionPercent()).toBe(1);
  });

  it("permite comisión 0", () => {
    vi.stubEnv("COMMISSION_PERCENT", "0");
    expect(commissionPercent()).toBe(0);
  });
});

describe("calculateCommission", () => {
  it("sin pasar por Dcompras no hay comisión ni recargo", () => {
    expect(calculateCommission(150, false)).toEqual({ commissionAmount: 0, totalToCharge: 150, netAmount: 150 });
  });

  it("la comisión se SUMA al precio: el vendedor recibe el 100%", () => {
    vi.stubEnv("COMMISSION_PERCENT", "1");
    const r = calculateCommission(200, true);
    expect(r.commissionAmount).toBe(2);
    expect(r.totalToCharge).toBe(202);
    expect(r.netAmount).toBe(200);
  });

  it("redondea a centavos", () => {
    vi.stubEnv("COMMISSION_PERCENT", "1");
    const r = calculateCommission(99.99, true);
    expect(r.commissionAmount).toBe(1);
    expect(r.totalToCharge).toBe(100.99);
    expect(r.netAmount).toBe(99.99);
  });

  it("monto chico: comisión que redondea a 0.01", () => {
    vi.stubEnv("COMMISSION_PERCENT", "1");
    const r = calculateCommission(1.5, true);
    expect(r.commissionAmount).toBe(0.02);
    expect(r.totalToCharge).toBe(1.52);
  });

  it("netAmount siempre es lo que puso el vendedor", () => {
    vi.stubEnv("COMMISSION_PERCENT", "3");
    for (const amount of [1, 10.5, 37.33, 1234.56]) {
      expect(calculateCommission(amount, true).netAmount).toBe(amount);
      expect(calculateCommission(amount, false).netAmount).toBe(amount);
    }
  });
});

describe("calculateCommission: quién paga el pago verificado", () => {
  it("por defecto lo paga el comprador (se suma)", () => {
    vi.stubEnv("COMMISSION_PERCENT", "1");
    expect(calculateCommission(200, true)).toEqual({ commissionAmount: 2, totalToCharge: 202, netAmount: 200 });
    expect(calculateCommission(200, true, "comprador")).toEqual({ commissionAmount: 2, totalToCharge: 202, netAmount: 200 });
  });

  it("si lo asume el vendedor: el comprador paga el precio exacto y se descuenta del neto", () => {
    vi.stubEnv("COMMISSION_PERCENT", "1");
    expect(calculateCommission(200, true, "vendedor")).toEqual({ commissionAmount: 2, totalToCharge: 200, netAmount: 198 });
  });

  it("redondea a centavos también cuando lo asume el vendedor", () => {
    vi.stubEnv("COMMISSION_PERCENT", "1");
    const r = calculateCommission(99.99, true, "vendedor");
    expect(r.commissionAmount).toBe(1);
    expect(r.totalToCharge).toBe(99.99);
    expect(r.netAmount).toBe(98.99);
  });

  it("sin pasar por Dcompras no importa quién lo asuma: no hay cargo", () => {
    expect(calculateCommission(150, false, "vendedor")).toEqual({ commissionAmount: 0, totalToCharge: 150, netAmount: 150 });
  });

  it("comisión + neto siempre suman lo cobrado o el precio", () => {
    vi.stubEnv("COMMISSION_PERCENT", "1");
    for (const amount of [1, 37.33, 150, 1234.56]) {
      const c = calculateCommission(amount, true, "comprador");
      expect(Math.round((c.netAmount + c.commissionAmount) * 100) / 100).toBe(c.totalToCharge);
      const v = calculateCommission(amount, true, "vendedor");
      expect(Math.round((v.netAmount + v.commissionAmount) * 100) / 100).toBe(amount);
    }
  });
});
