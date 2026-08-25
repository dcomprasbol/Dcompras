import { NextRequest, NextResponse } from "next/server";
import { parseLatLngFromText } from "@/lib/geo";

// Links acortados de Google Maps (maps.app.goo.gl, goo.gl/maps) no traen
// coordenadas en la URL — hay que seguir la redirección para llegar a la
// URL final que sí las trae. El navegador no puede hacer este fetch por
// CORS, así que lo resolvemos acá en el servidor.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const url = body?.url;
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Falta el link" }, { status: 400 });
  }

  let finalUrl = url;
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; DcomprasBot/1.0)" },
    });
    finalUrl = res.url || url;
  } catch {
    // Si el fetch falla igual intentamos leer coordenadas del link original.
  }

  const coords = parseLatLngFromText(finalUrl);
  if (!coords) {
    return NextResponse.json(
      { error: "No pudimos leer una ubicación de ese link" },
      { status: 400 }
    );
  }
  return NextResponse.json(coords);
}
