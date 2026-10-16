// Set de íconos propio de Dcompras, en reemplazo de los emojis. Mismo
// lenguaje que el logo: trazo grueso, puntas cuadradas y ángulos rectos, y
// un detalle de acento (como la pieza jade de la "D"). El acento sale de
// --icon-accent: jade por defecto; dentro de una tienda el layout lo apunta
// al color de marca del vendedor, así su vidriera no lleva el verde nuestro.

export type IconName =
  | "bag"
  | "box"
  | "wallet"
  | "chat"
  | "settings"
  | "clock"
  | "check"
  | "pin"
  | "link"
  | "bell"
  | "clipboard"
  | "mail"
  | "x"
  | "alert"
  | "spark"
  | "panel"
  | "cart"
  | "megaphone"
  | "pause"
  | "play"
  | "trash"
  | "home"
  | "meet"
  | "qr"
  | "chevron";

const ACCENT = "var(--icon-accent, #1DBE86)";

const s = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "square" as const,
  strokeLinejoin: "miter" as const,
};
const a = { ...s, stroke: ACCENT };

const PATHS: Record<IconName, JSX.Element> = {
  bag: (
    <>
      <path d="M4 8h16l-1.5 13h-13z" {...s} />
      <path d="M9 10V6a3 3 0 0 1 6 0v4" {...a} />
    </>
  ),
  box: (
    <>
      <path d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5z" {...s} />
      <path d="M3.5 7.5L12 12l8.5-4.5M12 12v9" {...s} />
      <path d="M7.75 5.25l8.5 4.5" {...a} />
    </>
  ),
  wallet: (
    <>
      <path d="M3 6h16v14H3z" {...s} />
      <path d="M3 6l12-3v3" {...s} />
      <path d="M14 11h7v4h-7z" {...a} />
    </>
  ),
  chat: (
    <>
      <path d="M3 4h18v12h-9l-5 4v-4H3z" {...s} />
      <path d="M7.5 10h9" {...a} />
    </>
  ),
  settings: (
    <>
      <path d="M4 6h8M16 6h4M4 12h2M10 12h10M4 18h10M18 18h2" {...s} />
      <path d="M12 4v4M6 10v4M14 16v4" {...a} />
    </>
  ),
  clock: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" {...s} />
      <path d="M12 7v5l3.5 2.5" {...a} />
    </>
  ),
  check: <path d="M4 12.5l5 5L20 6.5" {...a} />,
  pin: (
    <>
      <path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z" {...s} />
      <path d="M10 7h4v4h-4z" {...a} />
    </>
  ),
  link: (
    <>
      <path d="M10 6.5L12.5 4a4.5 4.5 0 0 1 6.5 6.5L16.5 13" {...s} />
      <path d="M14 17.5L11.5 20A4.5 4.5 0 0 1 5 13.5L7.5 11" {...s} />
      <path d="M9.5 14.5l5-5" {...a} />
    </>
  ),
  bell: (
    <>
      <path d="M5 17V11a7 7 0 0 1 14 0v6l1.5 1.5h-17z" {...s} />
      <path d="M10 21h4" {...a} />
    </>
  ),
  clipboard: (
    <>
      <path d="M5 5h14v16H5z" {...s} />
      <path d="M9 3h6v4H9z" {...a} />
      <path d="M9 12h6M9 16h4" {...s} />
    </>
  ),
  mail: (
    <>
      <path d="M3 5h18v14H3z" {...s} />
      <path d="M3 6l9 7 9-7" {...a} />
    </>
  ),
  x: <path d="M6 6l12 12M18 6L6 18" {...s} />,
  alert: (
    <>
      <path d="M12 3l10 18H2z" {...s} />
      <path d="M12 10v4M12 17v.5" {...a} />
    </>
  ),
  spark: (
    <>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" {...s} />
      <path d="M9 9h6v6H9z" {...a} />
    </>
  ),
  panel: (
    <>
      <path d="M3 3h8v8H3zM13 13h8v8h-8zM3 13h8v8H3z" {...s} />
      <path d="M13 3h8v8h-8z" {...a} />
    </>
  ),
  cart: (
    <>
      <path d="M2 3h3l2.5 12H19l2-8H6" {...s} />
      <path d="M9 19h.01M18 19h.01" {...a} strokeWidth={3} />
    </>
  ),
  megaphone: (
    <>
      <path d="M3 9h4l10-5v16L7 15H3z" {...s} />
      <path d="M7 15l1.5 5h3L10 16" {...s} />
      <path d="M20 9.5v5" {...a} />
    </>
  ),
  pause: (
    <>
      <path d="M7 4h3v16H7z" {...s} />
      <path d="M14 4h3v16h-3z" {...a} />
    </>
  ),
  play: <path d="M6 4l14 8-14 8z" {...a} />,
  trash: (
    <>
      <path d="M3 6h18" {...a} />
      <path d="M9 6V3h6v3M5 6l1 15h12l1-15" {...s} />
      <path d="M10 10v7M14 10v7" {...s} />
    </>
  ),
  home: (
    <>
      <path d="M3 11L12 3l9 8v10H3z" {...s} />
      <path d="M10 21v-6h4v6" {...a} />
    </>
  ),
  meet: (
    <>
      <path d="M12 21s-6-5.5-6-10.5a6 6 0 0 1 12 0C18 15.5 12 21 12 21z" {...s} />
      <path d="M9 10.5l2 2 4-4" {...a} />
    </>
  ),
  chevron: <path d="M9 5l7 7-7 7" {...s} />,
  qr: (
    <>
      <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3z" {...s} />
      <path d="M14 14h3v3h-3zM18 18h3v3h-3z" {...a} />
    </>
  ),
};

export default function Icon({
  name,
  className = "h-4 w-4",
  label,
  mono = false,
}: {
  name: IconName;
  className?: string;
  // Si el ícono comunica algo que no está en el texto de al lado.
  label?: string;
  // Todo en el color del texto (sin acento): para íconos sobre fondos de
  // color (botón activo, aviso), donde el acento se perdería.
  mono?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`inline-block shrink-0 align-[-0.15em] ${className}`}
      style={mono ? ({ "--icon-accent": "currentColor" } as React.CSSProperties) : undefined}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {PATHS[name]}
    </svg>
  );
}

// Un cuadro de calificación con el corte diagonal del logo (en vez de ★),
// del color del texto.
export function RatingMark({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={className} aria-hidden="true">
      <path d="M0 0H12V12H5L0 7Z" fill="currentColor" />
    </svg>
  );
}

// Calificación de 1 a 5 en cuadros con el corte diagonal del logo, en vez
// de ★★★★☆.
export function Rating({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} role="img" aria-label={`${value} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} viewBox="0 0 12 12" className="h-3.5 w-3.5" aria-hidden="true">
          <path
            d="M0 0H12V12H5L0 7Z"
            style={{ fill: n <= value ? ACCENT : "currentColor" }}
            className={n <= value ? "" : "opacity-15"}
          />
        </svg>
      ))}
    </span>
  );
}

// Puesto en un ranking (1°, 2°, 3°...) como placa tinta con el corte jade
// de la "D", en vez de medallas 🥇🥈🥉.
export function RankBadge({ position }: { position: number }) {
  const top = position <= 3;
  return (
    <span
      className={`relative inline-flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden font-impact text-xs ${
        top ? "bg-ink text-white" : "bg-ink/5 text-ink/50"
      }`}
      aria-label={`Puesto ${position}`}
    >
      {position === 1 && (
        <span
          className="absolute bottom-0 left-0 h-2.5 w-2.5 bg-jade-400 [clip-path:polygon(0_0,100%_100%,0_100%)]"
          aria-hidden="true"
        />
      )}
      <span className="relative">{position}</span>
    </span>
  );
}

// Punto de estado (alertas): cuadrado con el corte diagonal, en color.
export function StatusDot({ tone }: { tone: "danger" | "warning" | "info" }) {
  const color = tone === "danger" ? "bg-coral-500" : tone === "warning" ? "bg-amber-500" : "bg-jade-500";
  return (
    <span
      className={`inline-block h-2.5 w-2.5 shrink-0 ${color} [clip-path:polygon(0_0,100%_0,100%_100%,35%_100%,0_65%)]`}
      aria-hidden="true"
    />
  );
}
