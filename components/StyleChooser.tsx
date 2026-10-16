"use client";

import { FULL_PAGE_STYLES, STORE_STYLES, type StoreTheme } from "@/lib/storeTheme";
import Icon from "@/components/Icon";

// Selector de estilo de la tienda (crear tienda y panel del vendedor). Cada
// opción muestra una miniatura dibujada con los colores reales del estilo y
// el color de marca que eligió el vendedor, para que vea cómo va a quedar
// antes de decidir.

function Preview({ style, accent }: { style: StoreTheme; accent: string }) {
  if (style === "atelier") {
    return (
      <div className="flex h-full flex-col items-center bg-[#0e0d0b] px-2 pt-2.5">
        <span className="h-0.5 w-6 rounded-full" style={{ backgroundColor: accent }} />
        <span className="mt-1.5 font-serif text-[13px] italic leading-none text-[#f3ede2]">Atelier</span>
        <span className="mt-1.5 h-px w-8 animate-pulse" style={{ backgroundColor: accent }} />
        <div className="mt-auto grid w-full grid-cols-3 gap-1.5 pb-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="aspect-[3/4] bg-[#1b1814]" />
          ))}
        </div>
      </div>
    );
  }
  if (style === "pop") {
    return (
      <div className="relative flex h-full flex-col overflow-hidden bg-[#fff8ec] p-1.5">
        <span
          className="absolute -right-3 -top-3 h-12 w-12 animate-[spin_8s_linear_infinite] rounded-[40%_60%_55%_45%] opacity-40"
          style={{ backgroundColor: accent }}
        />
        <span className="relative mt-1 text-center text-[13px] font-bold leading-none text-[#1a1423]">¡Hola!</span>
        <span
          className="relative mx-auto mt-1 h-2 w-10 rounded-full border border-[#1a1423]"
          style={{ backgroundColor: accent }}
        />
        <div className="relative mt-auto grid grid-cols-3 gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`aspect-square rounded-md border-2 border-[#1a1423] bg-white shadow-[2px_2px_0_0_#1a1423] ${i === 1 ? "-rotate-6" : ""}`}
            />
          ))}
        </div>
      </div>
    );
  }
  if (style === "galeria") {
    return (
      <div className="flex h-full flex-col bg-[#f4f3ef] p-1.5">
        <span className="text-[20px] font-semibold uppercase leading-[0.85] tracking-[-0.06em] text-[#111]">Tienda</span>
        <div className="mt-1.5 grid flex-1 grid-cols-4 grid-rows-2 gap-1">
          <span className="col-span-2 row-span-2 bg-[#d9d6ce]" />
          <span className="bg-[#e7e5df]" />
          <span className="bg-[#e7e5df]" />
          <span className="bg-[#e7e5df]" />
          <span className="bg-[#e7e5df]" />
        </div>
      </div>
    );
  }
  if (style === "moda") {
    return (
      <div className="flex h-full flex-col bg-[#f6f1e7] p-1.5">
        <div className="relative flex h-[55%] flex-col items-center justify-end overflow-hidden rounded-md bg-gradient-to-br from-[#d9b99b] via-[#c99a7b] to-[#8a6a58] pb-1.5">
          <span className="mb-1 h-1.5 w-1.5 rounded-sm bg-white" />
          <span className="h-1.5 w-12 rounded-full bg-white/90" />
          <span className="mt-1 h-1.5 w-7 rounded-full bg-white" />
        </div>
        <div className="mt-1.5 grid flex-1 grid-cols-3 gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-0.5">
              <span className="flex-1 rounded-[3px] bg-[#e6d9c6]" />
              <span className="h-1 w-3/4 rounded-full bg-[#2b2420]/30" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (style === "tecnologia") {
    return (
      <div className="flex h-full flex-col bg-[#0a0a0a] p-1.5">
        <div className="flex h-[55%] items-center gap-1.5 px-1">
          <div className="flex flex-1 flex-col gap-1">
            <span className="h-2 w-full rounded-sm" style={{ backgroundColor: accent }} />
            <span className="h-2 w-3/4 rounded-sm" style={{ backgroundColor: accent }} />
            <span className="h-1 w-1/2 rounded-full bg-white/30" />
          </div>
          <span className="aspect-square h-[85%] shrink-0 rounded-md border border-white/15 bg-[#161616]" />
        </div>
        <div className="mt-1.5 grid flex-1 grid-cols-2 gap-1">
          {[0, 1].map((i) => (
            <span key={i} className="rounded-[4px] border border-white/10 bg-[#161616]" />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col bg-[#fafaf8]">
      <div className="flex h-[55%] items-center gap-1.5 bg-[#14102a] px-2">
        <div className="flex flex-1 flex-col gap-1">
          <span className="h-2.5 w-full" style={{ backgroundColor: accent }} />
          <span className="h-2.5 w-2/3" style={{ backgroundColor: accent }} />
          <span className="h-1 w-1/2 bg-white/30" />
        </div>
        <span className="aspect-square h-[72%] shrink-0 bg-white" />
      </div>
      <div className="grid flex-1 grid-cols-4 gap-1 p-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="border border-[#14102a]/10 bg-white" />
        ))}
      </div>
    </div>
  );
}

export default function StyleChooser({
  value,
  onChange,
  accent,
  suggested,
  stacked = false,
}: {
  value: StoreTheme;
  onChange: (style: StoreTheme) => void;
  accent: string;
  suggested?: StoreTheme;
  // Una opción debajo de otra (miniatura a la izquierda), para espacios
  // angostos como el formulario de crear tienda.
  stacked?: boolean;
}) {
  const safeAccent = /^#[0-9a-f]{6}$/i.test(accent) ? accent : "#0EA57A";
  return (
    <div
      role="radiogroup"
      aria-label="Estilo de tu tienda"
      className={`grid grid-cols-1 gap-3 ${stacked ? "" : "sm:grid-cols-3"}`}
    >
      {STORE_STYLES.map((s) => {
        const selected = value === s.value;
        return (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(s.value)}
            className={`flex overflow-hidden rounded-xl border-2 text-left transition ${
              stacked ? "flex-row" : "flex-col"
            } ${
              selected
                ? "border-jade-500 shadow-md"
                : "border-ink/10 hover:-translate-y-0.5 hover:border-ink/25"
            }`}
          >
            <div
              className={`shrink-0 overflow-hidden ${stacked ? "w-28" : "h-24 w-full"}`}
              aria-hidden="true"
            >
              <Preview style={s.value} accent={safeAccent} />
            </div>
            <div className="flex flex-1 flex-col gap-1 bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-ink">{s.label}</span>
                {selected ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-jade-500 text-white">
                    <Icon name="check" mono className="h-3 w-3" />
                  </span>
                ) : (
                  <span className="h-5 w-5 rounded-full border-2 border-ink/15" />
                )}
              </div>
              {FULL_PAGE_STYLES.includes(s.value) && (
                <span className="self-start rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold text-white">
                  Con animaciones
                </span>
              )}
              <span className="text-xs leading-snug text-ink/60">{s.description}</span>
              <span className="mt-auto pt-1 text-[11px] font-medium text-jade-700">
                Ideal para: {s.idealFor}
              </span>
              {suggested === s.value && (
                <span className="mt-1 self-start rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                  Recomendado para tu rubro
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
