"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { LatLng } from "@/components/LocationPicker";
import { parseLatLngFromText, isShortenedMapsLink } from "@/lib/geo";

// Leaflet toca `window`/`document` al montar el mapa, así que solo puede
// vivir en el navegador — se carga con ssr:false para que Next no intente
// renderizarlo en el servidor.
const LocationPicker = dynamic(() => import("@/components/LocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 w-full items-center justify-center rounded-xl border border-ink/10 bg-paper text-xs text-ink/40">
      Cargando mapa...
    </div>
  ),
});

export default function LocationField({
  value,
  onChange,
  onUseSuggestedAddress,
  currentAddress,
}: {
  value: LatLng | null;
  onChange: (value: LatLng) => void;
  onUseSuggestedAddress: (address: string) => void;
  currentAddress: string;
}) {
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [suggestedAddress, setSuggestedAddress] = useState<string | null>(null);

  // Para leer el valor más reciente de la dirección dentro del efecto de
  // geocodificación sin tener que agregarla a las dependencias (eso
  // dispararía una búsqueda nueva cada vez que el comprador tipea).
  const currentAddressRef = useRef(currentAddress);
  useEffect(() => {
    currentAddressRef.current = currentAddress;
  }, [currentAddress]);

  // Geocodificación inversa: apenas hay un pin, sugerimos una dirección en
  // texto (Nominatim/OpenStreetMap, gratis). Si el campo de dirección todavía
  // está vacío, la completamos solos — ya marcó el pin, no debería tener que
  // escribirla de nuevo a mano para poder enviar el pedido. Si ya escribió
  // algo, nunca se lo pisamos: solo queda la sugerencia por si la quiere usar.
  useEffect(() => {
    if (!value) {
      setSuggestedAddress(null);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${value.lat}&lon=${value.lng}&accept-language=es&zoom=18`,
          { signal: controller.signal }
        );
        const data = await res.json();
        if (data?.display_name) {
          const address = data.display_name as string;
          setSuggestedAddress(address);
          if (!currentAddressRef.current.trim()) {
            onUseSuggestedAddress(address);
          }
        }
      } catch {
        // La sugerencia es un extra, no es crítico si falla.
      }
    }, 600);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value?.lat, value?.lng]);

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setGeoError("Tu navegador no soporta geolocalización.");
      return;
    }
    setGeoError(null);
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLoading(false);
      },
      () => {
        setGeoError("No pudimos acceder a tu ubicación. Márcala en el mapa.");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // Un solo campo para tres formas de dar la ubicación: coordenadas o link
  // completo de Google Maps (se leen al toque), link acortado (se resuelve
  // en el servidor por el redirect) o una dirección escrita a mano (se
  // busca con el geocodificador de OpenStreetMap).
  async function handleSearch() {
    const text = searchInput.trim();
    if (!text) return;
    setSearchError(null);

    const direct = parseLatLngFromText(text);
    if (direct) {
      onChange(direct);
      setSearchInput("");
      return;
    }

    setSearchLoading(true);
    try {
      if (isShortenedMapsLink(text)) {
        const res = await fetch("/api/geo/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: text }),
        });
        const data = await res.json();
        if (!res.ok) {
          setSearchError(data.error || "No pudimos leer ese link.");
          return;
        }
        onChange({ lat: data.lat, lng: data.lng });
        setSearchInput("");
        return;
      }

      // No es un link ni coordenadas: lo tratamos como una dirección escrita
      // y la buscamos (acotado a Bolivia para resultados más relevantes).
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
          text
        )}&countrycodes=bo&accept-language=es&limit=1`
      );
      const results = await res.json();
      const best = Array.isArray(results) ? results[0] : null;
      if (!best) {
        setSearchError("No encontramos esa dirección. Prueba ser más específico o usa el mapa.");
        return;
      }
      onChange({ lat: parseFloat(best.lat), lng: parseFloat(best.lon) });
      setSearchInput("");
    } catch {
      setSearchError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSearchLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink/70">Marca tu ubicación (opcional)</p>
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={geoLoading}
          className="store-accent-text text-xs font-semibold disabled:opacity-50"
        >
          {geoLoading ? "Buscando..." : "📍 Usar mi ubicación"}
        </button>
      </div>

      <LocationPicker value={value} onChange={onChange} />
      {geoError && <p className="text-xs text-coral-600">{geoError}</p>}

      <div className="flex gap-2">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
          placeholder="Escribe tu dirección, o pega tu ubicación de WhatsApp / Google Maps"
          className="store-accent-focus flex-1 rounded-lg border border-ink/15 px-3 py-2 text-xs"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={searchLoading || !searchInput.trim()}
          className="shrink-0 rounded-lg border border-ink/15 px-3 py-2 text-xs font-medium text-ink/70 disabled:opacity-40"
        >
          {searchLoading ? "..." : "Buscar"}
        </button>
      </div>
      {searchError && <p className="text-xs text-coral-600">{searchError}</p>}

      {suggestedAddress && (
        <button
          type="button"
          onClick={() => onUseSuggestedAddress(suggestedAddress)}
          className="store-accent-soft-bg store-accent-text block w-full rounded-lg px-3 py-2 text-left text-xs"
        >
          📍 {suggestedAddress} <span className="font-semibold">· Usar esta dirección</span>
        </button>
      )}
    </div>
  );
}
