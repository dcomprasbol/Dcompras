import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth";
import { getPickupPoint, listOperators, setOperators, updatePickupPoint } from "@/lib/pickup";
import { parseOperatorEmails, parsePickupPointInput } from "@/lib/pickupInput";

// Editar un Punto Dcompras (datos, ubicación, precios, activo) y sus encargados.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requirePlatformAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const existing = await getPickupPoint(params.id);
  if (!existing) return NextResponse.json({ error: "Punto no encontrado" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = parsePickupPointInput(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  await updatePickupPoint(params.id, parsed.value);
  if (body.operators !== undefined) await setOperators(params.id, parseOperatorEmails(body.operators));
  const point = await getPickupPoint(params.id);
  return NextResponse.json({ point: { ...point, operators: await listOperators(params.id) } });
}
