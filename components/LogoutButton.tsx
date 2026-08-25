"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton({
  redirectTo = "/",
  className,
  children = "Cerrar sesión",
  "aria-label": ariaLabel,
}: {
  redirectTo?: string;
  className?: string;
  children?: React.ReactNode;
  "aria-label"?: string;
}) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <button onClick={handleLogout} className={className} aria-label={ariaLabel}>
      {children}
    </button>
  );
}
