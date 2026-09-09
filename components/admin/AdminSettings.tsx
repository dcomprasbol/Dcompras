"use client";

import { useEffect, useRef, useState } from "react";
import {
  STORE_CATEGORIES,
  STORE_FONTS,
  DEFAULT_STORE_COLOR,
  BOLIVIA_DEPARTMENTS,
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
  const [category, setCategory] = useState<string>(STORE_CATEGORIES[0].value);
  const [themeColor, setThemeColor] = useState(DEFAULT_STORE_COLOR);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoProcessing, setLogoProcessing] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const [fontChoice, setFontChoice] = useState<string>(STORE_FONTS[0].value);
  const [tagline, setTagline] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
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
        setCategory(d.store.category || STORE_CATEGORIES[0].value);
        setThemeColor(d.store.themeColor || DEFAULT_STORE_COLOR);
        setLogoUrl(d.store.logoUrl || "");
        setFontChoice(d.store.fontChoice || STORE_FONTS[0].value);
        setTagline(d.store.tagline || "");
        setInstagramUrl(d.store.instagramUrl || "");
        setTiktokUrl(d.store.tiktokUrl || "");
        setFacebookUrl(d.store.facebookUrl || "");
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
        category,
        themeColor,
        logoUrl,
        fontChoice,
        tagline,
        instagramUrl,
        tiktokUrl,
        facebookUrl,
        dropAt: dropAt || null,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError(null);
    setLogoProcessing(true);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setLogoUrl(dataUrl);
    } catch {
      setLogoError("No se pudo procesar esa imagen, intenta con otra foto");
    } finally {
      setLogoProcessing(false);
    }
  }

  function handleRemoveLogo() {
    setLogoUrl("");
    if (logoFileInputRef.current) logoFileInputRef.current.value = "";
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
          <label className="mb-1 block text-sm font-medium text-ink/70">Logo</label>
          <input
            ref={logoFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-jade-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-jade-700"
          />
          {logoProcessing && <p className="mt-1 text-xs text-ink/50">Procesando imagen...</p>}
          {logoError && <p className="mt-1 text-xs text-coral-600">{logoError}</p>}
          {logoUrl && !logoProcessing && (
            <div className="mt-2 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt="Vista previa del logo"
                className="h-16 w-16 rounded-lg border object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="text-xs font-medium text-coral-500"
              >
                Quitar foto
              </button>
            </div>
          )}
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
          vez del texto de bienvenida normal, sirve para generar expectativa antes de sacar un
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
        <h2 className="mb-1 text-sm font-bold text-ink">💰 Ingresa tu QR para que te depositemos tus ganancias</h2>
        <p className="mb-3 text-xs text-ink/50">
          Es el QR de cualquier cuenta tuya (banco o billetera móvil) donde quieras recibir la
          plata de tus ventas. Así funciona cuando agendes una liquidación desde la pestaña
          Billetera:
        </p>
        <ol className="mb-4 space-y-2 text-xs text-ink/60">
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-jade-100 text-[11px] font-bold text-jade-700">
              1
            </span>
            <span>Agendás la liquidación de lo que vendiste, cuando quieras.</span>
          </li>
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-jade-100 text-[11px] font-bold text-jade-700">
              2
            </span>
            <span>Dcompras te transfiere escaneando este QR, y te sube el comprobante.</span>
          </li>
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-jade-100 text-[11px] font-bold text-jade-700">
              3
            </span>
            <span>Vos confirmás que te llegó y ahí queda cerrada la liquidación.</span>
          </li>
        </ol>
        <div>
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
      </div>

      <button
        type="submit"
        disabled={saving}
        className={`w-full rounded-full bg-jade-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-jade-600 disabled:opacity-60 ${
          saved ? "animate-confirm-pulse" : ""
        }`}
      >
        {saving ? "Guardando..." : saved ? "¡Guardado! ✓" : "Guardar cambios"}
      </button>
    </form>
  );
}
