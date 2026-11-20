// Punto de entrada de Sentry en servidor (Node y Edge). Next 14 lo carga
// gracias a experimental.instrumentationHook en next.config.js.
import * as Sentry from "@sentry/nextjs";

export async function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
      // Trazas de rendimiento: una muestra chica alcanza y no gasta la cuota gratis.
      tracesSampleRate: 0.05,
      sendDefaultPii: false,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
