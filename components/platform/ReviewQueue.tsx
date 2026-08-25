"use client";

import { useState } from "react";
import { storeStatusLabel } from "@/lib/utils";

type Store = {
  id: string;
  slug: string;
  name: string;
  whatsapp: string;
  city: string | null;
  status: string;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  facebookUrl: string | null;
  rejectionNote: string | null;
  createdAt: string;
};

const SOCIAL_LINKS: { key: "instagramUrl" | "tiktokUrl" | "facebookUrl"; label: string }[] = [
  { key: "instagramUrl", label: "Instagram ↗" },
  { key: "tiktokUrl", label: "TikTok ↗" },
  { key: "facebookUrl", label: "Facebook ↗" },
];

const STATUS_COLORS: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  aprobada: "bg-green-100 text-green-800",
  rechazada: "bg-coral-100 text-coral-700",
};

export default function ReviewQueue({ initialStores }: { initialStores: Store[] }) {
  const [stores, setStores] = useState<Store[]>(initialStores);

  async function updateStatus(storeId: string, status: string, note?: string | null) {
    setStores((prev) =>
      prev.map((s) => (s.id === storeId ? { ...s, status, rejectionNote: note ?? null } : s))
    );
    await fetch(`/api/platform/stores/${storeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note }),
    });
  }

  function handleReject(storeId: string) {
    const note = window.prompt(
      "Motivo del rechazo (se lo mostramos al vendedor, opcional):",
      ""
    );
    if (note === null) return; // canceló, no rechazamos nada
    updateStatus(storeId, "rechazada", note.trim() || null);
  }

  if (stores.length === 0) {
    return <p className="text-sm text-ink/50">Todavía no hay tiendas registradas.</p>;
  }

  return (
    <div className="space-y-3">
      {stores.map((store) => (
        <div key={store.id} className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-ink">
                {store.name} <span className="font-normal text-ink/40">/{store.slug}</span>
              </p>
              <p className="text-xs text-ink/50">
                WhatsApp: {store.whatsapp} {store.city ? `· ${store.city}` : ""}
              </p>
              <p className="text-xs text-ink/40">
                Registrada el {new Date(store.createdAt).toLocaleString("es-BO")}
              </p>
            </div>
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[store.status] || "bg-gray-200 text-ink/70"}`}
            >
              {storeStatusLabel(store.status)}
            </span>
          </div>

          {store.rejectionNote && (
            <p className="mb-2 rounded-lg bg-coral-50 px-2.5 py-1.5 text-xs text-coral-700">
              Motivo del rechazo: {store.rejectionNote}
            </p>
          )}

          <div className="flex flex-wrap gap-1.5">
            <a
              href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-ink/15 px-2.5 py-1 text-xs font-medium text-ink/60"
            >
              Escribir por WhatsApp ↗
            </a>
            {SOCIAL_LINKS.map(
              (s) =>
                store[s.key] && (
                  <a
                    key={s.key}
                    href={store[s.key]!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-ink/15 px-2.5 py-1 text-xs font-medium text-ink/60"
                  >
                    {s.label}
                  </a>
                )
            )}
            <button
              onClick={() => updateStatus(store.id, "aprobada")}
              disabled={store.status === "aprobada"}
              className="rounded-lg border border-jade-500 bg-jade-50 px-2.5 py-1 text-xs font-medium text-jade-700 disabled:opacity-40"
            >
              Aprobar
            </button>
            <button
              onClick={() => handleReject(store.id)}
              disabled={store.status === "rechazada"}
              className="rounded-lg border border-coral-500 bg-coral-50 px-2.5 py-1 text-xs font-medium text-coral-600 disabled:opacity-40"
            >
              Rechazar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
