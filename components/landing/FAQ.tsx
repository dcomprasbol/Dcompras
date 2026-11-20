import RevealOnScroll from "./RevealOnScroll";
import Accordion from "@/components/Accordion";
import { commissionPercent } from "@/lib/commission";

// Objeciones reales de alguien que nunca vendió fuera de WhatsApp: dinero,
// confianza, esfuerzo. Todas las respuestas describen lo que Dcompras hace de
// verdad hoy — nada de promesas que el producto todavía no cumple.
const FAQS = [
  {
    q: "¿Es gratis de verdad?",
    a: `Sí. Crear tu tienda, publicar y recibir pedidos no te cuesta nada. Solo cuando te pagan con el QR automático hay un cargo de ${commissionPercent()} % por pago verificado, y tú eliges quién lo paga: tu cliente, que lo ve antes de pagar, o tú, y tu tienda muestra el sello «Sin recargos». Contra entrega no tiene ningún cargo.`,
  },
  {
    q: "¿Necesito saber de diseño o tecnología?",
    a: "No. Eliges el color, tu logo (si tienes) y el tipo de letra, y la tienda se arma sola con tus productos.",
  },
  {
    q: "¿Cómo recibo el pago de mis clientes?",
    a: "Tus clientes pagan con QR o contra entrega. Con el QR automático, el pago entra a Dcompras, el pedido se marca como pagado y tú pides tu liquidación cuando quieras: te transferimos al QR que cargues en tu panel, con comprobante. Contra entrega, te pagan directo al recibir.",
  },
  {
    q: "¿Tengo que dejar de usar WhatsApp?",
    a: "No. Dcompras no reemplaza tu WhatsApp: arma el pedido con todos los datos y te avisa para que coordines la entrega ahí mismo, como ya lo haces.",
  },
  {
    q: "¿Alguien revisa mi tienda antes de que sea pública?",
    a: "Sí. Un administrador confirma que tu WhatsApp es real antes de aprobar tu tienda, así tus compradores saben que las tiendas en Dcompras existen de verdad.",
  },
  {
    q: "¿Cuánto tarda en estar lista mi tienda?",
    a: "Crear la cuenta y subir tus primeros productos toma unos minutos. Después revisamos tu tienda y, cuando está aprobada, ya puedes compartir tu link.",
  },
];

export default function FAQ() {
  return (
    <section id="preguntas" className="bg-ink px-5 py-20 text-white">
      <div className="mx-auto max-w-3xl">
        <RevealOnScroll>
          <h2 className="font-impact text-4xl uppercase leading-[0.9] tracking-tight md:text-6xl">
            Preguntas
            <br />
            frecuentes
          </h2>
        </RevealOnScroll>

        <div className="mt-12 border-t border-white/15">
          {FAQS.map((item, i) => (
            <RevealOnScroll key={item.q} delay={i * 50}>
              <Accordion question={item.q} answer={item.a} dark />
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
