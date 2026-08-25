import RevealOnScroll from "./RevealOnScroll";
import Accordion from "@/components/Accordion";

// Objeciones reales de alguien que nunca vendió fuera de WhatsApp: dinero,
// confianza, esfuerzo. Todas las respuestas describen lo que Dcompras hace de
// verdad hoy — nada de promesas que el producto todavía no cumple.
const FAQS = [
  {
    q: "¿Es gratis de verdad?",
    a: "Sí. Publicar tu catálogo y recibir pedidos por contra entrega no cuesta nada. Solo cobramos una comisión pequeña cuando activas el cobro automático por QR — si no lo usas, no pagas nada.",
  },
  {
    q: "¿Necesito saber de diseño o tecnología?",
    a: "No. Eliges el color de tu marca, tu logo (si tienes) y la tipografía desde un menú simple — nosotros armamos el resto de tu tienda.",
  },
  {
    q: "¿Cómo recibo el pago de mis clientes?",
    a: "Por QR (el mismo que ya usas para cobrar) o contra entrega en efectivo. Vos decides cuál ofrecer, o los dos.",
  },
  {
    q: "¿Tengo que dejar de usar WhatsApp?",
    a: "No. Dcompras no reemplaza tu WhatsApp: arma el pedido con todos los datos y te avisa para que coordines la entrega ahí mismo, como ya lo haces.",
  },
  {
    q: "¿Alguien revisa mi tienda antes de que sea pública?",
    a: "Sí. Un administrador confirma que tu WhatsApp es real antes de aprobar tu tienda — así tus compradores saben que las tiendas en Dcompras existen de verdad.",
  },
  {
    q: "¿Cuánto tarda en estar lista mi tienda?",
    a: "Unos minutos: creas tu cuenta, subes tus primeros productos, y compartes el link en tu bio o tu estado.",
  },
];

export default function FAQ() {
  return (
    <section id="preguntas" className="bg-ink px-5 py-20 text-white">
      <div className="mx-auto max-w-3xl">
        <RevealOnScroll>
          <h2 className="font-impact text-4xl uppercase leading-[0.9] tracking-tight md:text-6xl">
            Tus preguntas,
            <br />
            respondidas.
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
