"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PaymentConfirmedCelebration from "@/components/PaymentConfirmedCelebration";

// Componente invisible: mientras el pedido siga 'pendiente' y sea por QR,
// consulta cada 4s si ya se confirmó el pago (hasta 10 minutos) y, apenas
// cambia, refresca la página del servidor (router.refresh) para que el
// comprador vea el estado nuevo sin tener que recargar a mano — la página
// de seguimiento (app/[slug]/pedido/[orderId]/page.tsx) sigue siendo un
// server component, esto solo la empuja a re-consultar cuando hace falta.
export default function PaymentStatusPoller({
  slug,
  orderId,
  status,
  paymentMethod,
}: {
  slug: string;
  orderId: string;
  status: string;
  paymentMethod: string;
}) {
  const router = useRouter();
  // El festejo se dispara ANTES de router.refresh() y sobrevive al refresh
  // (mismo componente, misma posición en el árbol → React conserva este
  // estado) — así el comprador ve la pantalla completa apenas se confirma,
  // no recién después de que la página del servidor termine de recargar.
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (paymentMethod !== "qr" || status !== "pendiente") return;
    let attempts = 0;
    const maxAttempts = 150;
    const interval = setInterval(async () => {
      attempts += 1;
      if (attempts > maxAttempts) {
        clearInterval(interval);
        return;
      }
      try {
        const res = await fetch(`/api/stores/${slug}/orders/${orderId}/status`);
        const data = await res.json();
        if (data.status && data.status !== status) {
          clearInterval(interval);
          if (data.status === "pagado") setShowCelebration(true);
          router.refresh();
        }
      } catch {
        // Sin conexión momentánea: seguimos intentando en el próximo tick.
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [slug, orderId, status, paymentMethod, router]);

  return (
    <PaymentConfirmedCelebration show={showCelebration} onDone={() => setShowCelebration(false)} />
  );
}
