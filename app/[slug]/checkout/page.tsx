"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { MotionButton } from "@/components/MotionCta";
import { formatBs, DELIVERY_TYPES } from "@/lib/utils";
import RevealOnScroll from "@/components/landing/RevealOnScroll";
import LocationField from "@/components/LocationField";
import PaymentConfirmedCelebration from "@/components/PaymentConfirmedCelebration";
import type { LatLng } from "@/components/LocationPicker";

type StoreInfo = {
  name: string;
  whatsapp: string;
  paymentInstructions: string | null;
};

export default function CheckoutPage({ params }: { params: { slug: string } }) {
  const { items, total, clear } = useCart();
  const router = useRouter();
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryType, setDeliveryType] = useState<string>(DELIVERY_TYPES[0].value);
  const [location, setLocation] = useState<LatLng | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"qr" | "contra_entrega">("qr");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  // Si la plataforma tiene cobro automático configurado (Infinity Payments
  // por ahora), el pedido trae un QR dinámico ya generado para ese monto
  // exacto. Si no (proveedor caído o sin configurar), NO hay QR de respaldo
  // que mostrarle al comprador — el QR que el vendedor carga en Cuenta es
  // solo para que Dcompras le liquide a él, nunca se le muestra al
  // comprador (saltearía la comisión). Ver el bloque de abajo.
  const [gatewayQrImage, setGatewayQrImage] = useState<string | null>(null);
  // Mientras esto siga en "pendiente", el comprador ve el spinner de
  // "esperando tu pago" debajo del QR (ver el useEffect de polling más
  // abajo); apenas el webhook confirma el pago, pasa a "pagado" y la
  // pantalla lo muestra al toque, sin que el comprador tenga que refrescar.
  const [paymentStatus, setPaymentStatus] = useState<"pendiente" | "pagado">("pendiente");
  // Festejo a pantalla completa que se muestra un instante justo cuando el
  // polling detecta la confirmación — separado de paymentStatus porque este
  // se apaga solo a los pocos segundos, mientras que paymentStatus se queda
  // en "pagado" para siempre (el cartel chico de abajo).
  const [showCelebration, setShowCelebration] = useState(false);
  // Monto realmente cobrado del pedido confirmado (con comisión sumada si
  // aplicó) — se fija recién al recibir la respuesta del servidor y ya no
  // se toca, porque `total` del carrito vuelve a 0 apenas se llama clear().
  const [paidAmount, setPaidAmount] = useState<number>(0);
  // Si el cobro automático de la plataforma está activo, "Pagar con QR" le
  // suma una comisión al precio del vendedor (lib/commission.ts) — la
  // mostramos ANTES de confirmar para que el comprador nunca vea un número
  // acá y le cobren otro en el QR.
  const [paymentConfig, setPaymentConfig] = useState<{
    autoQrEnabled: boolean;
    commissionPercent: number;
  } | null>(null);
  // Si el comprador ya tiene sesión, el pedido queda asociado a su cuenta
  // solo (lo resuelve el propio servidor al crear el pedido) — esto es
  // nada más para mostrarle "comprando como..." o invitarlo a loguearse.
  // Nunca bloquea el checkout: comprar como invitado sigue funcionando igual.
  const [buyerEmail, setBuyerEmail] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    fetch(`/api/stores/${params.slug}`)
      .then((r) => r.json())
      .then((d) => setStore(d.store));
  }, [params.slug]);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setBuyerEmail(d.user?.email ?? null));
  }, []);

  useEffect(() => {
    fetch("/api/platform/payment-config")
      .then((r) => r.json())
      .then(setPaymentConfig);
  }, []);

  // Consulta en vivo si ya se confirmó el pago (mientras haya un QR dinámico
  // esperando) — cada 4s, hasta 10 minutos. Pasado eso dejamos de insistir:
  // si tarda tanto ya es mejor que coordine por WhatsApp, no tiene sentido
  // seguir pegándole al servidor desde una pestaña que quedó abierta horas.
  useEffect(() => {
    if (!orderId || paymentMethod !== "qr" || !gatewayQrImage || paymentStatus === "pagado") return;
    let attempts = 0;
    const maxAttempts = 150;
    const interval = setInterval(async () => {
      attempts += 1;
      if (attempts > maxAttempts) {
        clearInterval(interval);
        return;
      }
      try {
        const res = await fetch(`/api/stores/${params.slug}/orders/${orderId}/status`);
        const data = await res.json();
        if (data.status === "pagado") {
          setPaymentStatus("pagado");
          setShowCelebration(true);
          clearInterval(interval);
        }
      } catch {
        // Sin conexión momentánea: seguimos intentando en el próximo tick.
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [orderId, paymentMethod, gatewayQrImage, paymentStatus, params.slug]);

  // Misma fórmula que calculateCommission en lib/commission.ts (redondeo a
  // centavos incluido) — si esto se desalinea con el backend, el comprador
  // vería acá un total distinto al que después le pide el QR.
  const commissionAmount =
    paymentMethod === "qr" && paymentConfig?.autoQrEnabled
      ? Math.round(total * (paymentConfig.commissionPercent / 100) * 100) / 100
      : 0;
  const totalToPay = Math.round((total + commissionAmount) * 100) / 100;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/stores/${params.slug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          customerAddress: address,
          deliveryType,
          deliveryLat: location?.lat ?? null,
          deliveryLng: location?.lng ?? null,
          paymentMethod,
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo crear el pedido");
        setLoading(false);
        return;
      }
      setOrderId(data.order.id);
      if (data.payment?.qrImage) setGatewayQrImage(data.payment.qrImage);
      // data.payment.amountCharged es lo que realmente pide el QR (con
      // comisión); si el pedido cayó al QR estático o es contra entrega, no
      // hay comisión y el monto es el total del carrito tal cual.
      setPaidAmount(data.payment?.amountCharged ?? totalToPay);
      clear();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setLoading(false);
    }
  }

  if (orderId) {
    const trackingPath = `/${params.slug}/pedido/${orderId}`;
    const whatsappMsg = encodeURIComponent(
      `Hola, acabo de hacer un pedido #${orderId.slice(-6).toUpperCase()} por ${formatBs(paidAmount)}. Mi nombre es ${name}.\n\nSeguimiento: ${typeof window !== "undefined" ? window.location.origin : ""}${trackingPath}`
    );
    return (
      <>
        <PaymentConfirmedCelebration
          show={showCelebration}
          onDone={() => setShowCelebration(false)}
        />
        <div className="animate-pop mx-auto max-w-md border border-ink/10 bg-white p-6 text-center md:my-10">
        <p className="text-2xl">✅</p>
        <h1 className="mt-2 font-impact text-xl uppercase tracking-tight text-ink">
          ¡Pedido recibido!
        </h1>
        <p className="mt-1 text-sm text-ink/60">
          Número de pedido: <span className="font-mono">{orderId.slice(-6).toUpperCase()}</span>
        </p>
        {paymentMethod === "qr" && gatewayQrImage && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-ink/70">Escanea el QR para pagar:</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={gatewayQrImage}
              alt="QR de pago"
              className="mx-auto h-56 w-56 border border-ink/10 object-contain"
            />
            {paymentStatus === "pendiente" ? (
              <div className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-amber-600">
                <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                </span>
                Esperando confirmación de tu pago...
              </div>
            ) : (
              <div className="animate-pop mt-3 border border-jade-500 bg-jade-50 px-3 py-2 text-sm font-semibold text-jade-700">
                ✅ ¡Pago confirmado! Ya le llegó a la tienda.
              </div>
            )}
            <p className="mt-2 text-xs text-ink/50">
              {paymentStatus === "pendiente"
                ? "Este QR es exclusivo de tu pedido y se confirma solo — no hace falta que avises por WhatsApp, pero puedes hacerlo igual si quieres."
                : "Ya podés cerrar esta pantalla — el vendedor ya ve tu pedido como pagado."}
            </p>
          </div>
        )}
        {/* Si el pedido eligió QR pero no se pudo generar el QR automático
            (proveedor caído, todavía sin configurar), NUNCA mostramos acá el
            QR que el vendedor cargó en Cuenta — ese es solo para que
            Dcompras le liquide a él, no para que le paguen directo los
            compradores (eso saltearía la comisión). En ese caso coordina el
            pago a mano por WhatsApp. */}
        {paymentMethod === "qr" && !gatewayQrImage && (
          <p className="mt-3 text-sm text-ink/60">
            {store?.paymentInstructions ||
              "La tienda te va a escribir por WhatsApp para coordinar el pago."}
          </p>
        )}
        {paymentMethod === "contra_entrega" && (
          <p className="mt-3 text-sm text-ink/60">
            Pagarás en efectivo cuando recibas tu pedido.
          </p>
        )}
        {store?.whatsapp && (
          <a
            href={`https://wa.me/591${store.whatsapp.replace(/\D/g, "")}?text=${whatsappMsg}`}
            target="_blank"
            className="btn-editorial mt-5 flex bg-green-500 text-white border-green-500"
          >
            Avisar por WhatsApp
          </a>
        )}
        <Link
          href={trackingPath}
          className="btn-editorial btn-editorial-solid mt-3 flex"
        >
          Ver seguimiento de mi pedido
        </Link>
        {buyerEmail && (
          <Link
            href="/mis-pedidos"
            className="nav-sweep mt-3 block text-center text-xs font-semibold text-ink/50"
          >
            Ver todos mis pedidos →
          </Link>
        )}
        <button
          onClick={() => router.push(`/${params.slug}`)}
          className="mt-3 w-full border border-ink/15 px-4 py-2.5 text-sm text-ink/60 transition hover:border-ink/30"
        >
          Volver a la tienda
        </button>
        </div>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-10 md:px-8">
        <RevealOnScroll className="border border-dashed border-ink/15 bg-white p-8 text-center text-sm text-ink/50">
          Tu carrito está vacío.
        </RevealOnScroll>
      </div>
    );
  }

  return (
    <RevealOnScroll className="mx-auto max-w-2xl px-5 py-10 md:px-8">
      <span className="section-mark mb-2 text-ink" aria-hidden="true" />
      <h1 className="mb-4 font-impact text-xl uppercase tracking-tight text-ink">
        Finalizar pedido
      </h1>

      {buyerEmail !== undefined && (
        <div className="store-accent-soft-bg mb-4 flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
          {buyerEmail ? (
            <p className="text-ink/70">
              Comprando como <span className="font-semibold text-ink">{buyerEmail}</span> — este
              pedido va a quedar en tu historial.
            </p>
          ) : (
            <>
              <p className="text-ink/70">¿Ya tienes cuenta en Dcompras?</p>
              <Link
                href={`/login?next=${encodeURIComponent(`/${params.slug}/checkout`)}`}
                className="nav-sweep font-semibold text-ink"
              >
                Inicia sesión (opcional) →
              </Link>
            </>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border border-ink/10 bg-white p-4">
          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium text-ink/70">Nombre completo</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="store-accent-focus w-full border border-ink/15 px-3 py-2 text-sm"
            />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium text-ink/70">Teléfono / WhatsApp</label>
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="store-accent-focus w-full border border-ink/15 px-3 py-2 text-sm"
            />
          </div>
          <div className="mb-3">
            <p className="mb-1.5 text-sm font-medium text-ink/70">¿Cómo prefieres recibirlo?</p>
            <div className="grid grid-cols-2 gap-2">
              {DELIVERY_TYPES.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDeliveryType(d.value)}
                  className={`border px-3 py-2 text-sm font-medium transition ${
                    deliveryType === d.value
                      ? "store-accent-border store-accent-soft-bg store-accent-text"
                      : "border-ink/15 text-ink/60"
                  }`}
                >
                  {d.icon} {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium text-ink/70">
              {deliveryType === "punto_encuentro"
                ? "Punto de encuentro (ej: plaza, esquina, mall)"
                : "Dirección de entrega"}
            </label>
            <textarea
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              placeholder={
                deliveryType === "punto_encuentro"
                  ? "Ej: Plaza 24 de septiembre, lado del mercado"
                  : undefined
              }
              className="store-accent-focus w-full border border-ink/15 px-3 py-2 text-sm"
            />
          </div>

          <LocationField
            value={location}
            onChange={setLocation}
            onUseSuggestedAddress={setAddress}
            currentAddress={address}
          />
        </div>

        <div className="border border-ink/10 bg-white p-4">
          <p className="mb-2 text-sm font-medium text-ink/70">Método de pago</p>
          <div className="space-y-2">
            <label className="flex items-center gap-2 border border-ink/15 p-3 text-sm">
              <input
                type="radio"
                checked={paymentMethod === "qr"}
                onChange={() => setPaymentMethod("qr")}
              />
              Pagar con QR
            </label>
            <label className="flex items-center gap-2 border border-ink/15 p-3 text-sm">
              <input
                type="radio"
                checked={paymentMethod === "contra_entrega"}
                onChange={() => setPaymentMethod("contra_entrega")}
              />
              Pago contra entrega (efectivo)
            </label>
          </div>
        </div>

        <div className="border border-ink/10 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink/70">Total a pagar</span>
            <span className="store-accent-text font-mono text-lg font-bold">
              {formatBs(totalToPay)}
            </span>
          </div>
          {commissionAmount > 0 && (
            <p className="mt-1 text-xs text-ink/50">
              Incluye {formatBs(commissionAmount)} de comisión por pago con QR automático
            </p>
          )}
        </div>

        {error && <p className="text-sm text-coral-600">{error}</p>}

        <MotionButton
          type="submit"
          disabled={loading}
          className="btn-editorial btn-editorial-solid w-full disabled:opacity-60"
        >
          {loading ? "Enviando..." : "Confirmar pedido"}
        </MotionButton>
      </form>
    </RevealOnScroll>
  );
}
