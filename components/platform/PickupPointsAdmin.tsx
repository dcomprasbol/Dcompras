"use client";

// Puntos Dcompras (panel de plataforma): crear y editar puntos de retiro
// marcando la ubicación en el mapa, con su costo, plazos y encargados.
// Arranca centrado en Tarija, la primera ciudad.

import { useState } from "react";
import dynamic from "next/dynamic";
import Icon from "@/components/Icon";
import { formatBs } from "@/lib/utils";
import type { LatLng } from "@/components/LocationPicker";

const LocationPicker = dynamic(() => import("@/components/LocationPicker"), {
  ssr: false,
  loading: () => <div className="h-72 w-full animate-pulse rounded-xl bg-paper" />,
});

// Plaza Luis de Fuentes y Vargas, Tarija.
const TARIJA: LatLng = { lat: -21.5355, lng: -64.7296 };

export type AdminPickupPoint = {
  id: string;
  name: string;
  city: string;
  address: string;
  reference: string | null;
  lat: number;
  lng: number;
  hours: string;
  fee: number;
  freeDays: number;
  storageFeePerDay: number;
  dropoffDays: number;
  active: boolean;
  operators: string[];
};

type Draft = {
  name: string;
  city: string;
  address: string;
  reference: string;
  location: LatLng | null;
  hours: string;
  fee: string;
  freeDays: string;
  storageFeePerDay: string;
  dropoffDays: string;
  active: boolean;
  operators: string;
};

const EMPTY: Draft = {
  name: "Punto Dcompras Centro",
  city: "Tarija",
  address: "",
  reference: "",
  location: null,
  hours: "Lun a sáb · 9:00–12:30 y 15:00–19:30",
  fee: "6",
  freeDays: "5",
  storageFeePerDay: "2",
  dropoffDays: "2",
  active: true,
  operators: "",
};

function toDraft(p: AdminPickupPoint): Draft {
  return {
    name: p.name,
    city: p.city,
    address: p.address,
    reference: p.reference ?? "",
    location: { lat: p.lat, lng: p.lng },
    hours: p.hours,
    fee: String(p.fee),
    freeDays: String(p.freeDays),
    storageFeePerDay: String(p.storageFeePerDay),
    dropoffDays: String(p.dropoffDays),
    active: p.active,
    operators: p.operators.join("\n"),
  };
}

export default function PickupPointsAdmin({ initialPoints }: { initialPoints: AdminPickupPoint[] }) {
  const [points, setPoints] = useState(initialPoints);
  const [editingId, setEditingId] = useState<string | "new" | null>(initialPoints.length === 0 ? "new" : null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startNew() {
    setDraft(EMPTY);
    setEditingId("new");
    setError(null);
  }
  function startEdit(p: AdminPickupPoint) {
    setDraft(toDraft(p));
    setEditingId(p.id);
    setError(null);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: draft.name,
        city: draft.city,
        address: draft.address,
        reference: draft.reference,
        lat: draft.location?.lat,
        lng: draft.location?.lng,
        hours: draft.hours,
        fee: draft.fee,
        freeDays: draft.freeDays,
        storageFeePerDay: draft.storageFeePerDay,
        dropoffDays: draft.dropoffDays,
        active: draft.active,
        operators: draft.operators,
      };
      const isNew = editingId === "new";
      const res = await fetch(isNew ? "/api/platform/pickup-points" : `/api/platform/pickup-points/${editingId}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || "No se pudo guardar");
        return;
      }
      setPoints((prev) => (isNew ? [...prev, d.point] : prev.map((p) => (p.id === d.point.id ? d.point : p))));
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  }

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const input = "w-full rounded-lg border border-ink/15 px-3 py-2 text-sm";

  return (
    <div className="space-y-4">
      {points.length > 0 && (
        <div className="space-y-2">
          {points.map((p) => (
            <div key={p.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-ink/10 p-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-bold text-ink">
                  <Icon name="pin" className="h-4 w-4" />
                  {p.name}
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${p.active ? "bg-jade-50 text-jade-700" : "bg-ink/5 text-ink/50"}`}>
                    {p.active ? "Activo" : "Pausado"}
                  </span>
                </p>
                <p className="text-xs text-ink/55">
                  {p.address}, {p.city} · {p.hours}
                </p>
                <p className="text-xs text-ink/55">
                  Servicio {formatBs(p.fee)} · {p.freeDays} días gratis · custodia {formatBs(p.storageFeePerDay)}/día · vendedor tiene {p.dropoffDays} días para dejarlo
                </p>
                <p className="text-xs text-ink/45">
                  Encargados: {p.operators.length ? p.operators.join(", ") : "ninguno todavía"}
                </p>
              </div>
              <button type="button" onClick={() => startEdit(p)} className="rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink/70">
                Editar
              </button>
            </div>
          ))}
        </div>
      )}

      {editingId === null ? (
        <button type="button" onClick={startNew} className="rounded-xl bg-jade-500 px-4 py-2 text-sm font-semibold text-white">
          + Nuevo Punto Dcompras
        </button>
      ) : (
        <div className="rounded-xl border border-jade-100 bg-jade-50/40 p-4">
          <h3 className="mb-3 text-sm font-bold text-ink">{editingId === "new" ? "Nuevo Punto Dcompras" : "Editar punto"}</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink/60">Nombre</label>
              <input value={draft.name} onChange={(e) => set("name", e.target.value)} className={input} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink/60">Ciudad</label>
              <input value={draft.city} onChange={(e) => set("city", e.target.value)} className={input} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-ink/60">Dirección</label>
              <input
                value={draft.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="Ej: Calle Sucre 345, entre Ingavi y La Madrid"
                className={input}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-ink/60">Referencia (opcional)</label>
              <input
                value={draft.reference}
                onChange={(e) => set("reference", e.target.value)}
                placeholder="Ej: dentro de la Librería X, mostrador del fondo"
                className={input}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-ink/60">
                Ubicación — toca el mapa o arrastra el pin {draft.location ? "✓" : "(obligatorio)"}
              </label>
              <LocationPicker
                value={draft.location}
                onChange={(v) => set("location", v)}
                accentColor="#0EA57A"
                defaultCenter={TARIJA}
                defaultZoom={14}
                className="h-72"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-ink/60">Horario de atención</label>
              <input value={draft.hours} onChange={(e) => set("hours", e.target.value)} className={input} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink/60">Costo del servicio (Bs, lo paga el comprador al retirar)</label>
              <input type="number" min={0} step="0.5" value={draft.fee} onChange={(e) => set("fee", e.target.value)} className={input} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink/60">Días hábiles de custodia gratis</label>
              <input type="number" min={1} max={30} value={draft.freeDays} onChange={(e) => set("freeDays", e.target.value)} className={input} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink/60">Custodia por día de atraso (Bs)</label>
              <input type="number" min={0} step="0.5" value={draft.storageFeePerDay} onChange={(e) => set("storageFeePerDay", e.target.value)} className={input} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink/60">Días hábiles para que el vendedor lo deje</label>
              <input type="number" min={1} max={15} value={draft.dropoffDays} onChange={(e) => set("dropoffDays", e.target.value)} className={input} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-ink/60">
                Encargados del punto (correos de sus cuentas, uno por línea)
              </label>
              <textarea
                value={draft.operators}
                onChange={(e) => set("operators", e.target.value)}
                rows={3}
                placeholder={"encargado@correo.com"}
                className={input}
              />
              <p className="mt-1 text-[11px] text-ink/45">
                Cada encargado entra con su cuenta de Dcompras (o la crea con ese correo) a <span className="font-mono">/punto</span> para
                recibir y entregar paquetes.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink/70 md:col-span-2">
              <input type="checkbox" checked={draft.active} onChange={(e) => set("active", e.target.checked)} />
              Activo (aparece como opción en el checkout)
            </label>
          </div>
          {error && <p className="mt-3 text-xs text-coral-600">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={save} disabled={saving} className="rounded-xl bg-jade-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {saving ? "Guardando..." : "Guardar punto"}
            </button>
            {points.length > 0 && (
              <button type="button" onClick={() => setEditingId(null)} className="rounded-xl border border-ink/15 px-4 py-2 text-sm font-semibold text-ink/60">
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
