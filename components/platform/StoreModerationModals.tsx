"use client";

import { useState } from "react";
import Icon from "@/components/Icon";

// Ventanas de moderación del admin de plataforma (suspender, reactivar y
// eliminar una tienda), compartidas entre Tiendas y Reportes. Suspender y
// eliminar exigen un mensaje para el vendedor: le llega por correo y lo ve
// en su panel. Si el correo no sale (Resend sin configurar, error), se
// avisa y se ofrece mandarle el mismo mensaje por WhatsApp.

export type ModerationStore = {
  id: string;
  name: string;
  status: string;
  whatsapp: string | null;
};

type EmailInfo = { sent: boolean; reason?: string } | undefined;

const DELETE_PHRASE = "D_compras_delete";
const MIN_NOTE = 10;

function waLink(whatsapp: string | null, text: string) {
  if (!whatsapp) return null;
  return `https://wa.me/591${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

function Shell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4" role="dialog" aria-modal="true">
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
        <button type="button" onClick={onClose} aria-label="Cerrar" className="absolute right-4 top-4 text-ink/40 hover:text-ink">
          <Icon name="x" className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

// Resultado después de la acción: confirma si el correo salió y, si no,
// ofrece WhatsApp con el mismo texto.
function EmailOutcome({ email, to, store, text, onDone }: {
  email: EmailInfo;
  to: string | null;
  store: ModerationStore;
  text: string;
  onDone: () => void;
}) {
  const wa = waLink(store.whatsapp, text);
  return (
    <div>
      <p className="flex items-center gap-2 text-sm font-bold text-ink">
        <Icon name="check" className="h-4 w-4" /> Listo
      </p>
      {email?.sent ? (
        <p className="mt-2 text-sm text-ink/60">
          Le enviamos un correo a <strong>{to}</strong> con el motivo. También lo verá en su panel.
        </p>
      ) : (
        <div className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          <p className="font-semibold">No se envió el correo.</p>
          <p className="mt-1">{email?.reason ?? "No se pudo enviar."}</p>
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-jade-600 px-3 py-1.5 text-xs font-semibold text-white"
            >
              <Icon name="chat" mono className="h-3.5 w-3.5" /> Avisarle por WhatsApp
            </a>
          )}
        </div>
      )}
      <button type="button" onClick={onDone} className="mt-4 w-full rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">
        Cerrar
      </button>
    </div>
  );
}

export function SuspendStoreModal({
  store,
  onClose,
  onChanged,
}: {
  store: ModerationStore;
  onClose: () => void;
  onChanged: (status: string, note: string | null) => void;
}) {
  const reactivating = store.status === "suspendida";
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ email: EmailInfo; to: string | null } | null>(null);
  const canSubmit = reactivating || note.trim().length >= MIN_NOTE;

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/platform/stores/${store.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: reactivating ? "aprobada" : "suspendida", note: note.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "No se pudo completar");
        setLoading(false);
        return;
      }
      onChanged(reactivating ? "aprobada" : "suspendida", reactivating ? null : note.trim());
      setResult({ email: data.email, to: data.to ?? null });
    } catch {
      setError("Error de conexión");
    }
    setLoading(false);
  }

  const waText = reactivating
    ? `Hola ${store.name}, te escribimos desde Dcompras: tu tienda fue reactivada y ya vuelve a estar visible para tus clientes.`
    : `Hola ${store.name}, te escribimos desde Dcompras: tu tienda fue suspendida.\n\nMotivo: ${note.trim()}\n\nSi tienes dudas, escríbenos desde la sección Ayuda de tu panel.`;

  return (
    <Shell onClose={onClose}>
      {result ? (
        <EmailOutcome email={result.email} to={result.to} store={store} text={waText} onDone={onClose} />
      ) : reactivating ? (
        <>
          <h3 className="pr-6 text-sm font-bold text-ink">Reactivar &quot;{store.name}&quot;</h3>
          <p className="mt-2 text-sm text-ink/60">
            La tienda vuelve a estar visible para los compradores y se le avisa al vendedor por correo.
          </p>
          {error && <p className="mt-2 text-xs text-coral-600">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button onClick={submit} disabled={loading} className="flex-1 rounded-full bg-jade-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {loading ? "Reactivando..." : "Reactivar tienda"}
            </button>
            <button onClick={onClose} className="rounded-full border border-ink/15 px-4 py-2 text-sm text-ink/60">Cancelar</button>
          </div>
        </>
      ) : (
        <>
          <h3 className="pr-6 text-sm font-bold text-ink">Suspender &quot;{store.name}&quot;</h3>
          <p className="mt-2 text-sm text-ink/60">
            La tienda deja de verse y no puede recibir pedidos hasta que la reactives. El vendedor recibe
            este mensaje por correo y lo ve al entrar a su panel.
          </p>
          <label className="mt-4 block text-xs font-semibold text-ink/70">Motivo de la suspensión</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            maxLength={1500}
            placeholder="Ej: Recibimos varios reportes de pedidos que no llegaron. Para reactivar tu tienda, escríbenos con el detalle de los envíos."
            className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-2 text-sm focus:border-ink/40 focus:outline-none"
          />
          <p className="mt-1 text-[11px] text-ink/40">Mínimo {MIN_NOTE} caracteres.</p>
          {error && <p className="mt-2 text-xs text-coral-600">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button onClick={submit} disabled={!canSubmit || loading} className="flex-1 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
              {loading ? "Suspendiendo..." : "Suspender y avisar"}
            </button>
            <button onClick={onClose} className="rounded-full border border-ink/15 px-4 py-2 text-sm text-ink/60">Cancelar</button>
          </div>
        </>
      )}
    </Shell>
  );
}

export function DeleteStoreModal({
  store,
  onClose,
  onDeleted,
}: {
  store: ModerationStore;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [note, setNote] = useState("");
  const [confirm1, setConfirm1] = useState("");
  const [confirm2, setConfirm2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ email: EmailInfo; to: string | null } | null>(null);
  const canDelete = note.trim().length >= MIN_NOTE && confirm1 === DELETE_PHRASE && confirm2 === DELETE_PHRASE;

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/platform/stores/${store.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm1, confirm2, note: note.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "No se pudo eliminar");
        setLoading(false);
        return;
      }
      onDeleted();
      setResult({ email: data.email, to: data.to ?? null });
    } catch {
      setError("Error de conexión");
    }
    setLoading(false);
  }

  const waText = `Hola ${store.name}, te escribimos desde Dcompras: eliminamos tu tienda.\n\nMotivo: ${note.trim()}\n\nSi tenías ganancias pendientes de liquidar, nos pondremos en contacto contigo.`;

  return (
    <Shell onClose={onClose}>
      {result ? (
        <EmailOutcome email={result.email} to={result.to} store={store} text={waText} onDone={onClose} />
      ) : (
        <>
          <h3 className="pr-6 text-sm font-bold text-coral-600">Eliminar &quot;{store.name}&quot;</h3>
          <p className="mt-2 text-xs text-ink/60">
            Esto esconde la tienda de inmediato, pero <strong>no borra sus datos</strong>: vas a ver su
            facturación en Reportes → Tiendas eliminadas por 30 días, por si queda una liquidación
            pendiente. El dueño podrá crear una tienda nueva con el mismo correo.
          </p>
          <label className="mt-4 block text-xs font-semibold text-ink/70">Mensaje para el vendedor (por qué se elimina)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            maxLength={1500}
            placeholder="Ej: Tu tienda vendía productos que no están permitidos según nuestros Términos y Condiciones."
            className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-2 text-sm focus:border-coral-400 focus:outline-none"
          />
          <p className="mt-1 text-[11px] text-ink/40">Mínimo {MIN_NOTE} caracteres. Le llega por correo.</p>
          <p className="mt-3 text-xs text-ink/60">
            Para confirmar, escribe <code className="rounded bg-paper px-1 py-0.5 font-mono">{DELETE_PHRASE}</code> dos veces:
          </p>
          <input value={confirm1} onChange={(e) => setConfirm1(e.target.value)} placeholder={DELETE_PHRASE} autoComplete="off" className="mt-2 w-full rounded-lg border border-ink/15 px-3 py-2 font-mono text-sm" />
          <input value={confirm2} onChange={(e) => setConfirm2(e.target.value)} placeholder={DELETE_PHRASE} autoComplete="off" className="mt-2 w-full rounded-lg border border-ink/15 px-3 py-2 font-mono text-sm" />
          {error && <p className="mt-2 text-xs text-coral-600">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button onClick={submit} disabled={!canDelete || loading} className="flex-1 rounded-full bg-coral-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
              {loading ? "Eliminando..." : "Eliminar y avisar"}
            </button>
            <button onClick={onClose} className="rounded-full border border-ink/15 px-4 py-2 text-sm text-ink/60">Cancelar</button>
          </div>
        </>
      )}
    </Shell>
  );
}
