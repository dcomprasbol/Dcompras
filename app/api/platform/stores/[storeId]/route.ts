import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth";
import { updateStoreStatus, softDeleteStore, setStoreSuspended, getStoreById, getUserEmail } from "@/lib/repo";
import { STORE_STATUSES } from "@/lib/utils";
import {
  sendStoreDeletedByAdminEmail,
  sendStoreReactivatedEmail,
  sendStoreSuspendedEmail,
  type EmailResult,
} from "@/lib/email";

// Mensaje mínimo que el admin tiene que escribir al suspender o eliminar:
// es lo que el vendedor lee en su correo y en su panel.
const MIN_NOTE = 10;

export async function PATCH(
  req: NextRequest,
  { params }: { params: { storeId: string } }
) {
  const admin = await requirePlatformAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { status, note } = body;

  if (!STORE_STATUSES.some((s) => s.value === status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const store = await getStoreById(params.storeId);
  if (!store || store.deletedAt) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

  // Suspender / reactivar: guarda el motivo (lo ve el vendedor en su panel)
  // y le avisa por correo.
  if (status === "suspendida" || (status === "aprobada" && store.status === "suspendida")) {
    const suspending = status === "suspendida";
    const message = typeof note === "string" ? note.trim() : "";
    if (suspending && message.length < MIN_NOTE) {
      return NextResponse.json(
        { error: "Escribe el motivo de la suspensión (al menos 10 caracteres): es lo que va a leer el vendedor." },
        { status: 400 }
      );
    }
    await setStoreSuspended(store.id, suspending, suspending ? message : null);
    const to = await getUserEmail(store.userId);
    let email: EmailResult = { sent: false, reason: "La cuenta no tiene correo." };
    if (to) {
      email = suspending
        ? await sendStoreSuspendedEmail(to, store.name.trim(), message)
        : await sendStoreReactivatedEmail(to, store.name.trim());
    }
    return NextResponse.json({ ok: true, email, to });
  }

  await updateStoreStatus(params.storeId, status, note ?? null);
  return NextResponse.json({ ok: true });
}

// Borrado de moderación (no confundir con el cierre que hace el propio
// vendedor en /api/stores/[slug]/close). Es soft-delete — ver
// softDeleteStore en lib/repo.ts. Pide la misma frase de confirmación DOS
// VECES que ya validó el modal (StoreModerationModals) y un mensaje para el
// vendedor; se vuelve a chequear acá porque nunca hay que confiar solo en la
// validación del navegador para una acción tan destructiva.
const CONFIRM_PHRASE = "D_compras_delete";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { storeId: string } }
) {
  const admin = await requirePlatformAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (body.confirm1 !== CONFIRM_PHRASE || body.confirm2 !== CONFIRM_PHRASE) {
    return NextResponse.json({ error: "Confirmación incorrecta" }, { status: 400 });
  }
  const message = typeof body.note === "string" ? body.note.trim() : "";
  if (message.length < MIN_NOTE) {
    return NextResponse.json(
      { error: "Escribe el motivo de la eliminación (al menos 10 caracteres): es lo que va a leer el vendedor." },
      { status: 400 }
    );
  }

  const store = await getStoreById(params.storeId);
  if (!store || store.deletedAt) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

  await softDeleteStore(store.id, { by: "admin", note: message });
  const to = await getUserEmail(store.userId);
  const email: EmailResult = to
    ? await sendStoreDeletedByAdminEmail(to, store.name.trim(), message)
    : { sent: false, reason: "La cuenta no tiene correo." };
  return NextResponse.json({ ok: true, email, to });
}
