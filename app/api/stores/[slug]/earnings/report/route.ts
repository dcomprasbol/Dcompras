import { NextRequest, NextResponse } from "next/server";
import { requireStoreAdmin } from "@/lib/auth";
import { getSalesReport } from "@/lib/repo";

// Reporte de ventas de un período (para que el vendedor lo cuadre contra
// sus liquidaciones) — ?from=yyyy-mm-dd&to=yyyy-mm-dd, ambos inclusive.
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const store = await requireStoreAdmin(params.slug);
  if (!store) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from || !to) {
    return NextResponse.json({ error: "Faltan las fechas del período" }, { status: 400 });
  }

  // paid_at es un timestamp completo (ISO) — "to" viene como yyyy-mm-dd sin
  // hora, así que hay que extenderlo hasta el final de ese día para que
  // incluya las ventas de esa fecha completa.
  const report = await getSalesReport(store.id, `${from}T00:00:00.000Z`, `${to}T23:59:59.999Z`);

  return NextResponse.json({ report });
}
