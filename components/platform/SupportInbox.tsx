"use client";

import { useState } from "react";

type SupportMessage = {
  id: string;
  storeName: string;
  storeSlug: string;
  storeWhatsapp: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
};

export default function SupportInbox({ initialMessages }: { initialMessages: SupportMessage[] }) {
  const [messages, setMessages] = useState<SupportMessage[]>(initialMessages);

  async function markResuelto(id: string) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: "resuelto" } : m)));
    await fetch(`/api/platform/support/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resuelto" }),
    });
  }

  if (messages.length === 0) {
    return <p className="text-sm text-ink/50">Todavía no llegó ningún mensaje de soporte.</p>;
  }

  return (
    <div className="space-y-3">
      {messages.map((m) => (
        <div key={m.id} className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
          <div className="mb-1 flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-ink">{m.subject}</p>
              <p className="text-xs text-ink/50">
                {m.storeName} · /{m.storeSlug}
              </p>
            </div>
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
          <p className="whitespace-pre-line text-sm text-ink/70">{m.message}</p>
          <p className="mt-2 text-xs text-ink/40">
            {new Date(m.createdAt).toLocaleString("es-BO")}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <a
              href={`https://wa.me/${m.storeWhatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-ink/15 px-2.5 py-1 text-xs font-medium text-ink/60"
            >
              Responder por WhatsApp ↗
            </a>
            {m.status !== "resuelto" && (
              <button
                onClick={() => markResuelto(m.id)}
                className="rounded-lg border border-jade-500 bg-jade-50 px-2.5 py-1 text-xs font-medium text-jade-700"
              >
                Marcar como resuelto
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
