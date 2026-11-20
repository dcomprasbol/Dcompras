import { NextRequest, NextResponse } from "next/server";
import { requireStoreAdmin } from "@/lib/auth";
import { listStoreCustomers } from "@/lib/repo";

// "Mis clientes" del panel del vendedor: armados solos con los pedidos.
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const store = await requireStoreAdmin(params.slug);
  if (!store) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json({ customers: await listStoreCustomers(store.id) });
}
