"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import GoogleButton from "@/components/GoogleButton";
import LogoutButton from "@/components/LogoutButton";
import { STORE_CATEGORIES, STORE_FONTS, DEFAULT_STORE_COLOR, BOLIVIA_DEPARTMENTS } from "@/lib/utils";

type Step = "cuenta" | "tienda" | "personalizacion";
type InitialSession = { email: string | null; ownerName: string } | null;

const STEP_LABELS: { key: Step; label: string }[] = [
  { key: "cuenta", label: "Tu cuenta" },
  { key: "tienda", label: "Tu tienda" },
  { key: "personalizacion", label: "Personalización" },
];

export default function CrearTiendaForm({ initialSession }: { initialSession: InitialSession }) {
  const router = useRouter();

  // El server component (page.tsx) ya resolvió si hay sesión activa (y si
  // esa cuenta ya tenía tienda, ni siquiera llegamos acá — nos mandó
  // directo a /admin/[slug]). Por eso arrancamos con el paso correcto de
  // una, sin parpadeo ni fetch extra en el cliente.
  const [sessionEmail, setSessionEmail] = useState<string | null>(initialSession?.email ?? null);
  const [step, setStep] = useState<Step>(initialSession ? "tienda" : "cuenta");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);

  // Paso 2: personalización de la tienda (solo se muestra con sesión activa).
  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState(initialSession?.ownerName ?? "");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState<string>(STORE_CATEGORIES[0].value);
  const [themeColor, setThemeColor] = useState(DEFAULT_STORE_COLOR);
  const [logoUrl, setLogoUrl] = useState("");
  const [fontChoice, setFontChoice] = useState<string>(STORE_FONTS[0].value);
  const [tagline, setTagline] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [tiendaError, setTiendaError] = useState<string | null>(null);
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);

  const hasSocialLink = [instagramUrl, tiktokUrl, facebookUrl].some((v) => v.trim());

  function handleContinueToPersonalization(e: React.FormEvent) {
    e.preventDefault();
    setTiendaError(null);
    if (!hasSocialLink) {
      setTiendaError("Agrega al menos una red social para que podamos confirmar que tu tienda es real");
      return;
    }
    setStep("personalizacion");
  }

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    setAccountError(null);
    setAccountLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setAccountError(
        error.message === "User already registered"
          ? "Ya existe una cuenta con ese email, inicia sesión en vez de crear una nueva"
          : error.message
      );
      setAccountLoading(false);
      return;
    }

    if (!data.session) {
      // El proyecto de Supabase exige confirmar el correo antes de dar sesión.
      setNeedsEmailConfirm(true);
      setAccountLoading(false);
      return;
    }

    setSessionEmail(data.session.user.email ?? null);
    setStep("tienda");
    setAccountLoading(false);
  }

  async function handleCreateStore(e: React.FormEvent) {
    e.preventDefault();
    setStoreError(null);

    if (!hasSocialLink) {
      setStoreError("Agrega al menos una red social para que podamos confirmar que tu tienda es real");
      return;
    }

    setStoreLoading(true);
    try {
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          ownerName,
          whatsapp,
          city,
          category,
          themeColor,
          logoUrl,
          fontChoice,
          tagline,
          instagramUrl,
          tiktokUrl,
          facebookUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStoreError(data.error || "No se pudo crear la tienda");
        setStoreLoading(false);
        return;
      }
      router.push(`/admin/${data.slug}`);
      router.refresh();
    } catch {
      setStoreError("Error de conexión. Intenta de nuevo.");
      setStoreLoading(false);
    }
  }

  if (needsEmailConfirm) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink px-5">
        <div className="ticket mx-auto max-w-sm p-8 text-center text-ink">
          <p className="text-2xl">📬</p>
          <h1 className="mt-2 font-display text-lg font-bold">Confirma tu correo</h1>
          <p className="mt-2 text-sm text-ink/60">
            Te enviamos un link de confirmación a <strong>{email}</strong>. Ábrelo y luego
            vuelve a{" "}
            <Link href="/login" className="text-jade-600 underline">
              iniciar sesión
            </Link>{" "}
            para personalizar tu tienda.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-5 py-16">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-jade-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-coral-500/20 blur-3xl" />

      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-light.png" alt="Dcompras" className="h-7 w-auto" />
        </Link>

        <div className="mb-5 text-center text-white">
          <h1 className="font-display text-2xl font-bold">Crea tu tienda gratis</h1>
          <p className="mt-2 text-sm text-white/60">
            Sube tu catálogo, comparte el link, y recibe pedidos ordenados sin depender solo
            de WhatsApp.
          </p>
        </div>

        {/* Indicador de paso */}
        <div className="mb-5 flex items-center justify-center gap-2 text-xs font-semibold">
          {STEP_LABELS.map((s, i) => {
            const currentIndex = STEP_LABELS.findIndex((x) => x.key === step);
            const isCurrent = s.key === step;
            const isDone = i < currentIndex;
            return (
              <span key={s.key} className="flex items-center gap-2">
                {i > 0 && <span className="h-px w-6 bg-white/15" />}
                <span className={isCurrent ? "text-white" : isDone ? "text-jade-400" : "text-white/30"}>
                  {i + 1}. {s.label}
                </span>
              </span>
            );
          })}
        </div>

        {step === "cuenta" && (
          <>
            <div className="mb-4 space-y-4 rounded-3xl bg-white p-7 shadow-2xl">
              <GoogleButton label="Crear con Google" />
              <div className="flex items-center gap-3 text-xs text-ink/40">
                <div className="h-px flex-1 bg-ink/10" />
                o con tu email
                <div className="h-px flex-1 bg-ink/10" />
              </div>

              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink/70">Email</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-ink/10 px-3.5 py-2.5 text-sm focus:border-jade-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink/70">Contraseña</label>
                  <input
                    required
                    type="password"
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-ink/10 px-3.5 py-2.5 text-sm focus:border-jade-500 focus:outline-none"
                  />
                </div>

                {accountError && <p className="text-sm text-coral-600">{accountError}</p>}

                <button
                  type="submit"
                  disabled={accountLoading}
                  className="w-full rounded-full bg-jade-500 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-jade-600 disabled:opacity-60"
                >
                  {accountLoading ? "Creando cuenta..." : "Crear cuenta y continuar →"}
                </button>
              </form>
            </div>

            <p className="mt-5 text-center text-xs text-white/40">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-white/70 underline">
                Inicia sesión
              </Link>
            </p>
          </>
        )}

        {step === "tienda" && (
          <form
            onSubmit={handleContinueToPersonalization}
            className="space-y-4 rounded-3xl bg-white p-7 shadow-2xl"
          >
            {sessionEmail && (
              <p className="text-xs text-ink/40">
                Conectado como <strong className="text-ink/70">{sessionEmail}</strong> ·{" "}
                <LogoutButton redirectTo="/crear-tienda" className="underline hover:text-ink/70">
                  Cerrar sesión
                </LogoutButton>
              </p>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-ink/70">
                Nombre de tu tienda
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Ropa Andrea"
                className="w-full rounded-xl border border-ink/10 px-3.5 py-2.5 text-sm focus:border-jade-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink/70">Tu nombre completo</label>
              <input
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Ej: Andrea Pérez"
                className="w-full rounded-xl border border-ink/10 px-3.5 py-2.5 text-sm focus:border-jade-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink/70">Tu WhatsApp</label>
              <input
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Ej: 70123456"
                className="w-full rounded-xl border border-ink/10 px-3.5 py-2.5 text-sm focus:border-jade-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink/70">Departamento</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-ink/10 px-3.5 py-2.5 text-sm focus:border-jade-500 focus:outline-none"
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
                Nos ayuda a confirmar que tu tienda es real antes de aprobarla. Agrega al menos
                una.
              </p>
              <div className="space-y-2">
                <input
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="Instagram: https://instagram.com/tu_negocio"
                  className="w-full rounded-xl border border-ink/10 px-3.5 py-2.5 text-sm focus:border-jade-500 focus:outline-none"
                />
                <input
                  value={tiktokUrl}
                  onChange={(e) => setTiktokUrl(e.target.value)}
                  placeholder="TikTok: https://tiktok.com/@tu_negocio"
                  className="w-full rounded-xl border border-ink/10 px-3.5 py-2.5 text-sm focus:border-jade-500 focus:outline-none"
                />
                <input
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  placeholder="Facebook: https://facebook.com/tu_negocio"
                  className="w-full rounded-xl border border-ink/10 px-3.5 py-2.5 text-sm focus:border-jade-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink/70">¿Qué vendes?</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-ink/10 px-3.5 py-2.5 text-sm focus:border-jade-500 focus:outline-none"
              >
                {STORE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {tiendaError && <p className="text-sm text-coral-600">{tiendaError}</p>}

            <button
              type="submit"
              className="w-full rounded-full bg-jade-500 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-jade-600"
            >
              Continuar →
            </button>
          </form>
        )}

        {step === "personalizacion" && (
          <form onSubmit={handleCreateStore} className="space-y-4 rounded-3xl bg-white p-7 shadow-2xl">
            <button
              type="button"
              onClick={() => setStep("tienda")}
              className="text-xs font-medium text-ink/40 hover:text-ink/70"
            >
              ← Volver a los datos de tu tienda
            </button>

            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-ink/70">
                  Color de tu marca
                </label>
                <input
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  placeholder="#0EA57A"
                  className="w-full rounded-xl border border-ink/10 px-3.5 py-2.5 text-sm focus:border-jade-500 focus:outline-none"
                />
              </div>
              <input
                type="color"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="h-[42px] w-14 shrink-0 cursor-pointer rounded-xl border border-ink/10 p-1"
                aria-label="Elegir color de marca"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink/70">
                Logo (URL de una imagen, opcional)
              </label>
              <div className="flex items-center gap-3">
                {logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt="Vista previa del logo"
                    className="h-10 w-10 shrink-0 rounded-lg border border-ink/10 object-cover"
                  />
                )}
                <input
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-ink/10 px-3.5 py-2.5 text-sm focus:border-jade-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink/70">
                Tipografía de tu página
              </label>
              <select
                value={fontChoice}
                onChange={(e) => setFontChoice(e.target.value)}
                className="w-full rounded-xl border border-ink/10 px-3.5 py-2.5 text-sm focus:border-jade-500 focus:outline-none"
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
                Frase de portada (opcional)
              </label>
              <input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Ej: Cuidado natural para cada piel"
                maxLength={80}
                className="w-full rounded-xl border border-ink/10 px-3.5 py-2.5 text-sm focus:border-jade-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-ink/40">
                Es lo primero que ve un cliente al entrar a tu tienda. Si lo dejas vacío, usamos un
                saludo genérico.
              </p>
            </div>

            {storeError && <p className="text-sm text-coral-600">{storeError}</p>}

            <button
              type="submit"
              disabled={storeLoading}
              className="w-full rounded-full bg-jade-500 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-jade-600 disabled:opacity-60"
            >
              {storeLoading ? "Creando..." : "Crear mi tienda →"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
