import { NextRequest, NextResponse } from "next/server";
import { requireStoreAdmin } from "@/lib/auth";
import { listActiveProducts, applyPriceBatch, revertPriceBatch, listPriceBatches } from "@/lib/repo";
import { applyBulkOp, describeBulkOp, isBulkOp, isRounding, BULK_OPS } from "@/lib/bulkPricing";

// Edición de precios en lote (ver lib/bulkPricing.ts):
//   GET                         → historial de lotes (para deshacer)
//   POST { ..., preview: true } → cómo quedarían los precios, sin guardar
//   POST { ..., preview: false} → aplica y devuelve el batchId
//   POST { revertBatchId }      → deshace un lote
// Los pedidos ya hechos no cambian: cada ítem guarda su precio (unit_price).

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const store = await requireStoreAdmin(params.slug);
  if (!store) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json({ batches: await listPriceBatches(store.id) });
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const store = await requireStoreAdmin(params.slug);
  if (!store) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  if (typeof body.revertBatchId === "string") {
    const count = await revertPriceBatch(store.id, body.revertBatchId);
    return NextResponse.json({ reverted: count });
  }

  const { productIds, op, rounding, preview } = body;
  const value = Number(body.value);
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return NextResponse.json({ error: "Elige al menos un producto" }, { status: 400 });
  }
  if (!isBulkOp(op) || !isRounding(rounding)) {
    return NextResponse.json({ error: "Operación inválida" }, { status: 400 });
  }
  const opInfo = BULK_OPS.find((o) => o.value === op)!;
  if (opInfo.needsValue && !(Number.isFinite(value) && value > 0 && value <= 100000)) {
    return NextResponse.json({ error: "Escribe un valor mayor a 0" }, { status: 400 });
  }
  if ((op === "pct_down" || op === "offer") && value >= 100) {
    return NextResponse.json({ error: "El porcentaje tiene que ser menor a 100" }, { status: 400 });
  }

  const wanted = new Set(productIds.map(String));
  const products = (await listActiveProducts(store.id)).filter((p) => wanted.has(p.id));

  const rows = products.map((p) => {
    const next = applyBulkOp({ price: p.price, compareAtPrice: p.compareAtPrice }, op, value, rounding);
    return {
      productId: p.id,
      name: p.name,
      oldPrice: p.price,
      oldCompareAt: p.compareAtPrice,
      newPrice: next?.price ?? p.price,
      newCompareAt: next ? next.compareAtPrice : p.compareAtPrice,
      changed: next !== null,
    };
  });

  if (preview !== false) {
    return NextResponse.json({ rows });
  }

  const changes = rows.filter((r) => r.changed);
  if (changes.length === 0) {
    return NextResponse.json({ error: "Ningún precio cambia con esa operación" }, { status: 400 });
  }
  const batchId = await applyPriceBatch(store.id, describeBulkOp(op, value, rounding), changes);
  return NextResponse.json({ batchId, applied: changes.length });
}
