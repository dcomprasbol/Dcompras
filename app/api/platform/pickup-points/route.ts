import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth";
import { createPickupPoint, listOperators, listPickupPoints, setOperators } from "@/lib/pickup";
import { parseOperatorEmails, parsePickupPointInput } from "@/lib/pickupInput";

// Puntos Dcompras (solo admin de plataforma): listar y crear.
export async function GET() {
  const admin = await requirePlatformAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const points = await listPickupPoints();
  const withOperators = await Promise.all(points.map(async (p) => ({ ...p, operators: await listOperators(p.id) })));
  return NextResponse.json({ points: withOperators });
}

export async function POST(req: NextRequest) {
  const admin = await requirePlatformAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const parsed = parsePickupPointInput(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const point = await createPickupPoint(parsed.value);
  await setOperators(point.id, parseOperatorEmails(body.operators));
  return NextResponse.json({ point: { ...point, operators: await listOperators(point.id) } });
}
