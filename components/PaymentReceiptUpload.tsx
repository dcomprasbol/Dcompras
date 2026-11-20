"use client";

// Pago coordinado: después de transferir, el comprador sube la captura de
// su comprobante. El pedido queda "por verificar" en el panel del vendedor,
// que igual tiene que confirmar en su banco (una captura se puede editar).
import { useState } from "react";
import { useRouter } from "next/navigation";
import { fileToResizedDataUrl } from "@/lib/utils";
import Icon from "@/components/Icon";

export default function PaymentReceiptUpload({
  slug,
  orderId,
  alreadyUploaded,
}: {
  slug: string;
  orderId: string;
  alreadyUploaded: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "uploading" | "done">(alreadyUploaded ? "done" : "idle");
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setState("uploading");
    try {
      const receipt = await fileToResizedDataUrl(file);
      const res = await fetch(`/api/stores/${slug}/orders/${orderId}/receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "No se pudo subir el comprobante");
        setState("idle");
        return;
      }
      setState("done");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "No se pudo leer la imagen");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <p className="mt-3 border border-jade-400 bg-jade-50 px-3 py-2.5 text-center text-xs font-semibold text-jade-700">
        <Icon name="check" mono className="mr-1 h-3.5 w-3.5" />
        Recibimos tu comprobante. La tienda lo está verificando en su banco.
      </p>
    );
  }

  return (
    <div className="mt-3">
      <label className="flex cursor-pointer items-center justify-center gap-2 border border-dashed border-amber-400 bg-white px-3 py-3 text-sm font-semibold text-ink">
        <Icon name="clipboard" className="h-4 w-4" />
        {state === "uploading" ? "Subiendo..." : "Ya pagué: subir mi comprobante"}
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={state === "uploading"} />
      </label>
      <p className="mt-1 text-center text-[11px] text-ink/40">Así no tienes que mandar la captura por WhatsApp.</p>
      {error && <p className="mt-1 text-center text-xs text-coral-600">{error}</p>}
    </div>
  );
}
