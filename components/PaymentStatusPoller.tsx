"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

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
          router.refresh();
        }
      } catch {
        // Sin conexión momentánea: seguimos intentando en el próximo tick.
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [slug, orderId, status, paymentMethod, router]);

  return null;
}
