const ITEMS = [
  "Santa Cruz de la Sierra",
  "La Paz",
  "Cochabamba",
  "El Alto",
  "Sucre",
  "Tarija",
  "Ropa y moda",
  "Accesorios",
  "Belleza",
  "Calzado",
  "Tecnología",
  "Artesanías",
];

export default function Ticker() {
  const doubled = [...ITEMS, ...ITEMS];
  return (
    <div className="border-y border-white/10 bg-ink py-3">
      <div className="mask-fade-x overflow-hidden">
        <div className="flex w-max animate-marquee gap-8 whitespace-nowrap">
          {doubled.map((item, i) => (
            <span
              key={i}
              className="flex items-center gap-8 font-impact text-xs uppercase tracking-wider text-white/50"
            >
              {item}
              <span
                className={i % 3 === 0 ? "text-jade-400" : "text-white/20"}
                aria-hidden="true"
              >
                ▪
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
