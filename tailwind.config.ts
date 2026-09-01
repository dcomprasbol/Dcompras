import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#FAFAF8",
        ink: {
          DEFAULT: "#14102A",
          soft: "#312A52",
        },
        jade: {
          50: "#E8F8F1",
          100: "#C9EEDD",
          400: "#1DBE86",
          500: "#0EA57A",
          600: "#0B8A66",
          700: "#086B4F",
        },
        coral: {
          50: "#FFEDF0",
          100: "#FFD6DD",
          400: "#FF6B85",
          500: "#FF4D6D",
          600: "#E8365A",
        },
        amber: {
          50: "#FFF6E0",
          400: "#FFC658",
          500: "#FFB627",
          600: "#E89E10",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        // Fija en todo el sitio, no personalizable por tienda — ver globals.css.
        impact: ["var(--font-impact)", "sans-serif"],
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(var(--r, 0deg))" },
          "50%": { transform: "translateY(-14px) rotate(var(--r, 0deg))" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        // Simula un turntable de producto (spin 360°) sobre la foto al
        // pasar el mouse — hasta que haya video real, esto es lo que hace
        // de "hover to play" en la grilla de productos.
        turntable: {
          "0%": { transform: "rotateY(0deg) scale(1)" },
          "50%": { transform: "rotateY(180deg) scale(1.04)" },
          "100%": { transform: "rotateY(360deg) scale(1)" },
        },
        // La línea que conecta dos pasos ya completados de un timeline se
        // "dibuja" de izquierda a derecha en vez de aparecer ya llena.
        "grow-x": {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
        },
        // Contraparte de "pop": para cuando se borra una fila de una lista
        // (producto, pedido, liquidación, mensaje) en vez de que desaparezca
        // de golpe. Colapsa el alto para que el resto de la lista suba solo.
        "shrink-out": {
          "0%": { transform: "scale(1)", opacity: "1", maxHeight: "200px" },
          "60%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(0.95)", opacity: "0", maxHeight: "0px", marginBottom: "0px" },
        },
        // Pulso corto para confirmar "esto se guardó/hizo" en un botón o
        // badge, sin ser tan intrusivo como el pop de aparición.
        "confirm-pulse": {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        marquee: "marquee 28s linear infinite",
        float: "float 6s ease-in-out infinite",
        "fade-up": "fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        pop: "pop 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        turntable: "turntable 2.4s linear infinite",
        // "both": durante el animation-delay se queda en el estado inicial
        // (scaleX(0)) en vez de mostrarse ya llena y "saltar" al arrancar.
        "grow-x": "grow-x 0.6s ease-out both",
        "shrink-out": "shrink-out 0.3s ease-in forwards",
        "confirm-pulse": "confirm-pulse 0.35s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
