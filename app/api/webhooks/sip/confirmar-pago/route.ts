import { NextRequest, NextResponse } from "next/server";
import { getOrderBySipIdQr, updateOrderStatus } from "@/lib/repo";
import { calculateCommission } from "@/lib/commission";

// Endpoint que SIP (BISA) llama cuando confirma el pago de un QR generado
// por generarQr (lib/sip.ts). Ver "3.1 CALL BACK" en la especificación.
//
// Seguridad: autenticación Basic con credenciales que nosotros elegimos
// (SIP_CALLBACK_USER / SIP_CALLBACK_PASSWORD) y le damos al banco al
// registrar la URL de este endpoint como callback — no son las mismas
// credenciales que usamos para llamar a SIP.
function isAuthorized(req: NextRequest): boolean {
  const user = process.env.SIP_CALLBACK_USER;
  const password = process.env.SIP_CALLBACK_PASSWORD;
  if (!user || !password) return false;

  const header = req.headers.get("authorization") || "";
  if (!header.startsWith("Basic ")) return false;

  let decoded: string;
  try {
    decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  } catch {
    return false;
  }
  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex === -1) return false;
  const sentUser = decoded.slice(0, separatorIndex);
  const sentPassword = decoded.slice(separatorIndex + 1);
  return sentUser === user && sentPassword === password;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { codigo: "9401", mensaje: "No autorizado" },
      { status: 401, headers: { "WWW-Authenticate": "Basic" } }
    );
  }

  const body = await req.json().catch(() => null);
  const { alias, idQr, monto } = body || {};

  if (!alias || !idQr) {
    return NextResponse.json(
      { codigo: "9400", mensaje: "Faltan datos (alias/idQr)" },
      { status: 400 }
    );
  }

  // idQr es el identificador que emite el banco por ese QR específico — lo
  // usamos como llave principal de búsqueda (más confiable que confiar solo
  // en el alias que nosotros mismos enviamos).
  const order = await getOrderBySipIdQr(idQr);
  if (!order || order.id !== alias) {
    return NextResponse.json(
      { codigo: "9404", mensaje: "No se encontró el pedido para ese QR" },
      { status: 400 }
    );
  }

  // Chequeo de integridad: el monto pagado tiene que calzar con lo que le
  // pedimos a SIP al generar el QR (order.total + comisión — ver
  // lib/commission.ts), no con order.total a secas: este pedido llegó por
  // getOrderBySipIdQr, o sea que sí pasó por Dcompras. Si no calza, no lo
  // marcamos pagado — queda para revisión manual.
  const { totalToCharge } = calculateCommission(order.total, true);
  if (typeof monto === "number" && Math.abs(monto - totalToCharge) > 0.01) {
    console.error(
      `Callback de SIP para el pedido ${order.id}: monto ${monto} no coincide con lo esperado ${totalToCharge}`
    );
    return NextResponse.json({ codigo: "9422", mensaje: "El monto no coincide" }, { status: 400 });
  }

  await updateOrderStatus(order.id, "pagado");

  return NextResponse.json({ codigo: "0000", mensaje: "Registro Exitoso" });
}
