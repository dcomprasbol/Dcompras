// Guion del tutorial del vendedor: el texto de cada escena (subtítulo y
// narración). Vive aparte de las animaciones (components/admin/PaymentsGuide.tsx)
// para que el generador de voz (scripts/generate-tutorial-voice.ts) grabe
// exactamente las mismas frases que se muestran.
//
// Si cambias un texto, vuelve a correr `npm run voice:tutorial`: la escena
// cuyo texto cambió usa la voz del dispositivo hasta que exista su MP3.

import { formatBs, PAYOUT_PROCESSING_TIME } from "@/lib/utils";

export type TutorialPayer = "comprador" | "vendedor";
export type ChapterId = "panel" | "cobro" | "liquidacion" | "seguridad";

export const TUTORIAL_PRICE_EXAMPLE = 150;

export function tutorialScript(percent: number, payer: TutorialPayer): Record<ChapterId, string[]> {
  const price = TUTORIAL_PRICE_EXAMPLE;
  const fee = Math.round(price * percent) / 100;
  const net = payer === "vendedor" ? Math.round((price - fee) * 100) / 100 : price;
  return {
    panel: [
      "¡Bienvenido a Dcompras! En pocos minutos te mostramos cómo vender, cobrar y recibir tu dinero.",
      "En Productos subes lo que vendes. Con el botón Historia creas una imagen lista para tus estados e historias.",
      "En Pedidos ves todo lo que te compran. Si alguien no pagó, se lo recuerdas por WhatsApp con un solo toque.",
      "En Clientes ves quién te compra y qué le gusta, para volver a venderle.",
      "Muy importante: carga tu QR en «Datos y cobros». Es donde te pagamos tu dinero; sin tu QR no puedes pedir tu liquidación.",
    ],
    cobro: [
      "Tu cliente arma su pedido en tu tienda y elige pagar con QR.",
      "Dcompras crea un QR único para ese pedido, con el monto exacto.",
      "Tu cliente paga desde la app de cualquier banco. El banco nos confirma el pago al instante.",
      "Te llega el aviso y el pedido queda pagado solo. El stock se descuenta automáticamente.",
      payer === "vendedor"
        ? `Se suman ${formatBs(net)} a tu billetera: tu precio menos el ${percent}% que elegiste asumir.`
        : `Tus ${formatBs(price)} se suman a tu billetera. El ${percent}% lo pagó tu cliente.`,
      `Y tú decides quién paga ese ${percent}%: tu cliente, sumado al precio, o tú, y tu tienda muestra el sello «Sin recargos». Lo eliges y lo cambias cuando quieras en «Datos y cobros».`,
    ],
    liquidacion: [
      "Cuando quieras, tocas «Agendar liquidación». Se junta todo tu saldo en una sola solicitud.",
      `Dcompras te transfiere al QR que cargaste en «Datos y cobros». Normalmente en ${PAYOUT_PROCESSING_TIME}.`,
      "Te llega el comprobante de la transferencia, para que lo compares con tu banco.",
      "Tú confirmas que te llegó. Recién ahí se cierra la liquidación.",
    ],
    seguridad: [
      "Una captura de pantalla no sirve para marcar un pedido como pagado: solo vale la confirmación del banco.",
      "Revisamos que el monto pagado sea exacto. Si no coincide, el pedido no avanza y lo revisa una persona.",
      "Cada venta y cada liquidación quedan en tu historial, con su comprobante.",
      "Ninguna liquidación se da por pagada sin tu confirmación.",
    ],
  };
}

/** Todas las frases posibles (con las dos opciones de quién paga), sin repetir. */
export function allTutorialLines(percent: number): string[] {
  const set = new Set<string>();
  for (const payer of ["comprador", "vendedor"] as const) {
    for (const lines of Object.values(tutorialScript(percent, payer))) lines.forEach((l) => set.add(l));
  }
  return Array.from(set);
}
