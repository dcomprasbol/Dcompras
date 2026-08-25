import { NextRequest, NextResponse } from "next/server";
import { getStoreBySlug, updateStoreSettings, deleteStore } from "@/lib/repo";
import { requireStoreAdmin, getCurrentUser } from "@/lib/auth";
import { STORE_CATEGORIES, STORE_FONTS, isValidHexColor } from "@/lib/utils";

// Esta ruta no exige sesión (el checkout público la usa para leer el QR/
// instrucciones de pago) — por default nunca devuelve el userId ni los
// datos bancarios del vendedor. Cuando quien pregunta SÍ es la dueña de la
// tienda (AdminSettings), le devolvemos también sus propios datos bancarios
// para que pueda verlos/editarlos.
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const store = await getStoreBySlug(params.slug);
  if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

  const currentUser = await getCurrentUser();
  const isOwner = currentUser?.id === store.userId;

  const { userId, bankName, bankAccountNumber, bankAccountHolder, bankAccountType, ...publicStore } =
    store;

  if (isOwner) {
    return NextResponse.json({
      store: { ...publicStore, bankName, bankAccountNumber, bankAccountHolder, bankAccountType },
    });
  }
  return NextResponse.json({ store: publicStore });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const store = await requireStoreAdmin(params.slug);
  if (!store) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const {
    paymentQrImageUrl,
    paymentInstructions,
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
    bankName,
    bankAccountNumber,
    bankAccountHolder,
    bankAccountType,
    dropAt,
  } = body;

  if (category !== undefined && category && !STORE_CATEGORIES.some((c) => c.value === category)) {
    return NextResponse.json({ error: "Rubro inválido" }, { status: 400 });
  }
  if (themeColor !== undefined && !isValidHexColor(themeColor)) {
    return NextResponse.json({ error: "Color de marca inválido" }, { status: 400 });
  }
  if (fontChoice !== undefined && !STORE_FONTS.some((f) => f.value === fontChoice)) {
    return NextResponse.json({ error: "Tipografía inválida" }, { status: 400 });
  }

  await updateStoreSettings(store.id, {
    ...(paymentQrImageUrl !== undefined ? { paymentQrImageUrl } : {}),
    ...(paymentInstructions !== undefined ? { paymentInstructions } : {}),
    ...(whatsapp !== undefined ? { whatsapp } : {}),
    ...(city !== undefined ? { city } : {}),
    ...(ownerName !== undefined ? { ownerName } : {}),
    ...(category !== undefined ? { category } : {}),
    ...(themeColor !== undefined ? { themeColor } : {}),
    ...(logoUrl !== undefined ? { logoUrl } : {}),
    ...(fontChoice !== undefined ? { fontChoice } : {}),
    ...(tagline !== undefined ? { tagline: (tagline && String(tagline).trim()) || null } : {}),
    ...(instagramUrl !== undefined
      ? { instagramUrl: (instagramUrl && String(instagramUrl).trim()) || null }
      : {}),
    ...(tiktokUrl !== undefined ? { tiktokUrl: (tiktokUrl && String(tiktokUrl).trim()) || null } : {}),
    ...(facebookUrl !== undefined
      ? { facebookUrl: (facebookUrl && String(facebookUrl).trim()) || null }
      : {}),
    ...(bankName !== undefined ? { bankName: (bankName && String(bankName).trim()) || null } : {}),
    ...(bankAccountNumber !== undefined
      ? { bankAccountNumber: (bankAccountNumber && String(bankAccountNumber).trim()) || null }
      : {}),
    ...(bankAccountHolder !== undefined
      ? { bankAccountHolder: (bankAccountHolder && String(bankAccountHolder).trim()) || null }
      : {}),
    ...(bankAccountType !== undefined ? { bankAccountType: bankAccountType || null } : {}),
    ...(dropAt !== undefined ? { dropAt: dropAt || null } : {}),
  });

  // PATCH ya está protegido por requireStoreAdmin (solo la dueña de la
  // tienda puede llegar hasta acá), así que sí devolvemos sus datos
  // bancarios completos.
  const updated = (await getStoreBySlug(params.slug))!;
  const { userId, ...ownStore } = updated;
  return NextResponse.json({ store: ownStore });
}

// Le permite al dueño de una tienda rechazada "empezar de nuevo": borra la
// tienda (y en cascada sus productos/pedidos) para poder crear otra desde
// /crear-tienda. Restringido a tiendas rechazadas — no es una forma
// genérica de borrar una tienda activa o pendiente.
export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const store = await requireStoreAdmin(params.slug);
  if (!store) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (store.status !== "rechazada") {
    return NextResponse.json(
      { error: "Solo se puede eliminar una tienda rechazada" },
      { status: 400 }
    );
  }

  await deleteStore(store.id);
  return NextResponse.json({ ok: true });
}
