// Alertas para problemas que alguien del equipo tiene que mirar a mano:
// un pago confirmado por el banco cuyo monto no cuadra, un webhook que no
// encuentra su pedido, etc. Antes eso quedaba solo en console.error, que
// nadie lee hasta que un vendedor reclama.
//
// Cada alerta va a:
//   - Sentry (si NEXT_PUBLIC_SENTRY_DSN está configurado), con los datos
//     como contexto para poder buscarla y agruparla;
//   - un correo a cada dirección de PLATFORM_ADMIN_EMAILS (si Resend está
//     configurado — ver lib/email.ts);
//   - console.error, siempre (queda en los logs de Vercel).
// Nunca tira error: una alerta que falla no debe cortar el webhook.

import * as Sentry from "@sentry/nextjs";
import { sendPlatformAlertEmail } from "@/lib/email";

export async function alertPlatform(title: string, details: Record<string, unknown>): Promise<void> {
  const text = Object.entries(details)
    .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
    .join("\n");
  console.error(`[ALERTA] ${title}\n${text}`);

  try {
    Sentry.captureMessage(title, { level: "error", extra: details, tags: { kind: "platform-alert" } });
  } catch {
    // Sentry sin configurar o caído: seguimos.
  }

  const recipients = (process.env.PLATFORM_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  await Promise.all(recipients.map((to) => sendPlatformAlertEmail(to, title, text).catch(() => null)));
}
