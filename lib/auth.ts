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
