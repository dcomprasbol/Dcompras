"use client";

// El vendedor elige quién paga el "Pago verificado" (el 1% de los pedidos
// cobrados con QR automático). Cada opción explica qué gana y qué cuesta,
// con números de SU tienda (venta promedio de los últimos 90 días), sin
// prometer resultados que todavía no medimos.

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Icon from "@/components/Icon";
import { formatBs } from "@/lib/utils";

type Payer = "comprador" | "vendedor";

export default function CommissionPayerCard({ slug }: { slug: string }) {
  const [payer, setPayer] = useState<Payer | null>(null);
  const [saved, setSaved] = useState<Payer | null>(null);
  const [percent, setPercent] = useState(1);
  const [avgTicket, setAvgTicket] = useState(0);
  const [monthlyOrders, setMonthlyOrders] = useState(0);
  const [autoQr, setAutoQr] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/stores/${slug}/earnings`)
      .then((r) => r.json())
      .then((d) => {
        setPayer(d.commissionPayer ?? "comprador");
        setSaved(d.commissionPayer ?? "comprador");
        setPercent(d.commissionPercent ?? 1);
        setAvgTicket(d.stats?.avgTicket ?? 0);
        setMonthlyOrders(d.stats?.monthlyOrders ?? 0);
        setAutoQr(Boolean(d.autoQrEnabled));
      });
  }, [slug]);

  async function save() {
    if (!payer) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/stores/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionPayer: payer }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setMessage(d.error || "No se pudo guardar");
        return;
      }
      setSaved(payer);
      setMessage("Guardado. Se aplica a los pedidos nuevos.");
    } finally {
      setSaving(false);
    }
  }

  if (!payer) return null;

  // Sin historial de ventas usamos un ejemplo de Bs 150 (y lo decimos).
  const ticket = avgTicket > 0 ? avgTicket : 150;
  const perSale = Math.round(ticket * percent) / 100;
  const orders = monthlyOrders > 0 ? monthlyOrders : 30;
  const perMonth = Math.round(perSale * orders * 100) / 100;
  const usingExample = avgTicket <= 0;

  const options: {
    value: Payer;
    title: string;
    summary: string;
    pros: string[];
    cost: string;
  }[] = [
    {
      value: "comprador",
      title: "Lo paga mi cliente",
      summary: `Recibes el 100% de tu precio. Tu cliente ve «+ ${formatBs(perSale)} de pago verificado» al pagar.`,
      pros: ["Conviene si tu margen es ajustado", "Conviene si vendes algo único que el cliente no va a comparar"],
      cost: "A ti no te cuesta nada.",
    },
    {
      value: "vendedor",
      title: "Yo lo asumo",
      summary: "Tu cliente paga exactamente el precio que ve en tu catálogo, sin nada extra al final.",
      pros: [
        "Tu tienda muestra el sello «Sin recargos» en tu catálogo y en el directorio",
        "Sin sorpresas en el último paso: el precio que ve es el que paga",
        "Compites mejor si otros venden lo mismo que tú",
      ],
      cost: `Te cuesta ${formatBs(perSale)} por venta: unos ${formatBs(perMonth)} al mes con ${orders} ventas.`,
    },
  ];

  return (
    <div className="mt-4 rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
      <h2 className="mb-1 text-sm font-bold text-ink">
        <Icon name="qr" className="mr-1.5 h-4 w-4" />
        ¿Quién paga el «Pago verificado» ({percent}%)?
      </h2>
      <p className="mb-3 text-xs text-ink/50">
        Es lo que cuesta cobrar con QR automático: el pago se confirma al instante, sin capturas. Solo
        aplica a esos pedidos; contra entrega y pagos coordinados no tienen ningún cargo.
        {usingExample
          ? " Calculamos con un ejemplo de Bs 150 por venta, porque todavía no tienes historial."
          : ` Calculado con tu venta promedio de ${formatBs(avgTicket)}.`}
      </p>
      {!autoQr && (
        <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
          El QR automático todavía no está activo: puedes elegir ahora y se aplicará cuando se active.
        </p>
      )}

      <div className="space-y-2" role="radiogroup">
        {options.map((o) => {
          const selected = payer === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setPayer(o.value)}
              className={`relative w-full rounded-xl border-2 p-3.5 text-left transition ${
                selected ? "border-jade-500 bg-jade-50/60" : "border-ink/10 hover:border-ink/25"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    selected ? "border-jade-500 bg-jade-500" : "border-ink/25"
                  }`}
                >
                  {selected && <span className="h-2 w-2 rounded-full bg-white" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-ink">{o.title}</span>
                    {o.value === "vendedor" && (
                      <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        Sin recargos
                      </span>
                    )}
                    {saved === o.value && (
                      <span className="text-[11px] font-semibold text-jade-700">· Tu opción actual</span>
                    )}
                  </span>
                  <span className="mt-1 block text-xs text-ink/60">{o.summary}</span>
                  {selected && (
                    <motion.span initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="block overflow-hidden">
                      <span className="mt-2 block space-y-1">
                        {o.pros.map((p) => (
                          <span key={p} className="flex gap-1.5 text-xs text-jade-700">
                            <span>✓</span>
                            {p}
                          </span>
                        ))}
                      </span>
                      <span className="mt-2 block rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-ink">{o.cost}</span>
                    </motion.span>
                  )}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] text-ink/45">
        No te prometemos más ventas por elegir una u otra: lo que sí cambia es que tu cliente ve el precio
        final desde el principio. Puedes cambiarlo cuando quieras; los pedidos ya hechos no se recalculan.
      </p>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving || payer === saved}
          className="rounded-xl bg-jade-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-jade-600 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar elección"}
        </button>
        {message && <span className="text-xs text-ink/60">{message}</span>}
      </div>
    </div>
  );
}
