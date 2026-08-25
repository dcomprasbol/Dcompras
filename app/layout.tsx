import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dcompras — De compras, sin horario",
  description:
    "Crea tu tienda online gratis, comparte el link en TikTok o Instagram, y recibe pedidos ordenados sin depender solo del WhatsApp.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
