import Link from "next/link";
import { StatusDot } from "@/components/Icon";

type PlatformAlert = {
  type: string;
  severity: "danger" | "warning" | "info";
  message: string;
  href?: string;
};

const SEVERITY_STYLES: Record<PlatformAlert["severity"], { classes: string }> = {
  danger: { classes: "border-coral-200 bg-coral-50" },
  warning: { classes: "border-amber-200 bg-amber-50" },
  info: { classes: "border-jade-200 bg-jade-50" },
};

export default function AlertsPanel({ alerts }: { alerts: PlatformAlert[] }) {
  return (
    <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-bold text-ink">Alertas</h2>
      {alerts.length === 0 ? (
        <p className="text-sm text-ink/50">Todo en orden, no hay nada pendiente de atención.</p>
      ) : (
        <ul className="space-y-2">
          {alerts.map((alert, i) => {
            const style = SEVERITY_STYLES[alert.severity];
            const content = (
              <div className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs text-ink/80 ${style.classes}`}>
                <span className="mt-0.5">
                  <StatusDot tone={alert.severity} />
                </span>
                <span>{alert.message}</span>
              </div>
            );
            return (
              <li key={i}>
                {alert.href ? (
                  <Link href={alert.href} className="block transition hover:opacity-80">
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
