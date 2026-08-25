"use client";

import { useEffect, useState } from "react";

function getRemaining(target: number) {
  const diff = Math.max(0, target - Date.now());
  return {
    total: diff,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// Cuenta regresiva a un lanzamiento programado (store.dropAt). Cualquier
// tienda puede usarlo — no es específico de ningún rubro. Una vez que pasa
// la fecha, muestra un aviso de que ya está disponible en vez de
// desaparecer de golpe.
export default function DropCountdown({ dropAt }: { dropAt: string }) {
  const target = new Date(dropAt).getTime();
  const [remaining, setRemaining] = useState(() => getRemaining(target));

  useEffect(() => {
    const id = setInterval(() => setRemaining(getRemaining(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (remaining.total <= 0) {
    return (
      <p className="tag-editorial store-accent-bg inline-flex">Ya disponible</p>
    );
  }

  const units = [
    { value: remaining.days, label: "Días" },
    { value: remaining.hours, label: "Hrs" },
    { value: remaining.minutes, label: "Min" },
    { value: remaining.seconds, label: "Seg" },
  ];

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
        Faltan para el drop
      </p>
      <div className="mt-3 flex gap-2">
        {units.map((u) => (
          <div key={u.label} className="flex flex-col items-center border border-white/20 px-3 py-2">
            <span className="font-impact text-2xl tabular-nums text-white sm:text-3xl">
              {pad(u.value)}
            </span>
            <span className="mt-0.5 text-[10px] uppercase tracking-wide text-white/40">
              {u.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
