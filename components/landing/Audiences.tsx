import RevealOnScroll from "./RevealOnScroll";
import Link from "next/link";

export default function Audiences() {
  return (
    <section id="vendedores" className="px-5 py-20">
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
        <RevealOnScroll>
          <div className="flex h-full flex-col bg-ink p-8 text-white md:p-10">
            <span className="text-xs font-semibold uppercase tracking-widest text-jade-400">
              Para vendedores
            </span>
            <h3 className="mt-3 font-impact text-2xl uppercase leading-[0.95] md:text-4xl">
              Deja de ser la secretaria de tu propio negocio
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Sin catálogo ordenado, cada venta te cuesta 20 mensajes de WhatsApp. Con Dcompras,
              tu cliente ve el producto, elige su talla, paga y tú solo recibes la notificación.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-white/80">
              {["Catálogo con link propio", "Cobro por QR", "Panel de pedidos en tiempo real"].map(
                (t) => (
                  <li key={t} className="flex items-center gap-2">
                    <span className="text-jade-400">＋</span>
                    {t}
                  </li>
                )
              )}
            </ul>
            <Link href="/crear-tienda" className="btn-editorial bg-white text-ink border-white mt-8 w-fit">
              Crear mi tienda gratis
            </Link>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={120}>
          <div className="flex h-full flex-col border border-ink/10 bg-white p-8 md:p-10">
            <span className="text-xs font-semibold uppercase tracking-widest text-coral-500">
              Para compradores
            </span>
            <h3 className="mt-3 font-impact text-2xl uppercase leading-[0.95] text-ink md:text-4xl">
              Compra sin tener que preguntar "¿todavía está disponible?"
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-ink/60">
              Ve el stock real, elige tu talla, paga con QR o contra entrega, y sigue el estado
              de tu pedido, sin depender de que el vendedor te conteste el chat.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-ink/70">
              {["Stock siempre actualizado", "Pago con QR o efectivo", "Sin registro obligatorio"].map(
                (t) => (
                  <li key={t} className="flex items-center gap-2">
                    <span className="text-coral-500">＋</span>
                    {t}
                  </li>
                )
              )}
            </ul>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
