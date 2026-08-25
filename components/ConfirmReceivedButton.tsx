"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MotionButton } from "@/components/MotionCta";

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

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/stores/${slug}/orders/${orderId}/confirm-received`, {
        method: "POST",
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
      ) : (
        <motion.div key="button" exit={{ opacity: 0 }}>
          <MotionButton
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="btn-editorial btn-editorial-solid w-full disabled:opacity-60"
          >
            {loading ? "Confirmando..." : "Ya recibí mi pedido"}
          </MotionButton>
          {error && <p className="mt-2 text-center text-xs text-coral-600">{error}</p>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
