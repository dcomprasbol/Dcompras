import { getStoreBySlug } from "@/lib/repo";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireStoreAdmin(slug: string) {
  const user = await getCurrentUser();
  if (!user) return null;
  const store = await getStoreBySlug(slug);
  if (!store) return null;
  if (store.userId !== user.id) return null;
  return store;
}

function platformAdminEmails(): string[] {
  return (process.env.PLATFORM_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function requirePlatformAdmin() {
  const user = await getCurrentUser();
  if (!user || !user.email) return null;
  if (!platformAdminEmails().includes(user.email.toLowerCase())) return null;
  return user;
}

// ---------- Encargados del Punto Dcompras ----------

/**
 * Puntos que puede operar el usuario logueado: los que tiene asignados como
 * encargado (pickup_operators) o todos, si es admin de plataforma.
 */
export async function getPickupAccess() {
  const user = await getCurrentUser();
  if (!user || !user.email) return null;
  const { listPickupPoints, listPointsForOperator } = await import("@/lib/pickup");
  const isAdmin = platformAdminEmails().includes(user.email.toLowerCase());
  const points = isAdmin ? await listPickupPoints() : await listPointsForOperator(user.email);
  return { user, email: user.email.toLowerCase(), isAdmin, points };
}

/** Encargado (o admin) del punto `pointId`, o null si no puede operarlo. */
export async function requirePickupOperator(pointId: string) {
  const access = await getPickupAccess();
  if (!access) return null;
  const point = access.points.find((p) => p.id === pointId);
  if (!point) return null;
  return { email: access.email, point };
}
