const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  experimental: {
    // Next 14 necesita esto para cargar instrumentation.ts (Sentry en servidor).
    instrumentationHook: true,
    // sharp (lib/storage.ts) es un binario nativo: no se empaqueta.
    serverComponentsExternalPackages: ["sharp"],
  },
};

// Sentry (monitoreo de errores). Sin NEXT_PUBLIC_SENTRY_DSN no envía nada:
// la app funciona igual. Los source maps solo se suben si hay
// SENTRY_AUTH_TOKEN (+ SENTRY_ORG / SENTRY_PROJECT) en el entorno de build.
module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  hideSourceMaps: true,
  disableLogger: true,
  // Sin tunnelRoute a propósito: las tiendas viven en /[slug] y una ruta
  // fija como /monitoring podría chocar con el slug de una tienda.
});
