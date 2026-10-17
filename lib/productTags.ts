// Etiquetas de producto, según el rubro de la tienda (stores.category). Cada
// rubro tiene sus grupos (estado de la ropa, forma de venta de la comida…)
// y todos comparten "Destacados". Un grupo `single` admite una sola opción
// (el estado de algo es uno solo); los demás, varias.
//
// En la base se guarda solo el `value` (products.tags, jsonb). Los valores
// son únicos en todo el catálogo para que una etiqueta se pueda mostrar
// aunque la tienda cambie de rubro después: tagLabel() la busca en todos.

export type TagOption = { value: string; label: string };
export type TagGroup = { id: string; label: string; single?: boolean; options: TagOption[] };

const COMMON: TagGroup = {
  id: "destacados",
  label: "Destacados",
  options: [
    { value: "hecho-en-bolivia", label: "Hecho en Bolivia" },
    { value: "edicion-limitada", label: "Edición limitada" },
    { value: "mas-vendido", label: "Más vendido" },
  ],
};

const BY_CATEGORY: Record<string, TagGroup[]> = {
  ropa: [
    {
      id: "ropa-estado",
      label: "Estado",
      single: true,
      options: [
        { value: "ropa-nuevo-etiqueta", label: "Nuevo con etiqueta" },
        { value: "ropa-nuevo", label: "Nuevo" },
        { value: "ropa-como-nuevo", label: "Usado como nuevo" },
        { value: "ropa-usado", label: "Usado en buen estado" },
      ],
    },
    {
      id: "ropa-para",
      label: "Para quién",
      options: [
        { value: "mujer", label: "Mujer" },
        { value: "hombre", label: "Hombre" },
        { value: "unisex", label: "Unisex" },
        { value: "ninos", label: "Niños" },
        { value: "bebes", label: "Bebés" },
      ],
    },
    {
      id: "ropa-temporada",
      label: "Temporada",
      options: [
        { value: "verano", label: "Verano" },
        { value: "invierno", label: "Invierno" },
        { value: "todo-el-ano", label: "Todo el año" },
      ],
    },
  ],
  joyeria: [
    {
      id: "joya-material",
      label: "Material",
      options: [
        { value: "acero-inoxidable", label: "Acero inoxidable" },
        { value: "plata-925", label: "Plata 925" },
        { value: "oro-laminado", label: "Oro laminado" },
        { value: "bisuteria", label: "Bisutería" },
        { value: "cuero", label: "Cuero" },
      ],
    },
    {
      id: "joya-caracteristicas",
      label: "Características",
      options: [
        { value: "hipoalergenico", label: "Hipoalergénico" },
        { value: "no-se-oscurece", label: "No se oscurece" },
        { value: "resistente-agua", label: "Resistente al agua" },
        { value: "personalizable", label: "Personalizable" },
        { value: "hecho-a-mano", label: "Hecho a mano" },
      ],
    },
  ],
  electronicos: [
    {
      id: "elec-estado",
      label: "Estado",
      single: true,
      options: [
        { value: "elec-sellado", label: "Nuevo sellado" },
        { value: "elec-caja-abierta", label: "Caja abierta" },
        { value: "elec-reacondicionado", label: "Reacondicionado" },
        { value: "elec-usado", label: "Usado" },
      ],
    },
    {
      id: "elec-garantia",
      label: "Garantía",
      single: true,
      options: [
        { value: "garantia-3m", label: "Garantía 3 meses" },
        { value: "garantia-6m", label: "Garantía 6 meses" },
        { value: "garantia-12m", label: "Garantía 1 año" },
        { value: "sin-garantia", label: "Sin garantía" },
      ],
    },
    {
      id: "elec-otros",
      label: "Otros",
      options: [
        { value: "original", label: "Original" },
        { value: "generico", label: "Genérico / compatible" },
        { value: "incluye-accesorios", label: "Incluye accesorios" },
        { value: "importado", label: "Importado" },
      ],
    },
  ],
  belleza: [
    {
      id: "belleza-caracteristicas",
      label: "Características",
      options: [
        { value: "natural", label: "Natural" },
        { value: "organico", label: "Orgánico" },
        { value: "vegano", label: "Vegano" },
        { value: "cruelty-free", label: "Cruelty free" },
        { value: "sin-parabenos", label: "Sin parabenos" },
        { value: "hipoalergenico", label: "Hipoalergénico" },
      ],
    },
    {
      id: "belleza-piel",
      label: "Tipo de piel",
      options: [
        { value: "piel-grasa", label: "Piel grasa" },
        { value: "piel-seca", label: "Piel seca" },
        { value: "piel-mixta", label: "Piel mixta" },
        { value: "piel-sensible", label: "Piel sensible" },
        { value: "todo-tipo-piel", label: "Todo tipo de piel" },
      ],
    },
    {
      id: "belleza-origen",
      label: "Origen",
      single: true,
      options: [
        { value: "original", label: "Original" },
        { value: "importado", label: "Importado" },
        { value: "artesanal", label: "Artesanal" },
      ],
    },
  ],
  hogar: [
    {
      id: "hogar-material",
      label: "Material",
      options: [
        { value: "madera", label: "Madera" },
        { value: "ceramica", label: "Cerámica" },
        { value: "textil", label: "Textil" },
        { value: "metal", label: "Metal" },
        { value: "vidrio", label: "Vidrio" },
      ],
    },
    {
      id: "hogar-caracteristicas",
      label: "Características",
      options: [
        { value: "hecho-a-mano", label: "Hecho a mano" },
        { value: "artesanal", label: "Artesanal" },
        { value: "personalizable", label: "Personalizable" },
        { value: "para-armar", label: "Para armar" },
        { value: "incluye-instalacion", label: "Incluye instalación" },
      ],
    },
  ],
  comida: [
    {
      id: "comida-venta",
      label: "Forma de venta",
      options: [
        { value: "por-unidad", label: "Por unidad" },
        { value: "al-por-mayor", label: "Al por mayor" },
        { value: "por-kilo", label: "Por kilo" },
        { value: "por-docena", label: "Por docena" },
      ],
    },
    {
      id: "comida-dieta",
      label: "Dieta",
      options: [
        { value: "organico", label: "Orgánico" },
        { value: "sin-gluten", label: "Sin gluten" },
        { value: "vegano", label: "Vegano" },
        { value: "vegetariano", label: "Vegetariano" },
        { value: "sin-azucar", label: "Sin azúcar" },
        { value: "sin-lactosa", label: "Sin lactosa" },
        { value: "keto", label: "Keto" },
      ],
    },
    {
      id: "comida-preparacion",
      label: "Preparación",
      options: [
        { value: "casero", label: "Casero" },
        { value: "artesanal", label: "Artesanal" },
        { value: "congelado", label: "Congelado" },
        { value: "listo-para-comer", label: "Listo para comer" },
        { value: "por-encargo", label: "Por encargo" },
      ],
    },
  ],
  otros: [
    {
      id: "otros-estado",
      label: "Estado",
      single: true,
      options: [
        { value: "nuevo", label: "Nuevo" },
        { value: "usado", label: "Usado" },
      ],
    },
    {
      id: "otros-caracteristicas",
      label: "Características",
      options: [
        { value: "hecho-a-mano", label: "Hecho a mano" },
        { value: "personalizable", label: "Personalizable" },
        { value: "por-encargo", label: "Por encargo" },
        { value: "importado", label: "Importado" },
      ],
    },
  ],
};

export const MAX_PRODUCT_TAGS = 10;

// Grupos que ve el vendedor al cargar un producto, según su rubro (sin rubro
// o con uno desconocido: los de "otros").
export function tagGroupsForCategory(category: string | null | undefined): TagGroup[] {
  return [...(BY_CATEGORY[category ?? ""] ?? BY_CATEGORY.otros), COMMON];
}

const LABELS = new Map<string, string>();
for (const g of [...Object.values(BY_CATEGORY).flat(), COMMON]) {
  for (const o of g.options) LABELS.set(o.value, o.label);
}

export function tagLabel(value: string): string | null {
  return LABELS.get(value) ?? null;
}

// Para guardar: solo etiquetas que existen, sin repetidas, hasta el máximo.
export function sanitizeTags(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const out: string[] = [];
  for (const v of input) {
    if (typeof v === "string" && LABELS.has(v) && !out.includes(v)) out.push(v);
    if (out.length >= MAX_PRODUCT_TAGS) break;
  }
  return out;
}

// Nombres de las etiquetas en el orden guardado (las desconocidas se omiten).
export function tagLabels(tags: string[] | null | undefined): string[] {
  return (tags ?? []).map(tagLabel).filter((l): l is string => Boolean(l));
}
