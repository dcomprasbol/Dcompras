// Envío de correos transaccionales (suspensión, eliminación de tienda) con
// Resend (https://resend.com) vía su API HTTP, sin librería. Requiere en el
// entorno:
//   RESEND_API_KEY  — clave de API de Resend
//   EMAIL_FROM      — remitente verificado, ej. "Dcompras <avisos@dcompras.shop>"
// Sin RESEND_API_KEY no se envía nada (devuelve sent: false) y quien llama
// decide qué hacer (el panel ofrece avisar por WhatsApp). Nunca tira error:
// un correo que no sale no debe frenar una suspensión o un cierre.

export type EmailResult = { sent: boolean; reason?: string };

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

// Plantilla simple con la marca de Dcompras (colores del sitio, sin
// imágenes externas para que se vea bien en cualquier cliente de correo).
function layout(title: string, paragraphs: string[], highlight?: { label: string; text: string }) {
  const body = paragraphs.map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#312a52">${p}</p>`).join("");
  const box = highlight
    ? `<div style="margin:18px 0;padding:14px 16px;background:#fafaf8;border-left:4px solid #1dbe86;border-radius:6px">
         <p style="margin:0 0 4px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#0b8a66">${escapeHtml(highlight.label)}</p>
         <p style="margin:0;font-size:15px;line-height:1.55;color:#14102a;white-space:pre-line">${escapeHtml(highlight.text)}</p>
       </div>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f4f3ef;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:28px 16px">
    <div style="background:#14102a;border-radius:12px 12px 0 0;padding:20px 24px">
      <span style="font-family:Impact,'Arial Black',sans-serif;font-size:24px;letter-spacing:.02em;color:#ffffff">DCOMPRAS<span style="color:#1dbe86">.</span></span>
    </div>
    <div style="background:#ffffff;border-radius:0 0 12px 12px;padding:26px 24px">
      <h1 style="margin:0 0 16px;font-size:20px;color:#14102a">${escapeHtml(title)}</h1>
      ${body}${box}
      <p style="margin:22px 0 0;font-size:13px;color:#8a85a0">Equipo de Dcompras · dcompras.shop</p>
    </div>
  </div></body></html>`;
}

async function send(to: string, subject: string, html: string, text: string): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, reason: "El envío de correos no está configurado (falta RESEND_API_KEY)." };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Dcompras <avisos@dcompras.shop>",
        to: [to],
        subject,
        html,
        text,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("Resend error", res.status, detail);
      return { sent: false, reason: `El proveedor de correo respondió ${res.status}.` };
    }
    return { sent: true };
  } catch (err) {
    console.error("Resend fetch failed", err);
    return { sent: false, reason: "No se pudo conectar con el proveedor de correo." };
  }
}

export function sendStoreSuspendedEmail(to: string, storeName: string, note: string) {
  const title = `Tu tienda ${storeName} fue suspendida`;
  const html = layout(
    title,
    [
      `Te escribimos del equipo de Dcompras para avisarte que tu tienda <strong>${escapeHtml(storeName)}</strong> fue suspendida.`,
      "Mientras esté suspendida, los compradores no pueden verla ni hacer pedidos. Tus productos y tus datos siguen guardados.",
      "Si tienes dudas o ya lo corregiste, escríbenos desde la sección Ayuda de tu panel.",
    ],
    { label: "Motivo de la suspensión", text: note }
  );
  const text = `${title}\n\nMotivo: ${note}\n\nMientras esté suspendida, los compradores no pueden verla ni hacer pedidos. Si tienes dudas, responde desde la sección Ayuda de tu panel en dcompras.shop.`;
  return send(to, title, html, text);
}

export function sendStoreReactivatedEmail(to: string, storeName: string) {
  const title = `Tu tienda ${storeName} está activa de nuevo`;
  const html = layout(title, [
    `Buenas noticias: tu tienda <strong>${escapeHtml(storeName)}</strong> fue reactivada y ya vuelve a estar visible para tus clientes.`,
  ]);
  return send(to, title, html, `${title}\n\nTu tienda ya vuelve a estar visible para tus clientes.`);
}

export function sendStoreDeletedByAdminEmail(to: string, storeName: string, note: string) {
  const title = `Tu tienda ${storeName} fue eliminada`;
  const html = layout(
    title,
    [
      `Te escribimos del equipo de Dcompras para avisarte que eliminamos tu tienda <strong>${escapeHtml(storeName)}</strong>.`,
      "Si tenías ganancias pendientes de liquidar, nos pondremos en contacto contigo para transferírtelas.",
    ],
    { label: "Motivo", text: note }
  );
  const text = `${title}\n\nMotivo: ${note}\n\nSi tenías ganancias pendientes de liquidar, nos pondremos en contacto contigo.`;
  return send(to, title, html, text);
}

export function sendStoreClosedBySellerEmail(to: string, storeName: string) {
  const title = `Cerraste tu tienda ${storeName}`;
  const html = layout(title, [
    `Confirmamos que tu tienda <strong>${escapeHtml(storeName)}</strong> fue eliminada y ya no está visible.`,
    "Si tenías ganancias pendientes de liquidar, nos pondremos en contacto contigo para transferírtelas.",
    "Si algún día quieres volver, puedes crear una tienda nueva con este mismo correo en dcompras.shop/crear-tienda. ¡Gracias por haber vendido con nosotros!",
  ]);
  const text = `${title}\n\nTu tienda fue eliminada. Si quieres volver, puedes crear una nueva con este mismo correo en dcompras.shop/crear-tienda.`;
  return send(to, title, html, text);
}
