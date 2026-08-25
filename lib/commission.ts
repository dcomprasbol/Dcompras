// Comisión de Dcompras por venta procesada — ver el roadmap de pagos para el
// razonamiento (arrancamos en 1%: el QR bancario en Bolivia es gratis, así
// que la comisión tiene que ser baja para no darle al vendedor un motivo
// para saltarse la plataforma). Ajustable sin tocar código vía
// COMMISSION_PERCENT en las variables de entorno.
const DEFAULT_COMMISSION_PERCENT = 1;

export function commissionPercent(): number {
  const raw = process.env.COMMISSION_PERCENT;
  const parsed = raw !== undefined ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_COMMISSION_PERCENT;
}

/**
 * Comisión y monto a cobrar por un pedido. La comisión se SUMA arriba del
 * precio que puso el vendedor — nunca se le descuenta: el vendedor siempre
 * recibe el 100% de `sellerAmount`, y es el comprador quien paga de más
 * (sellerAmount + comisión) cuando el pedido pasa por la cuenta de Dcompras
 * (`processedByDcompras` = tiene QR generado por Infinity o SIP). Un pedido
 * contra entrega o con el QR estático de la tienda nunca toca la plata de
 * Dcompras, así que no hay comisión ni recargo.
 *
 * `netAmount` queda siempre igual a `sellerAmount` (con o sin comisión) a
 * propósito: así el resto del código (updateOrderStatus, liquidaciones) no
 * necesita saber si la comisión se suma o se descuenta, solo lee netAmount.
 */
export function calculateCommission(
  sellerAmount: number,
  processedByDcompras: boolean
): { commissionAmount: number; totalToCharge: number; netAmount: number } {
  if (!processedByDcompras) {
    return { commissionAmount: 0, totalToCharge: sellerAmount, netAmount: sellerAmount };
  }
  const commissionAmount = Math.round(sellerAmount * (commissionPercent() / 100) * 100) / 100;
  const totalToCharge = Math.round((sellerAmount + commissionAmount) * 100) / 100;
  return { commissionAmount, totalToCharge, netAmount: sellerAmount };
}
