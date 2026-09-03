"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MotionButton } from "@/components/MotionCta";

// Se muestra cuando el vendedor ya marcó el pedido como "Entregado" — recién
// acá el comprador confirma que de verdad lo tiene en la mano, con
// calificación y comentario opcionales. Antes de este paso el pedido queda
// en "Entregado" nada más; esta confirmación es la que lo pasa a "Recibido".
export default function ConfirmReceivedButton({
  slug,
  orderId,
}: {
  slug: string;
  orderId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [review, setReview] = useState("");

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/stores/${slug}/orders/${orderId}/confirm-received`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, review: review.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo confirmar");
        setLoading(false);
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setLoading(false);
    }
  }

  return (
    <AnimatePresence mode="wait">
      {done ? (
        <motion.p
          key="done"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="border border-jade-500 bg-jade-50 px-4 py-3 text-center text-sm font-semibold text-jade-700"
        >
          ¡Gracias por confirmar! ✓
        </motion.p>
      ) : showReview ? (
        <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div>
            <p className="mb-1.5 text-center text-sm font-medium text-ink/70">
              ¿Cómo calificarías tu pedido? (opcional)
            </p>
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(rating === n ? null : n)}
                  aria-label={`${n} estrella${n === 1 ? "" : "s"}`}
                  className={`text-2xl transition ${
                    rating != null && n <= rating ? "text-amber-400" : "text-ink/15"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Contale al vendedor cómo te fue (opcional)"
            className="w-full border border-ink/15 px-3 py-2 text-sm"
          />
          <MotionButton
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="btn-editorial btn-editorial-solid w-full disabled:opacity-60"
          >
            {loading ? "Confirmando..." : "Confirmar recepción"}
          </MotionButton>
          {error && <p className="mt-2 text-center text-xs text-coral-600">{error}</p>}
        </motion.div>
      ) : (
        <motion.div key="button" exit={{ opacity: 0 }}>
          <MotionButton
            type="button"
            onClick={() => setShowReview(true)}
            className="btn-editorial btn-editorial-solid w-full"
          >
            Ya recibí mi pedido
          </MotionButton>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
