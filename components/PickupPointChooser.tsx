"use client";

// Elegir Punto Dcompras en el checkout: dirección, horario, costo del
// servicio y cuántos días gratis queda guardado el pedido.
import Icon from "@/components/Icon";
import { formatBs } from "@/lib/utils";

export type PickupPointOption = {
  id: string;
  name: string;
  city: string;
  address: string;
  reference: string | null;
  hours: string;
  fee: number;
  freeDays: number;
  lat: number;
  lng: number;
};

export default function PickupPointChooser({
  points,
  value,
  onChange,
}: {
  points: PickupPointOption[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <div className="mb-1">
      <p className="mb-1.5 text-sm font-medium text-ink/70">¿En qué punto lo retiras?</p>
      <div className="space-y-2">
        {points.map((p) => {
          const selected = value === p.id;
          return (
            <label
              key={p.id}
              className={`block cursor-pointer border p-3 text-sm transition ${
                selected ? "store-accent-border store-accent-soft-bg" : "border-ink/15"
              }`}
            >
              <span className="flex items-start gap-2.5">
                <input type="radio" checked={selected} onChange={() => onChange(p.id)} className="mt-1" />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-semibold text-ink">{p.name}</span>
                    <span className="font-mono text-xs font-bold text-ink">{formatBs(p.fee)}</span>
                  </span>
                  <span className="block text-xs text-ink/60">
                    {p.address}, {p.city}
                    {p.reference ? ` · ${p.reference}` : ""}
                  </span>
                  <span className="mt-1 block text-xs text-ink/50">
                    <Icon name="clock" mono className="mr-1 h-3 w-3" />
                    {p.hours}
                  </span>
                  <span className="mt-1 block text-xs text-ink/50">
                    Te avisamos cuando llegue. Lo guardamos {p.freeDays} días hábiles sin costo extra.
                  </span>
                  <a
                    href={`https://www.google.com/maps?q=${p.lat},${p.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs font-semibold text-ink underline underline-offset-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Icon name="pin" className="mr-1 h-3 w-3" />
                    Ver en el mapa
                  </a>
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
