"use client";

import { useEffect, useRef, useState } from "react";
import {
  STORE_CATEGORIES,
  STORE_FONTS,
  DEFAULT_STORE_COLOR,
  BOLIVIA_DEPARTMENTS,
  BANK_ACCOUNT_TYPES,
  fileToResizedDataUrl,
} from "@/lib/utils";

export default function AdminSettings({ slug }: { slug: string }) {
  const [ownerName, setOwnerName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("");
  const [paymentQrImageUrl, setPaymentQrImageUrl] = useState("");
  const [qrProcessing, setQrProcessing] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const qrFileInputRef = useRef<HTMLInputElement>(null);
  const [paymentInstructions, setPaymentInstructions] = useState("");
  const [category, setCategory] = useState<string>(STORE_CATEGORIES[0].value);
  const [themeColor, setThemeColor] = useState(DEFAULT_STORE_COLOR);
  const [logoUrl, setLogoUrl] = useState("");
  const [fontChoice, setFontChoice] = useState<string>(STORE_FONTS[0].value);
  const [tagline, setTagline] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountHolder, setBankAccountHolder] = useState("");
  const [bankAccountType, setBankAccountType] = useState<string>(BANK_ACCOUNT_TYPES[0].value);
  const [dropAt, setDropAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/stores/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        setOwnerName(d.store.ownerName || "");
        setWhatsapp(d.store.whatsapp || "");
        setCity(d.store.city || "");
        setPaymentQrImageUrl(d.store.paymentQrImageUrl || "");
        setPaymentInstructions(d.store.paymentInstructions || "");
        setCategory(d.store.category || STORE_CATEGORIES[0].value);
        setThemeColor(d.store.themeColor || DEFAULT_STORE_COLOR);
        setLogoUrl(d.store.logoUrl || "");
        setFontChoice(d.store.fontChoice || STORE_FONTS[0].value);
        setTagline(d.store.tagline || "");
        setInstagramUrl(d.store.instagramUrl || "");
        setTiktokUrl(d.store.tiktokUrl || "");
        setFacebookUrl(d.store.facebookUrl || "");
        setBankName(d.store.bankName || "");
        setBankAccountNumber(d.store.bankAccountNumber || "");
        setBankAccountHolder(d.store.bankAccountHolder || "");
        setBankAccountType(d.store.bankAccountType || BANK_ACCOUNT_TYPES[0].value);
        setDropAt(d.store.dropAt || "");
        setLoading(false);
      });
  }, [slug]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/stores/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerName,
        whatsapp,
        city,
        paymentQrImageUrl,
        paymentInstructions,
        category,
        themeColor,
        logoUrl,
        fontChoice,
        tagline,
        instagramUrl,
        tiktokUrl,
        facebookUrl,
        bankName,
        bankAccountNumber,
        bankAccountHolder,
        bankAccountType,
        dropAt: dropAt || null,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleQrChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrError(null);
    setQrProcessing(true);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setPaymentQrImageUrl(dataUrl);
    } catch {
      setQrError("No se pudo procesar esa imagen, intenta con otra foto");
    } finally {
      setQrProcessing(false);
    }
  }

  function handleRemoveQr() {
    setPaymentQrImageUrl("");
    if (qrFileInputRef.current) qrFileInputRef.current.value = "";
  }

  if (loading) return <p className="text-sm text-ink/50">Cargando...</p>;

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-bold text-ink">Datos de la tienda</h2>
        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-ink/70">Nombre del dueño</label>
          <input
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
          />
        </div>
        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-ink/70">WhatsApp</label>
          <input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
          />
        </div>
        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-ink/70">Departamento</label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
          >
            <option value="">Selecciona un departamento</option>
            {BOLIVIA_DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/70">Redes sociales</label>
          <p className="mb-2 text-xs text-ink/40">
            Le sirven a la plataforma para confirmar que tu tienda es real.
          </p>
          <div className="space-y-2">
            <input
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="Instagram: https://instagram.com/tu_negocio"
              className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
            />
            <input
              value={tiktokUrl}
              onChange={(e) => setTiktokUrl(e.target.value)}
              placeholder="TikTok: https://tiktok.com/@tu_negocio"
              className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
            />
            <input
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              placeholder="Facebook: https://facebook.com/tu_negocio"
              className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-bold text-ink">Personalización</h2>
        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-ink/70">¿Qué vendes?</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
          >
            {STORE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3 flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-ink/70">Color de marca</label>
            <input
              value={themeColor}
              onChange={(e) => setThemeColor(e.target.value)}
              className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
            />
          </div>
          <input
            type="color"
            value={themeColor}
            onChange={(e) => setThemeColor(e.target.value)}
            className="h-[38px] w-12 shrink-0 cursor-pointer rounded-lg border border-ink/15 p-1"
            aria-label="Elegir color de marca"
          />
        </div>
        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-ink/70">Logo (URL de imagen)</label>
          <div className="flex items-center gap-3">
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Vista previa del logo"
                className="h-9 w-9 shrink-0 rounded-lg border object-cover"
              />
            )}
            <input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-ink/70">Tipografía</label>
          <select
            value={fontChoice}
            onChange={(e) => setFontChoice(e.target.value)}
            className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
          >
            {STORE_FONTS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/70">
            Frase de portada
          </label>
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Ej: Cuidado natural para cada piel"
            maxLength={80}
            className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
        <h2 className="mb-1 text-sm font-bold text-ink">Lanzamiento programado (drop)</h2>
        <p className="mb-3 text-xs text-ink/50">
          Opcional. Si pones una fecha y hora futura, tu portada muestra una cuenta regresiva en
          vez del texto de bienvenida normal — sirve para generar expectativa antes de sacar un
          producto nuevo. Déjalo vacío para no mostrar nada.
        </p>
        <input
          type="datetime-local"
          value={dropAt}
          onChange={(e) => setDropAt(e.target.value)}
          className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
        />
      </div>

      <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
        <h2 className="mb-1 text-sm font-bold text-ink">Datos bancarios</h2>
        <p className="mb-3 text-xs text-ink/50">
          A esta cuenta te liquidamos lo que te corresponde de tus ventas por QR (ver pestaña
          Billetera). Si ya subiste tu QR más abajo, no hace falta que llenes esto — con
          cualquiera de los dos alcanza para poder pagarte.
        </p>
        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-ink/70">Banco</label>
          <input
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="Ej: Banco BISA"
            className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
          />
        </div>
        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink/70">N° de cuenta</label>
            <input
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value)}
              className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink/70">Tipo de cuenta</label>
            <select
              value={bankAccountType}
              onChange={(e) => setBankAccountType(e.target.value)}
              className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
            >
              {BANK_ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/70">Titular de la cuenta</label>
          <input
            value={bankAccountHolder}
            onChange={(e) => setBankAccountHolder(e.target.value)}
            placeholder="Nombre completo como figura en el banco"
            className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
        <h2 className="mb-1 text-sm font-bold text-ink">Tu QR para que te liquidemos</h2>
        <p className="mb-3 text-xs text-ink/50">
          Este QR nunca lo ve el comprador — es solo para que Dcompras te transfiera tu
          liquidación (Billetera) escaneándolo, como alternativa a llenar los datos bancarios de
          arriba. Con cualquiera de los dos alcanza.
        </p>
        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-ink/70">Foto de tu QR</label>
          <input
            ref={qrFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleQrChange}
            className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-jade-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-jade-700"
          />
          {qrProcessing && <p className="mt-1 text-xs text-ink/50">Procesando imagen...</p>}
          {qrError && <p className="mt-1 text-xs text-coral-600">{qrError}</p>}
          {paymentQrImageUrl && !qrProcessing && (
            <div className="mt-2 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={paymentQrImageUrl}
                alt="Vista previa QR"
                className="h-32 w-32 rounded-lg border object-contain"
              />
              <button
                type="button"
                onClick={handleRemoveQr}
                className="text-xs font-medium text-coral-500"
              >
                Quitar foto
              </button>
            </div>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/70">
            Instrucciones para el comprador
          </label>
          <textarea
            value={paymentInstructions}
            onChange={(e) => setPaymentInstructions(e.target.value)}
            rows={2}
            placeholder="Ej: Envía tu comprobante por WhatsApp para confirmar tu pedido."
            className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-full bg-jade-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-jade-600 disabled:opacity-60"
      >
        {saving ? "Guardando..." : saved ? "¡Guardado! ✓" : "Guardar cambios"}
      </button>
    </form>
  );
}
