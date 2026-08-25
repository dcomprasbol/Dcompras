"use client";

import { useState } from "react";

export default function NotifyMeForm({
  slug,
  productId,
  variantId,
}: {
  slug: string;
  productId: string;
  variantId: string | null;
}) {
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contact.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/stores/${slug}/products/${productId}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: contact.trim(), variantId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo guardar tu contacto");
        setLoading(false);
        return;
      }
      setSent(true);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <p className="border border-jade-500 bg-jade-50 px-3 py-2.5 text-center text-xs font-semibold text-jade-700">
        ¡Listo! Te avisamos apenas haya stock ✓
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        required
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        placeholder="Tu WhatsApp o email"
        className="store-accent-focus min-w-0 flex-1 border border-ink/15 px-3 py-2.5 text-sm"
      />
      <button
        type="submit"
        disabled={loading}
        className="btn-editorial btn-editorial-solid shrink-0 !px-4 !py-2.5 text-xs disabled:opacity-60"
      >
        {loading ? "..." : "Avisame"}
      </button>
      {error && <p className="basis-full text-xs text-coral-600">{error}</p>}
    </form>
  );
}
