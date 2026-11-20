import { describe, expect, it } from "vitest";
import { addBusinessDays, amountToCollect, daysOverdue, dropoffDeadline, generatePickupCode, whatsappNumber } from "@/lib/pickupRules";

describe("addBusinessDays (lunes a sábado)", () => {
  it("salta los domingos", () => {
    // Viernes 20/11/2026 + 2 días hábiles = sábado 21 y lunes 23 → lunes 23.
    const d = addBusinessDays(new Date(2026, 10, 20, 10), 2);
    expect(d.getDate()).toBe(23);
    expect(d.getDay()).toBe(1);
  });
  it("cuenta el sábado como hábil", () => {
    const d = addBusinessDays(new Date(2026, 10, 20, 10), 1);
    expect(d.getDay()).toBe(6);
  });
  it("cierra al final del día", () => {
    const d = addBusinessDays(new Date(2026, 10, 16, 8), 5);
    expect(d.getHours()).toBe(23);
    expect(d.getDate()).toBe(21);
  });
  it("plazo del vendedor desde que se pagó", () => {
    expect(dropoffDeadline(new Date(2026, 10, 20, 9).toISOString(), 2).getDate()).toBe(23);
  });
});

describe("custodia y cobro al retirar", () => {
  const deadline = new Date(2026, 10, 25, 23, 59, 59);
  it("a tiempo: solo el servicio", () => {
    expect(amountToCollect(6, 2, deadline, new Date(2026, 10, 24))).toEqual({ fee: 6, storage: 0, overdueDays: 0, total: 6 });
  });
  it("con atraso: servicio + custodia por día", () => {
    const r = amountToCollect(6, 2, deadline, new Date(2026, 10, 28, 10));
    expect(r.overdueDays).toBe(3);
    expect(r.storage).toBe(6);
    expect(r.total).toBe(12);
  });
  it("daysOverdue es 0 antes del plazo", () => {
    expect(daysOverdue(deadline, new Date(2026, 10, 1))).toBe(0);
  });
});

describe("código de retiro y WhatsApp", () => {
  it("4 dígitos sin cero inicial", () => {
    for (let i = 0; i < 200; i++) expect(generatePickupCode()).toMatch(/^[1-9]\d{3}$/);
    expect(generatePickupCode(() => 0)).toBe("1000");
    expect(generatePickupCode(() => 0.99999)).toBe("9999");
  });
  it("agrega 591 solo si falta", () => {
    expect(whatsappNumber("71234567")).toBe("59171234567");
    expect(whatsappNumber("+591 71234567")).toBe("59171234567");
    expect(whatsappNumber("712-34-567")).toBe("59171234567");
  });
});
