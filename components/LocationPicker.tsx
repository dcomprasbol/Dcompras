"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type LatLng = { lat: number; lng: number };

// Centro de Bolivia, para cuando todavía no hay ninguna ubicación elegida.
const BOLIVIA_CENTER: [number, number] = [-16.5, -64.9];

// Pin propio en SVG (con el color de marca de la tienda) en vez del ícono
// default de Leaflet: evita el clásico bug de rutas de imagen rotas al
// empaquetar Leaflet con Webpack/Next.
function buildPinIcon(color: string): L.DivIcon {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 10.9 12.4 23.4 14.4 25.4a.8.8 0 0 0 1.2 0C17.6 38.4 30 25.9 30 15 30 6.7 23.3 0 15 0z" fill="${color}"/>
      <circle cx="15" cy="15" r="6" fill="white"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [30, 40],
    iconAnchor: [15, 38],
  });
}

/**
 * Mapa interactivo (OpenStreetMap, sin API key) para que el comprador marque
 * dónde quiere recibir su pedido. Un clic o un drag del pin actualiza
 * `value` vía `onChange`; el componente padre puede además mover el pin
 * "desde afuera" (geolocalización del navegador, o un link pegado) porque
 * escucha cambios en `value`.
 */
export default function LocationPicker({
  value,
  onChange,
  accentColor = "var(--store-accent, #0EA57A)",
  className = "",
}: {
  value: LatLng | null;
  onChange: (value: LatLng) => void;
  accentColor?: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Inicializa el mapa una sola vez.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: value ? [value.lat, value.lng] : BOLIVIA_CENTER,
      zoom: value ? 16 : 5,
      scrollWheelZoom: true,
    });
    mapRef.current = map;

    const streets = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const satellite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Tiles © Esri", maxZoom: 19 }
    );

    // Control nativo de Leaflet para alternar entre mapa normal y
    // satelital — colapsado, solo un ícono en la esquina hasta que se abre.
    L.control
      .layers({ "🗺️ Normal": streets, "🛰️ Satélite": satellite }, undefined, {
        position: "topright",
        collapsed: true,
      })
      .addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      onChangeRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    // En layouts flex/condicionales Leaflet a veces mide el contenedor
    // antes de que termine su layout; esto lo corrige.
    setTimeout(() => map.invalidateSize(), 150);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincroniza el pin cuando `value` cambia, venga de un clic en el mapa,
  // del botón "Usar mi ubicación" o de un link pegado.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !value) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([value.lat, value.lng]);
    } else {
      markerRef.current = L.marker([value.lat, value.lng], {
        icon: buildPinIcon(accentColor),
        draggable: true,
      }).addTo(map);
      markerRef.current.on("dragend", () => {
        const pos = markerRef.current!.getLatLng();
        onChangeRef.current({ lat: pos.lat, lng: pos.lng });
      });
    }
    map.setView([value.lat, value.lng], Math.max(map.getZoom(), 15));
  }, [value?.lat, value?.lng, accentColor]);

  return (
    <div
      ref={containerRef}
      className={`h-64 w-full overflow-hidden rounded-xl border border-ink/10 ${className}`}
    />
  );
}
