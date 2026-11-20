import { describe, expect, it } from "vitest";
import { applyBulkOp, roundPrice, describeBulkOp } from "@/lib/bulkPricing";

describe("roundPrice", () => {
  it("al entero, a la decena y terminado en 9", () => {
    expect(roundPrice(162.36, "integer")).toBe(162);
    expect(roundPrice(162.36, "end0")).toBe(160);
    expect(roundPrice(162.36, "end9")).toBe(159);
    expect(roundPrice(165, "end9")).toBe(169);
    expect(roundPrice(169, "end9")).toBe(169);
    expect(roundPrice(170.2, "end9")).toBe(169);
    expect(roundPrice(8.4, "end9")).toBe(9);
    // Nunca se aleja más de Bs 5 del precio calculado.
    for (let p = 9; p < 500; p += 0.37) expect(Math.abs(roundPrice(p, "end9") - p)).toBeLessThanOrEqual(5);
    expect(roundPrice(162.364, "none")).toBe(162.36);
  });
});

describe("applyBulkOp", () => {
  const plain = { price: 150, compareAtPrice: null };
  const onSale = { price: 120, compareAtPrice: 150 };

  it("sube y baja porcentajes", () => {
    expect(applyBulkOp(plain, "pct_up", 8, "none")).toEqual({ price: 162, compareAtPrice: null });
    expect(applyBulkOp(plain, "pct_up", 8, "end9")).toEqual({ price: 159, compareAtPrice: null });
    expect(applyBulkOp(plain, "pct_down", 10, "none")).toEqual({ price: 135, compareAtPrice: null });
  });

  it("suma, resta y fija montos", () => {
    expect(applyBulkOp(plain, "add", 10, "none")?.price).toBe(160);
    expect(applyBulkOp(plain, "sub", 10, "none")?.price).toBe(140);
    expect(applyBulkOp(plain, "set", 99, "none")?.price).toBe(99);
  });

  it("nunca deja un precio en 0 o negativo", () => {
    expect(applyBulkOp(plain, "sub", 150, "none")).toBeNull();
    expect(applyBulkOp(plain, "sub", 500, "none")).toBeNull();
  });

  it("si estaba en oferta, el precio 'antes' se mueve igual y se mantiene el descuento", () => {
    expect(applyBulkOp(onSale, "pct_up", 10, "none")).toEqual({ price: 132, compareAtPrice: 165 });
  });

  it("'poner el mismo precio' quita la oferta", () => {
    expect(applyBulkOp(onSale, "set", 100, "none")).toEqual({ price: 100, compareAtPrice: null });
  });

  it("poner en oferta: el precio actual pasa a 'antes'", () => {
    expect(applyBulkOp(plain, "offer", 20, "none")).toEqual({ price: 120, compareAtPrice: 150 });
    // Ya en oferta: el descuento se calcula sobre el precio 'antes'.
    expect(applyBulkOp(onSale, "offer", 10, "none")).toEqual({ price: 135, compareAtPrice: 150 });
  });

  it("quitar oferta vuelve al precio de antes; sin oferta no aplica", () => {
    expect(applyBulkOp(onSale, "remove_offer", 0, "none")).toEqual({ price: 150, compareAtPrice: null });
    expect(applyBulkOp(plain, "remove_offer", 0, "none")).toBeNull();
  });

  it("si el precio no cambia, devuelve null (no se registra en el lote)", () => {
    expect(applyBulkOp({ price: 169, compareAtPrice: null }, "pct_up", 0.1, "end9")).toBeNull();
  });

  it("describe el lote para el historial", () => {
    expect(describeBulkOp("pct_up", 8, "end9")).toBe("+8%, terminado en 9 (Bs 159, 169…)");
    expect(describeBulkOp("remove_offer", 0, "none")).toBe("Quitar oferta");
  });
});
