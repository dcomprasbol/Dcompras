// Validación de los datos de un Punto Dcompras que manda el panel de
// plataforma (crear y editar usan las mismas reglas).
import { isValidLatLng } from "@/lib/geo";
import type { PickupPointInput } from "@/lib/pickup";

export function parsePickupPointInput(body: any): { ok: true; value: PickupPointInput } | { ok: false; error: string } {
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const num = (v: unknown) => (v === "" || v === null || v === undefined ? NaN : Number(v));

  const name = str(body?.name);
  const city = str(body?.city);
  const address = str(body?.address);
  const hours = str(body?.hours);
  const reference = str(body?.reference) || null;
  const lat = num(body?.lat);
  const lng = num(body?.lng);
  const fee = num(body?.fee);
  const freeDays = num(body?.freeDays);
  const storageFeePerDay = num(body?.storageFeePerDay);
  const dropoffDays = num(body?.dropoffDays);

  if (!name || !city || !address || !hours) return { ok: false, error: "Completa nombre, ciudad, dirección y horario" };
  if (!isValidLatLng(lat, lng)) return { ok: false, error: "Marca la ubicación del punto en el mapa" };
  if (!(fee >= 0 && fee <= 1000)) return { ok: false, error: "El costo del servicio no es válido" };
  if (!(Number.isInteger(freeDays) && freeDays >= 1 && freeDays <= 30)) return { ok: false, error: "Los días gratis deben ser entre 1 y 30" };
  if (!(storageFeePerDay >= 0 && storageFeePerDay <= 1000)) return { ok: false, error: "El costo de custodia no es válido" };
  if (!(Number.isInteger(dropoffDays) && dropoffDays >= 1 && dropoffDays <= 15)) return { ok: false, error: "El plazo del vendedor debe ser entre 1 y 15 días" };

  return {
    ok: true,
    value: { name, city, address, reference, hours, lat, lng, fee, freeDays, storageFeePerDay, dropoffDays, active: body?.active !== false },
  };
}

export function parseOperatorEmails(value: unknown): string[] {
  const raw = Array.isArray(value) ? value.join("\n") : typeof value === "string" ? value : "";
  return raw
    .split(/[\s,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
}
