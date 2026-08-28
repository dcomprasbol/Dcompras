// Cliente para el servicio SIP de MC4/Banco BISA (cobro por QR automático).
// Ver "EspecificacionServiciosSIP" para el detalle de cada endpoint.
//
// Credenciales de dos niveles:
// - SIP_APIKEY + SIP_USERNAME + SIP_PASSWORD: nivel EMPRESA (Dcompras), sirven
//   para pedir un token. Se obtienen una sola vez al registrarse con el banco.
// - apikeyServicio: nivel CUENTA BANCARIA, uno por tienda — así el dinero le
//   sigue llegando directo al vendedor, Dcompras nunca lo toca. Lo carga el
//   admin de plataforma en /plataforma cuando el banco habilita el servicio
//   de esa tienda (ver lib/repo.ts → updateStoreSipConfig).
//
// Mientras SIP_APIKEY/SIP_USERNAME/SIP_PASSWORD no estén seteados, o una
// tienda no tenga apikeyServicio, el checkout pide coordinar el pago por
// WhatsApp en vez de generar un QR — ver app/api/stores/[slug]/orders/route.ts.

const SIP_BASE_URL = process.env.SIP_BASE_URL;
const SIP_APIKEY = process.env.SIP_APIKEY;
const SIP_USERNAME = process.env.SIP_USERNAME;
const SIP_PASSWORD = process.env.SIP_PASSWORD;

export function isSipConfigured(): boolean {
  return Boolean(SIP_BASE_URL && SIP_APIKEY && SIP_USERNAME && SIP_PASSWORD);
}

type SipEnvelope<T> = { codigo: string; mensaje: string; objeto: T };

class SipError extends Error {
  codigo?: string;
  constructor(message: string, codigo?: string) {
    super(message);
    this.codigo = codigo;
  }
}

// El token dura 4h según la especificación; lo cacheamos en memoria del
// proceso con un margen de seguridad y lo renovamos solo si hace falta.
let cachedToken: { value: string; expiresAt: number } | null = null;
const TOKEN_TTL_MS = 3.5 * 60 * 60 * 1000; // 3.5h de margen sobre las 4h reales

async function fetchToken(): Promise<string> {
  if (!SIP_BASE_URL || !SIP_APIKEY || !SIP_USERNAME || !SIP_PASSWORD) {
    throw new SipError("SIP no está configurado (faltan variables de entorno)");
  }
  const res = await fetch(`${SIP_BASE_URL}/autenticacion/v1/generarToken`, {
    method: "POST",
    headers: { apikey: SIP_APIKEY, "Content-Type": "application/json" },
    body: JSON.stringify({ username: SIP_USERNAME, password: SIP_PASSWORD }),
  });
  const data = (await res.json()) as SipEnvelope<{ token: string }>;
  if (!res.ok || data.codigo !== "OK") {
    throw new SipError(data.mensaje || "No se pudo obtener el token de SIP", data.codigo);
  }
  return data.objeto.token;
}

async function getToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }
  const token = await fetchToken();
  cachedToken = { value: token, expiresAt: Date.now() + TOKEN_TTL_MS };
  return token;
}

// Llama a un endpoint que requiere Authorization + apikeyServicio,
// reintentando una vez con un token nuevo si SIP responde 401 (token vencido).
async function sipServiceRequest<T>(
  path: string,
  apikeyServicio: string,
  body: unknown
): Promise<T> {
  if (!SIP_BASE_URL) throw new SipError("SIP no está configurado (falta SIP_BASE_URL)");

  async function attempt(token: string) {
    return fetch(`${SIP_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        apikeyServicio,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  }

  let token = await getToken();
  let res = await attempt(token);
  if (res.status === 401) {
    token = await getToken(true);
    res = await attempt(token);
  }

  const data = (await res.json()) as SipEnvelope<T>;
  if (!res.ok || data.codigo !== "0000") {
    throw new SipError(data.mensaje || "SIP rechazó la solicitud", data.codigo);
  }
  return data.objeto;
}

// dd/mm/yyyy, como pide la especificación.
export function formatSipDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export type GenerarQrResult = {
  imagenQr: string;
  idQr: string;
  fechaVencimiento: string;
  bancoDestino: string;
  cuentaDestino: string;
  idTransaccion: number;
};

export async function generarQr(params: {
  apikeyServicio: string;
  alias: string;
  callback: string;
  detalleGlosa: string;
  monto: number;
  moneda: "BOB" | "USD";
  fechaVencimiento: string;
}): Promise<GenerarQrResult> {
  return sipServiceRequest<GenerarQrResult>("/api/v1/generaQr", params.apikeyServicio, {
    alias: params.alias,
    callback: params.callback,
    // La glosa tiene un máximo de 30 caracteres (v1.2.4 de la especificación).
    detalleGlosa: params.detalleGlosa.slice(0, 30),
    monto: Number(params.monto.toFixed(2)),
    moneda: params.moneda,
    fechaVencimiento: params.fechaVencimiento,
    tipoSolicitud: "API",
    unicoUso: "true",
  });
}

export async function inhabilitarPago(apikeyServicio: string, alias: string): Promise<void> {
  await sipServiceRequest<null>("/api/v1/inhabilitarPago", apikeyServicio, { alias });
}

export type EstadoTransaccion = {
  alias: string;
  estadoActual: "PENDIENTE" | "INHABILITADO" | "ERROR" | "PAGADO";
  fechaProcesamiento?: string;
  numeroOrdenOriginante?: string;
  monto?: number;
  idQr?: string;
  moneda?: string;
  cuentaCliente?: string;
  nombreCliente?: string;
  documentoCliente?: string;
};

export async function estadoTransaccion(
  apikeyServicio: string,
  alias: string
): Promise<EstadoTransaccion> {
  return sipServiceRequest<EstadoTransaccion>("/api/v1/estadoTransaccion", apikeyServicio, {
    alias,
  });
}
