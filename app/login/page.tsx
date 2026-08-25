"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import GoogleButton from "@/components/GoogleButton";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // A dónde volver después de loguearse — ej. un comprador que vino desde
  // el checkout de una tienda. Si no viene, cae al resolver de /admin de
  // siempre (que a su vez manda a cada quien a lo suyo: panel de vendedor,
  // /plataforma, o /mis-pedidos).
  const next = searchParams.get("next");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(searchParams.get("error"));
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}` },
      });
      if (error) {
        setError(
          error.message === "User already registered"
            ? "Ya existe una cuenta con ese email, inicia sesión en vez de crear una nueva"
            : error.message
        );
        setLoading(false);
        return;
      }
      if (!data.session) {
        // El proyecto de Supabase exige confirmar el correo antes de dar sesión.
        setNeedsEmailConfirm(true);
        setLoading(false);
        return;
      }
      router.push(next || "/admin");
      router.refresh();
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message === "Invalid login credentials"
        ? "Email o contraseña incorrectos"
        : error.message);
      setLoading(false);
      return;
    }
    router.push(next || "/admin");
    router.refresh();
  }

  if (needsEmailConfirm) {
    return (
      <main className="relative flex min-h-screen items-center justify-center bg-ink px-5 py-16">
        <div className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl">
          <p className="text-2xl">📬</p>
          <h1 className="mt-2 font-display text-xl font-bold text-ink">Revisa tu correo</h1>
          <p className="mt-2 text-sm text-ink/60">
            Te mandamos un link a <span className="font-medium">{email}</span> para confirmar tu
            cuenta. Apenas lo confirmes, ya puedes iniciar sesión.
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
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-jade-500 font-display text-lg font-bold text-white">
            D
          </span>
          <span className="font-display text-lg font-bold text-white">Dcompras</span>
        </Link>

        <div className="mb-6 text-center text-white">
          <h1 className="font-display text-2xl font-bold">
            {mode === "signup" ? "Crea tu cuenta" : "Inicia sesión"}
          </h1>
          <p className="mt-2 text-sm text-white/60">
            {mode === "signup"
              ? "Para ver tus pedidos y comprar más rápido la próxima vez."
              : "Entra a tu cuenta de Dcompras."}
          </p>
        </div>

        <div className="space-y-4 rounded-3xl bg-white p-7 shadow-2xl">
          {error && <p className="text-sm text-coral-600">{error}</p>}

          <GoogleButton label="Continuar con Google" next={next || undefined} />

          <div className="flex items-center gap-3 text-xs text-ink/40">
            <div className="h-px flex-1 bg-ink/10" />
            o con tu email
            <div className="h-px flex-1 bg-ink/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              minLength={mode === "signup" ? 6 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-ink/10 px-3.5 py-2.5 text-sm focus:border-jade-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-jade-500 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-jade-600 disabled:opacity-60"
          >
            {loading
              ? mode === "signup" ? "Creando cuenta..." : "Entrando..."
              : mode === "signup" ? "Crear cuenta →" : "Entrar →"}
          </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode((m) => (m === "signup" ? "login" : "signup"));
              setError(null);
            }}
            className="w-full text-center text-xs font-medium text-ink/50 hover:text-ink"
          >
            {mode === "signup" ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
          </button>
        </div>

        <p className="mt-5 text-center text-xs text-white/40">
          ¿Todavía no tienes tienda?{" "}
          <Link href="/crear-tienda" className="text-white/70 underline">
            Créala gratis
          </Link>
        </p>
      </div>
    </main>
  );
}
