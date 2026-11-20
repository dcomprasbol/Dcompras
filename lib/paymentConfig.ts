// ¿Está activo el cobro automático por QR? Un solo lugar para la regla que
// usan el checkout, la billetera y el directorio: Infinity primero, SIP de
// respaldo si su llave de servicio de plataforma está cargada (mismo orden
// que app/api/stores/[slug]/orders/route.ts).
import { isInfinityConfigured } from "@/lib/infinityPayments";
import { isSipConfigured } from "@/lib/sip";

export function isAutoQrEnabled(): boolean {
  return isInfinityConfigured() || (isSipConfigured() && Boolean(process.env.SIP_APIKEY_SERVICIO));
}
