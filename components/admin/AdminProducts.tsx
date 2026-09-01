"use client";

import { useEffect, useRef, useState } from "react";
import { formatBs, fileToResizedDataUrl } from "@/lib/utils";

type Variant = { id?: string; label: string; stock: number };
type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  variants: Variant[];
};
type StockNotification = {
  id: string;
  productId: string;
  variantId: string | null;
  contact: string;
};

export default function AdminProducts({ slug }: { slug: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [notifications, setNotifications] = useState<StockNotification[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([{ label: "", stock: 0 }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savedPulse, setSavedPulse] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadProducts() {
    const res = await fetch(`/api/stores/${slug}/products`);
    const data = await res.json();
    setProducts(data.products || []);
  }

  async function loadNotifications() {
    const res = await fetch(`/api/stores/${slug}/notifications`);
    const data = await res.json();
    setNotifications(data.notifications || []);
  }

  useEffect(() => {
    loadProducts();
    loadNotifications();
  }, [slug]);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError(null);
    setImageProcessing(true);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setImageUrl(dataUrl);
    } catch {
      setImageError("No se pudo procesar esa imagen, intenta con otra foto");
    } finally {
      setImageProcessing(false);
    }
  }

  function handleRemoveImage() {
    setImageUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function updateVariant(idx: number, field: "label" | "stock", value: string) {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === idx ? { ...v, [field]: field === "stock" ? Number(value) || 0 : value } : v
      )
    );
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setDescription("");
    setPrice("");
    setCompareAtPrice("");
    handleRemoveImage();
    setHasVariants(false);
    setVariants([{ label: "", stock: 0 }]);
    setError(null);
    setShowForm(false);
  }

  function handleEdit(p: Product) {
    setEditingId(p.id);
    setName(p.name);
    setDescription(p.description || "");
    setPrice(String(p.price));
    setCompareAtPrice(p.compareAtPrice != null ? String(p.compareAtPrice) : "");
    setImageUrl(p.imageUrl || "");
    setError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(
        editingId ? `/api/stores/${slug}/products/${editingId}` : `/api/stores/${slug}/products`,
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            description,
            price: Number(price),
            compareAtPrice: compareAtPrice === "" ? null : Number(compareAtPrice),
            imageUrl: imageUrl || null,
            ...(editingId
              ? {}
              : {
                  variants: hasVariants
                    ? variants
                    : [{ label: "Único", stock: variants[0]?.stock || 0 }],
                }),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo guardar el producto");
        setSaving(false);
        return;
      }
      resetForm();
      await loadProducts();
      // Pulso breve en el botón de "+ Nuevo producto" para confirmar que se
      // guardó, ya que el formulario se cierra solo y podría no notarse.
      setSavedPulse(true);
      setTimeout(() => setSavedPulse(false), 400);
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(productId: string) {
    if (!confirm("¿Eliminar este producto?")) return;
    // Primero se ve la fila achicándose (animate-shrink-out) y recién
    // después se borra de verdad — si desaparece de golpe no queda claro
    // qué pasó.
    setDeletingId(productId);
    await fetch(`/api/stores/${slug}/products/${productId}`, {
      method: "DELETE",
    });
    setTimeout(async () => {
      await loadProducts();
      setDeletingId(null);
    }, 280);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink/50">
          {showForm
            ? editingId
              ? "Edita tu producto"
              : "Completa los datos de tu producto"
            : "Gestiona lo que vendes"}
        </p>
        <button
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
          className={`rounded-full bg-jade-500 px-3.5 py-1.5 text-sm font-semibold text-white transition hover:bg-jade-600 ${
            savedPulse ? "animate-confirm-pulse" : ""
          }`}
        >
          {showForm ? "Cancelar" : "+ Nuevo producto"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-5 space-y-3 rounded-2xl border border-ink/5 bg-white p-4 shadow-sm"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-ink/70">Nombre</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink/70">Precio (Bs)</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink/70">
                Precio anterior (tachado)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
                placeholder="Opcional"
                className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
              />
            </div>
          </div>
          {/* "Precio (Bs)" de arriba es lo que el cliente paga ahora, ya con
              el descuento — este campo es el precio de ANTES, más alto, que
              se muestra tachado al lado. Por eso tiene que ser mayor, no
              menor: quien lo lea acá abajo puede confundir "precio de
              oferta" con "el precio con descuento", que es justo al revés. */}
          {compareAtPrice && Number(compareAtPrice) > 0 && (
            <p className="-mt-2 text-xs text-ink/40">
              {Number(compareAtPrice) > Number(price || 0)
                ? `Tu cliente ve: Bs ${Number(price || 0).toFixed(2)} y, tachado al lado, Bs ${Number(compareAtPrice).toFixed(2)} — con la etiqueta "Oferta -${Math.round(
                    (1 - Number(price || 0) / Number(compareAtPrice)) * 100
                  )}%".`
                : "Poné acá el precio de ANTES del descuento (tiene que ser mayor al precio de arriba) — ese es el que se tacha, no el precio final."}
            </p>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-ink/70">Foto (opcional)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-jade-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-jade-700"
            />
            {imageProcessing && (
              <p className="mt-1 text-xs text-ink/50">Procesando imagen...</p>
            )}
            {imageError && <p className="mt-1 text-xs text-coral-600">{imageError}</p>}
            {imageUrl && !imageProcessing && (
              <div className="mt-2 flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Vista previa"
                  className="h-16 w-16 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-xs font-medium text-coral-500"
                >
                  Quitar foto
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink/70">
              Descripción (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
            />
          </div>

          {!editingId && (
            <>
              <div>
                <label className="flex items-center gap-2 text-sm text-ink/70">
                  <input
                    type="checkbox"
                    checked={hasVariants}
                    onChange={(e) => setHasVariants(e.target.checked)}
                  />
                  Tiene variantes (talla, color, etc.)
                </label>
              </div>

              {hasVariants ? (
                <div className="space-y-2">
                  {variants.map((v, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        placeholder="Ej: M / Negro"
                        value={v.label}
                        onChange={(e) => updateVariant(idx, "label", e.target.value)}
                        className="flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm"
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Stock"
                        value={v.stock}
                        onChange={(e) => updateVariant(idx, "stock", e.target.value)}
                        className="w-24 rounded-lg border border-ink/15 px-3 py-2 text-sm"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setVariants((prev) => [...prev, { label: "", stock: 0 }])}
                    className="text-xs font-medium text-jade-600"
                  >
                    + Agregar otra opción
                  </button>
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink/70">Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={variants[0]?.stock ?? 0}
                    onChange={(e) => updateVariant(0, "stock", e.target.value)}
                    className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
                  />
                </div>
              )}
            </>
          )}

          {editingId && (
            <p className="text-xs text-ink/40">
              El stock y las variantes se manejan desde la ficha del producto al crearlo — acá
              puedes ajustar precio, oferta, foto y descripción.
            </p>
          )}

          {error && <p className="text-sm text-coral-600">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-jade-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-jade-600 disabled:opacity-60"
          >
            {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Guardar producto"}
          </button>
        </form>
      )}

      {products.length === 0 ? (
        <p className="text-sm text-ink/50">Todavía no tienes productos publicados.</p>
      ) : (
        <div className="space-y-2">
          {products.map((p) => {
            const productNotifications = notifications.filter((n) => n.productId === p.id);
            return (
            <div
              key={p.id}
              className={`rounded-2xl border border-ink/5 bg-white p-3 shadow-sm animate-pop ${
                deletingId === p.id ? "animate-shrink-out" : ""
              }`}
            >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-paper">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg">
                      🛍️
                    </div>
                  )}
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                    {p.name}
                    {p.compareAtPrice != null && p.compareAtPrice > p.price && (
                      <span className="rounded-full bg-coral-50 px-1.5 py-0.5 text-[10px] font-semibold text-coral-600">
                        Oferta
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-ink/50">
                    {p.compareAtPrice != null && p.compareAtPrice > p.price ? (
                      <>
                        <span className="text-coral-600">{formatBs(p.price)}</span>{" "}
                        <span className="line-through">{formatBs(p.compareAtPrice)}</span>
                      </>
                    ) : (
                      formatBs(p.price)
                    )}{" "}
                    · {p.variants.reduce((s, v) => s + v.stock, 0)} en stock
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button
                  onClick={() => handleEdit(p)}
                  className="text-xs font-medium text-ink/50 hover:text-ink"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-xs font-medium text-coral-500"
                >
                  Eliminar
                </button>
              </div>
            </div>

            {productNotifications.length > 0 && (
              <div className="mt-2 border-t border-ink/5 pt-2">
                <p className="text-xs font-medium text-ink/60">
                  🔔 {productNotifications.length}{" "}
                  {productNotifications.length === 1 ? "persona quiere" : "personas quieren"} que
                  avises cuando haya stock:
                </p>
                <p className="mt-0.5 text-xs text-ink/40">
                  {productNotifications.map((n) => n.contact).join(" · ")}
                </p>
              </div>
            )}
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
