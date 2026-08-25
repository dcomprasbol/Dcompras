import LogoutButton from "@/components/LogoutButton";

function LogoutIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M7.5 17.5h-3a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1h3" />
      <path d="M12.5 13.5 17 9l-4.5-4.5" />
      <path d="M17 9H7.5" />
    </svg>
  );
}

export default function AccountMenu({
  email,
  redirectTo = "/",
}: {
  email: string;
  redirectTo?: string;
}) {
  const initial = email ? email.charAt(0).toUpperCase() : "?";

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 rounded-full border border-ink/10 bg-paper py-1 pl-1 pr-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-jade-500 text-[11px] font-bold text-white">
          {initial}
        </span>
        <span className="hidden max-w-[11rem] truncate text-xs font-medium text-ink/70 sm:inline">
          {email}
        </span>
      </div>
      <LogoutButton
        redirectTo={redirectTo}
        aria-label="Cerrar sesión"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ink/10 bg-white text-ink/40 shadow-sm transition hover:border-coral-200 hover:bg-coral-50 hover:text-coral-600"
      >
        <LogoutIcon />
      </LogoutButton>
    </div>
  );
}
