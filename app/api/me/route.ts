import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

// Endpoint chico para que componentes de cliente (checkout, header de
// tienda) sepan si hay un comprador logueado, sin tener que convertir toda
// la página en server component. No expone nada sensible, solo lo mínimo.
export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({
    user: user ? { id: user.id, email: user.email ?? null } : null,
  });
}
