// Utilidades para el selector de ubicación del checkout: parsear
// coordenadas desde links de Google Maps / WhatsApp pegados a mano, y
// validar que un par lat/lng sea geográficamente válido.

export function isValidLatLng(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

// Patrones más comunes en links de Google Maps compartidos desde el
// navegador o desde "Compartir ubicación" de WhatsApp/Google Maps app.
const COORD_PATTERNS = [
  /@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/, // https://www.google.com/maps/@-16.5,-68.15,15z
  /[?&]q=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/, // ?q=-16.5,-68.15
  /[?&]query=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/, // ?query=-16.5,-68.15
  /[?&]ll=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/, // ?ll=-16.5,-68.15
  /^\s*(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/, // "-16.5, -68.15" pegado directo
];

export function parseLatLngFromText(text: string): { lat: number; lng: number } | null {
  for (const pattern of COORD_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (isValidLatLng(lat, lng)) return { lat, lng };
    }
  }
  return null;
}

// Links acortados (maps.app.goo.gl, goo.gl/maps) no traen coordenadas en la
// URL misma — hay que seguir la redirección server-side (CORS lo bloquea
// desde el navegador) vía /api/geo/resolve.
export function isShortenedMapsLink(text: string): boolean {
  return /(maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/kgs)/i.test(text);
}
