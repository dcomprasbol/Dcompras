"use client";

import { useState } from "react";
import Link from "next/link";
import { MotionButton } from "@/components/MotionCta";
import { formatBs, statusLabel } from "@/lib/utils";
import RevealOnScroll from "@/components/landing/RevealOnScroll";

type FoundOrder = {
  id: string;
  code: string;
  createdAt: string;
  status: string;
  total: number;
  paymentMethod: string;
};

// Para compradores SIN cuenta que cerraron la pestaña de seguimiento y ya no
// tienen el link — buscan sus pedidos por el teléfono que usaron al pedir
// (ver /api/stores/[slug]/orders/lookup). No reemplaza a /mis-pedidos (eso
// es para compradores logueados, y ve pedidos en CUALQUIER tienda); esto es
// por tienda y no necesita cuenta.
export default function MiPedidoPage({ params }: { params: { slug: string } }) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<FoundOrder[] | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setOrders(null);
    try {
      const res = await fetch(`/api/stores/${params.slug}/orders/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo buscar tu pedido");
        return;
      }
      setOrders(data.orders || []);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <RevealOnScroll className="mx-auto max-w-md px-5 py-10 md:px-8">
      <span className="section-mark mb-2 text-ink" aria-hidden="true" />
      <h1 className="mb-1 font-impact text-xl uppercase tracking-tight text-ink">
        Encuentra tu pedido
      </h1>
      <p className="mb-4 text-sm text-ink/50">
        Escribe el teléfono que usaste al hacer el pedido y te mostramos el estado.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3 border border-ink/10 bg-white p-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/70">Teléfono / WhatsApp</label>
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Ej: 71234567"
            className="store-accent-focus w-full border border-ink/15 px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-sm text-coral-600">{error}</p>}
        <MotionButton
          type="submit"
          disabled={loading}
          className="btn-editorial btn-editorial-solid w-full disabled:opacity-60"
        >
          {loading ? "Buscando..." : "Buscar mi pedido"}
        </MotionButton>
      </form>

      {orders !== null && (
        <div className="mt-5">
          {orders.length === 0 ? (
            <p className="text-sm text-ink/50">
              No encontramos ningún pedido en esta tienda con ese teléfono.
            </p>
          ) : (
            <div className="space-y-2">
              {orders.map((o) => (
                <Link
                  key={o.id}
                  href={`/${params.slug}/pedido/${o.id}`}
                  className="flex items-center justify-between border border-ink/10 bg-white p-3 text-sm transition hover:border-ink/25"
                >
                  <div>
                    <p className="font-mono font-semibold text-ink">Pedido #{o.code}</p>
                    <p className="mt-0.5 text-xs text-ink/50">
                      {new Date(o.createdAt).toLocaleDateString("es-BO", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}{" "}
                      · {statusLabel(o.status)}
                    </p>
                  </div>
                  <span className="store-accent-text font-mono font-bold">{formatBs(o.total)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </RevealOnScroll>
  );
}
