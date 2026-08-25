"use client";

import { useEffect, useState } from "react";

type SupportMessage = {
  id: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
};

export default function AdminSupport({ slug }: { slug: string }) {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function loadMessages() {
    const res = await fetch(`/api/stores/${slug}/support`);
    const data = await res.json();
    setMessages(data.messages || []);
    setLoading(false);
  }

  useEffect(() => {
    loadMessages();
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const res = await fetch(`/api/stores/${slug}/support`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo enviar el mensaje");
        setSending(false);
        return;
      }
      setSubject("");
      setMessage("");
      setSent(true);
      setTimeout(() => setSent(false), 2500);
      loadMessages();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
        <h2 className="mb-1 text-sm font-bold text-ink">Escríbenos</h2>
        <p className="mb-3 text-xs text-ink/50">
          Tu mensaje llega directo al equipo de Dcompras, junto con el WhatsApp de tu tienda para
          que te podamos contactar.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink/70">Asunto</label>
            <input
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ej: No me llegó la confirmación de un pago"
              className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink/70">Mensaje</label>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Contanos qué pasó, con el mayor detalle posible."
              className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-sm text-coral-600">{error}</p>}
          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-full bg-jade-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-jade-600 disabled:opacity-60"
          >
            {sending ? "Enviando..." : sent ? "¡Enviado! ✓" : "Enviar mensaje"}
          </button>
        </form>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-bold text-ink">Mensajes anteriores</h2>
        {loading ? (
          <p className="text-sm text-ink/50">Cargando...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-ink/50">Todavía no escribiste a soporte.</p>
        ) : (
          <div className="space-y-2">
            {messages.map((m) => (
              <div key={m.id} className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-ink">{m.subject}</p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      m.status === "resuelto"
                        ? "bg-jade-50 text-jade-700"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {m.status === "resuelto" ? "Resuelto" : "Abierto"}
                  </span>
                </div>
                <p className="whitespace-pre-line text-sm text-ink/60">{m.message}</p>
                <p className="mt-2 text-xs text-ink/40">
                  {new Date(m.createdAt).toLocaleString("es-BO")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
