// Estética distinta según el rubro de la tienda, para que un catálogo de
// ropa y uno de electrónicos no se sientan hechos con el mismo molde.
// Referencias que pidió el dueño: Sabina/Arum (Framer) para moda, Vende
// (Framer) para tecnología — colores cálidos y tipografía editorial para
// una, fondo oscuro y tarjetas tipo "estudio de producto" para la otra.
//
// A propósito arranca con solo dos rubros con tema propio (ropa y
// electrónicos) — el resto (joyería, belleza, hogar, comida, otros) se
// queda con el look "default" de siempre, sin ningún cambio, hasta que se
// sume un tema puntual para cada uno. Los tokens de "default" en
// globals.css son un calco exacto del look actual, así que ningún vendedor
// existente ve un cambio salvo que su categoría entre a un tema nuevo acá.
export type StoreTheme = "default" | "moda" | "tecnologia" | "atelier" | "pop" | "galeria";

export function themeForCategory(category: string | null | undefined): StoreTheme {
  switch (category) {
    case "ropa":
      return "moda";
    case "electronicos":
      return "tecnologia";
    default:
      return "default";
  }
}

// Ahora el vendedor elige el estilo (columna stores.store_style) al crear
// la tienda y lo puede cambiar desde su panel. Las tiendas que nunca
// eligieron (store_style NULL) siguen con el estilo que les tocaba por
// rubro, así ninguna tienda existente cambia de look sin que su dueño lo
// decida. Los valores internos no cambian (los usa el CSS de globals.css
// vía data-store-theme); solo los nombres que ve el vendedor.
export const STORE_STYLES: {
  value: StoreTheme;
  label: string;
  description: string;
  idealFor: string;
}[] = [
  {
    value: "moda",
    label: "Boutique",
    description: "Cálido y elegante, con fotos grandes que van rotando y esquinas suaves.",
    idealFor: "Accesorios, joyería, belleza y ropa",
  },
  {
    value: "default",
    label: "Editorial",
    description: "Portada oscura con títulos grandes y en mayúsculas. Directo y con actitud.",
    idealFor: "Moda urbana, calzado, comida y marcas con carácter",
  },
  {
    value: "tecnologia",
    label: "Estudio",
    description: "Fondo negro y productos como en vitrina. Moderno y minimalista.",
    idealFor: "Tecnología, gadgets, gaming y electrónica",
  },
  // Los tres siguientes son páginas completas con su propio orden de
  // secciones y animaciones (components/store/themes/*), no solo colores.
  {
    value: "atelier",
    label: "Atelier",
    description: "Lujo oscuro con letras elegantes, portada en movimiento y una pieza destacada.",
    idealFor: "Joyería, accesorios, perfumes y relojes",
  },
  {
    value: "pop",
    label: "Pop",
    description: "Colorido y divertido: letras que rebotan, productos como stickers y mucha energía.",
    idealFor: "Comida, dulces, regalos y belleza joven",
  },
  {
    value: "galeria",
    label: "Galería",
    description: "Minimalista como un museo: tu nombre en gigante y fotos que se revelan al bajar.",
    idealFor: "Hogar, decoración, arte y artesanías",
  },
];

// Estilos que arman su propia página de inicio completa (con animaciones).
export const FULL_PAGE_STYLES: StoreTheme[] = ["atelier", "pop", "galeria"];

export function isValidStoreStyle(value: unknown): value is StoreTheme {
  return STORE_STYLES.some((s) => s.value === value);
}

export function resolveStoreTheme(
  storeStyle: string | null | undefined,
  category: string | null | undefined
): StoreTheme {
  return isValidStoreStyle(storeStyle) ? storeStyle : themeForCategory(category);
}

// Estilo que le sugerimos a una tienda nueva según lo que vende (solo es el
// preseleccionado en el formulario; el vendedor puede elegir otro).
export function suggestedStyleForCategory(category: string | null | undefined): StoreTheme {
  switch (category) {
    case "ropa":
    case "belleza":
      return "moda";
    case "joyeria":
      return "atelier";
    case "comida":
      return "pop";
    case "hogar":
      return "galeria";
    case "electronicos":
      return "tecnologia";
    default:
      return "default";
  }
}
