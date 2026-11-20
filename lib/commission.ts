// "Pago verificado": el cargo de Dcompras por cada venta cobrada con QR
// automático (arrancamos en 1%: el QR bancario en Bolivia es gratis, así que
// tiene que ser bajo para no darle al vendedor un motivo para saltarse la
// plataforma). Ajustable sin tocar código vía COMMISSION_PERCENT.
//
// El nombre visible es "Pago verificado" (nunca "comisión" ni "compra
// protegida"): describe lo que el comprador recibe de verdad — pago
// confirmado al instante por el banco, sin capturas, con registro. Ver
// PAYMENT_FEE_LABEL abajo.
const DEFAULT_COMMISSION_PERCENT = 1;

export const PAYMENT_FEE_LABEL = "Pago verificado";

/**
 * Quién paga el pago verificado — lo elige cada vendedor (stores.commission_payer)
 * y se copia en cada pedido al crearlo (orders.commission_payer):
 *  - "comprador" (default): se SUMA arriba del precio; el vendedor recibe el 100%.
 *  - "vendedor": el comprador paga el precio de catálogo; el 1% se descuenta
 *    de lo que se le liquida al vendedor. A cambio su tienda lleva el sello
 *    "Sin recargos".
 */
export type CommissionPayer = "comprador" | "vendedor";

export function isCommissionPayer(value: unknown): value is CommissionPayer {
  return value === "comprador" || value === "vendedor";
}

export function commissionPercent(): number {
  // Ojo: Number("") es 0 — sin el trim, una variable definida pero vacía
  // (COMMISSION_PERCENT=) dejaba la comisión en 0% sin que nadie lo notara.
  const raw = process.env.COMMISSION_PERCENT?.trim();
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_COMMISSION_PERCENT;
}

/**
 * Pago verificado y montos de un pedido.
 *
 * - `sellerAmount`: lo que suma el pedido a precios del vendedor (order.total).
 * - `processedByDcompras`: el pedido tiene QR generado por Infinity o SIP. Un
 *   pedido contra entrega o con pago coordinado nunca toca la plata de
 *   Dcompras: sin cargo, sin recargo, sin descuento.
 * - `payer`: ver CommissionPayer.
 *
 * Devuelve:
 * - `commissionAmount`: el pago verificado (lo que se queda Dcompras).
 * - `totalToCharge`: lo que se le cobra al comprador en el QR.
 * - `netAmount`: lo que se le liquida al vendedor. El resto del código
 *   (updateOrderStatus, liquidaciones) solo lee netAmount, así que no
 *   necesita saber quién pagó el cargo.
 */
export function calculateCommission(
  sellerAmount: number,
  processedByDcompras: boolean,
  payer: CommissionPayer = "comprador"
): { commissionAmount: number; totalToCharge: number; netAmount: number } {
  if (!processedByDcompras) {
    return { commissionAmount: 0, totalToCharge: sellerAmount, netAmount: sellerAmount };
  }
  const commissionAmount = round2(sellerAmount * (commissionPercent() / 100));
  if (payer === "vendedor") {
    return { commissionAmount, totalToCharge: sellerAmount, netAmount: round2(sellerAmount - commissionAmount) };
  }
  return { commissionAmount, totalToCharge: round2(sellerAmount + commissionAmount), netAmount: sellerAmount };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
