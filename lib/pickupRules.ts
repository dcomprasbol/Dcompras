// Reglas del Punto Dcompras (puras: sin base de datos, sirven en servidor y
// en el navegador). Ver lib/pickup.ts para el acceso a datos.
//
// Días hábiles = lunes a sábado: en Bolivia el comercio abre los sábados y
// el punto también. Solo se saltan los domingos.

export const PICKUP_STATUS_LABELS: Record<string, string> = {
  esperando_vendedor: "Esperando que el vendedor lo lleve",
  en_punto: "Listo para retirar",
  retirado: "Retirado",
  devuelto: "Devuelto al vendedor",
};

export function pickupStatusLabel(status: string | null | undefined): string {
  return (status && PICKUP_STATUS_LABELS[status]) || "—";
}

/** Suma `days` días hábiles (lunes a sábado) a `from`, al cierre del día. */
export function addBusinessDays(from: Date, days: number): Date {
  const d = new Date(from.getTime());
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) added++;
  }
  d.setHours(23, 59, 59, 0);
  return d;
}

/** Hasta cuándo tiene el vendedor para dejar el paquete (desde que se pagó). */
export function dropoffDeadline(paidAt: string | Date, dropoffDays: number): Date {
  return addBusinessDays(new Date(paidAt), dropoffDays);
}

/** Días calendario completos de atraso desde `deadline` (0 si todavía está a tiempo). */
export function daysOverdue(deadline: string | Date, now: Date = new Date()): number {
  const ms = now.getTime() - new Date(deadline).getTime();
  return ms <= 0 ? 0 : Math.ceil(ms / (24 * 60 * 60 * 1000));
}

/**
 * Lo que el encargado cobra al entregar: el servicio del punto + custodia
 * por cada día de atraso después del plazo gratis.
 */
export function amountToCollect(
  fee: number,
  storageFeePerDay: number,
  deadline: string | Date | null,
  now: Date = new Date()
): { fee: number; storage: number; overdueDays: number; total: number } {
  const overdueDays = deadline ? daysOverdue(deadline, now) : 0;
  const storage = Math.round(overdueDays * storageFeePerDay * 100) / 100;
  return { fee, storage, overdueDays, total: Math.round((fee + storage) * 100) / 100 };
}

/** Código de retiro de 4 dígitos (no empieza con 0, para que no se pierda al dictarlo). */
export function generatePickupCode(random: () => number = Math.random): string {
  return String(1000 + Math.floor(random() * 9000));
}

/** "591XXXXXXXX" para wa.me, aceptando teléfonos con o sin código de país. */
export function whatsappNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("591") && digits.length >= 11) return digits;
  return `591${digits}`;
}
