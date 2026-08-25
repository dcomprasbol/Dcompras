import { NextRequest, NextResponse } from "next/server";
import { getStoreBySlug, getStoreByUserId, createStore } from "@/lib/repo";
import {
  slugify,
  STORE_CATEGORIES,
  STORE_FONTS,
  DEFAULT_STORE_COLOR,
  isValidHexColor,
} from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const existing = await getStoreByUserId(user.id);
  if (existing) {
    return NextResponse.json({ error: "Ya tienes una tienda creada" }, { status: 400 });
  }

  const body = await req.json();
  const {
    name,
    whatsapp,
    city,
    ownerName,
    category,
    themeColor,
    logoUrl,
    fontChoice,
    tagline,
    instagramUrl,
    tiktokUrl,
    facebookUrl,
  } = body;

  if (!name || !whatsapp) {
    return NextResponse.json(
      { error: "Nombre de tienda y WhatsApp son obligatorios" },
      { status: 400 }
    );
  }

  // Al menos una red social: es lo que le permite al admin de plataforma
  // confirmar que el negocio es real antes de aprobar la tienda.
  const socials = { instagramUrl, tiktokUrl, facebookUrl };
  const hasSocial = Object.values(socials).some((v) => v && String(v).trim());
  if (!hasSocial) {
    return NextResponse.json(
      { error: "Agrega al menos una red social para que podamos confirmar que tu tienda es real" },
      { status: 400 }
    );
  }

  if (category && !STORE_CATEGORIES.some((c) => c.value === category)) {
    return NextResponse.json({ error: "Rubro inválido" }, { status: 400 });
  }
  if (themeColor && !isValidHexColor(themeColor)) {
    return NextResponse.json({ error: "Color de marca inválido" }, { status: 400 });
  }
  if (fontChoice && !STORE_FONTS.some((f) => f.value === fontChoice)) {
    return NextResponse.json({ error: "Tipografía inválida" }, { status: 400 });
  }

  // Si el dueño se registró con Google, tomamos su nombre del perfil de
  // Google como default; el campo del formulario (si lo llenó) tiene
  // prioridad.
  const googleName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined);

  const baseSlug = slugify(name);
  if (!baseSlug) {
    return NextResponse.json({ error: "Nombre de tienda inválido" }, { status: 400 });
  }

  // Evita colisiones de slug agregando un sufijo numérico si ya existe
  let slug = baseSlug;
  let suffix = 1;
  while (await getStoreBySlug(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix++;
  }

  const store = await createStore({
    slug,
    name,
    ownerName: (ownerName && String(ownerName).trim()) || googleName || null,
    whatsapp,
    city: city || null,
    userId: user.id,
    category: category || null,
    themeColor: themeColor || DEFAULT_STORE_COLOR,
    logoUrl: logoUrl || null,
    fontChoice: fontChoice || STORE_FONTS[0].value,
    tagline: (tagline && String(tagline).trim()) || null,
    instagramUrl: (instagramUrl && String(instagramUrl).trim()) || null,
    tiktokUrl: (tiktokUrl && String(tiktokUrl).trim()) || null,
    facebookUrl: (facebookUrl && String(facebookUrl).trim()) || null,
  });

  return NextResponse.json({ slug: store.slug });
}
