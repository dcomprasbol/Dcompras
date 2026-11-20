"use client";

// Pantalla de último recurso cuando falla el layout raíz. Reporta el error a
// Sentry (si está configurado) y le ofrece al usuario reintentar.
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f4f3ef", color: "#14102a" }}>
        <main style={{ maxWidth: 420, margin: "0 auto", padding: "80px 16px", textAlign: "center" }}>
          <h1 style={{ fontSize: 22, marginBottom: 12 }}>Algo salió mal</h1>
          <p style={{ fontSize: 15, lineHeight: 1.5, color: "#5b5675", marginBottom: 24 }}>
            Ya nos llegó el aviso del error. Prueba de nuevo en unos segundos.
          </p>
          <button
            onClick={reset}
            style={{ background: "#14102a", color: "#fff", border: 0, borderRadius: 8, padding: "12px 20px", fontSize: 15, cursor: "pointer" }}
          >
            Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}
