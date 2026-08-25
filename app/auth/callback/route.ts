import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Adonde Supabase redirige de vuelta después del login con Google (u otro
// proveedor OAuth). Intercambia el código por una sesión real (cookies) y
// manda al usuario al resolver de /admin, que decide si va a su panel o a
// crear su tienda.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  // A dónde volver si vino de un lugar puntual (ej. un comprador que se
  // logueó desde el checkout de una tienda) — solo aceptamos rutas propias
  // (empiezan con "/"), nunca una URL externa, para no abrir un redirect a
  // cualquier sitio.
  const nextParam = req.nextUrl.searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") ? nextParam : "/admin";
  // Supabase también puede volver con ?error=...&error_description=... en vez
  // de ?code=..., por ejemplo si el usuario cancela el consentimiento de Google.
  const oauthError = req.nextUrl.searchParams.get("error_description")
    || req.nextUrl.searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(oauthError)}`, req.url)
    );
  }

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, req.url)
      );
    }
  }

  return NextResponse.redirect(new URL(next, req.url));
}
