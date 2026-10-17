import { tagLabels } from "@/lib/productTags";

// Las dos primeras etiquetas del producto en una línea, para las tarjetas
// del catálogo de cada estilo (la ficha del producto muestra todas). Cada
// estilo le pasa sus clases de color y tipografía.
export default function CardTags({ tags, className = "" }: { tags: string[]; className?: string }) {
  const labels = tagLabels(tags).slice(0, 2);
  if (labels.length === 0) return null;
  return <p className={`truncate ${className}`}>{labels.join(" · ")}</p>;
}
