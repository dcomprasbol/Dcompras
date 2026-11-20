// Sentry en el navegador. Sin NEXT_PUBLIC_SENTRY_DSN no se inicializa.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
    tracesSampleRate: 0.05,
    sendDefaultPii: false,
    // Errores de extensiones del navegador y de redes móviles inestables que
    // no son bugs nuestros.
    ignoreErrors: ["ResizeObserver loop", "Load failed", "Failed to fetch", "NetworkError"],
  });
}
