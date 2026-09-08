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
export type StoreTheme = "default" | "moda" | "tecnologia";

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
