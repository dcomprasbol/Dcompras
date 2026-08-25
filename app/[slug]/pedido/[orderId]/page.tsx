import { getStoreBySlug, getOrderById } from "@/lib/repo";
import { notFound } from "next/navigation";
import { formatBs, deliveryTypeLabel } from "@/lib/utils";
import RevealOnScroll from "@/components/landing/RevealOnScroll";
import ConfirmReceivedButton from "@/components/ConfirmReceivedButton";

export const dynamic = "force-dynamic";

const STEPS = [
  { key: "confirmado", label: "Confirmado" },
  { key: "en_preparacion", label: "En preparación" },
  { key: "enviado", label: "Enviado" },
  { key: "entregado", label: "Recibido" },
] as const;

function stepIndex(status: string): number {
  if (status === "entregado") return 3;
  if (status === "enviado") return 2;
  if (status === "en_preparacion") return 1;
  return 0; // pendiente o pagado
}

function formatEstimatedDelivery(value: string): string {
  // yyyy-mm-dd guardado tal cual lo eligió el vendedor — lo parseamos como
  // fecha local (no UTC) para que no se corra un día según el huso horario.
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return value;
  return new Date(y, m - 1, d).toLocaleDateString("es-BO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default async function OrderTrackingPage({
  params,
}: {
  params: { slug: string; orderId: string };
}) {
  const store = await getStoreBySlug(params.slug);
  if (!store) notFound();

  const order = await getOrderById(params.orderId);
  if (!order || order.storeId !== store.id) notFound();

  const code = order.id.slice(-6).toUpperCase();
  const currentStep = stepIndex(order.status);
  const whatsappMsg = encodeURIComponent(
    `Hola, te escribo por mi pedido #${code} en ${store.name}.`
  );

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 md:px-8">
      <RevealOnScroll>
        <span className="tag-editorial store-accent-bg">Seguimiento de pedido</span>
        <h1 className="mt-4 font-impact text-3xl uppercase leading-[0.95] text-ink md:text-4xl">
          Pedido #{code}
        </h1>
        <p className="mt-2 text-sm text-ink/50">
          {new Date(order.createdAt).toLocaleDateString("es-BO", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}{" "}
          · {store.name}
        </p>
      </RevealOnScroll>

      {/* Línea de tiempo: 4 pasos fijos, sin importar si el pago fue por QR
          o contra entrega — lo único que cambia es qué tan lejos llegó.
          Animada para que se sienta "viva": el paso actual pulsa, los
          pasos ya completados hacen pop al aparecer, y la línea entre dos
          pasos completados se dibuja de izquierda a derecha en vez de
          aparecer ya llena. */}
      <RevealOnScroll delay={80} className="mt-10">
        <div className="flex items-start">
          {STEPS.map((step, i) => (
            <div key={step.key} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center">
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
                  {i === currentStep && (
                    <span
                      className="store-accent-bg absolute inset-0 animate-ping opacity-60"
                      aria-hidden="true"
                    />
                  )}
                  <div
                    className={`relative flex h-8 w-8 items-center justify-center border text-xs font-bold ${
                      i <= currentStep
                        ? "store-accent-bg border-transparent"
                        : "border-ink/15 bg-white text-ink/30"
                    } ${i < currentStep ? "animate-pop" : ""}`}
                    style={i < currentStep ? { animationDelay: `${i * 150}ms` } : undefined}
                  >
                    {i < currentStep ? "✓" : i + 1}
                  </div>
                </div>
                <p
                  className={`mt-2 max-w-[5.5rem] text-center text-[11px] font-semibold uppercase tracking-wide ${
                    i <= currentStep ? "text-ink" : "text-ink/35"
                  }`}
                >
                  {step.label}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div className="mx-1 h-[2px] flex-1 overflow-hidden bg-ink/10">
                  {i < currentStep && (
                    <div
                      className="store-accent-bg h-full origin-left animate-grow-x"
                      style={{ animationDelay: `${i * 150 + 200}ms` }}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </RevealOnScroll>

      {order.status === "entregado" && order.deliveredAt && (
        <RevealOnScroll delay={120} className="mt-8">
          <p className="border border-jade-500 bg-jade-50 px-4 py-3 text-center text-sm font-semibold text-jade-700">
            Recibido el{" "}
            {new Date(order.deliveredAt).toLocaleDateString("es-BO", {
              day: "numeric",
              month: "long",
            })}
          </p>
        </RevealOnScroll>
      )}

      {order.status === "enviado" && order.estimatedDelivery && (
        <RevealOnScroll delay={120} className="mt-8 border border-ink/10 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">
            Llega estimado el
          </p>
          <p className="mt-1 font-impact text-lg uppercase text-ink">
            {formatEstimatedDelivery(order.estimatedDelivery)}
          </p>
        </RevealOnScroll>
      )}

      {order.status === "enviado" && (
        <RevealOnScroll delay={160} className="mt-6">
          <ConfirmReceivedButton slug={params.slug} orderId={order.id} />
          <p className="mt-2 text-center text-xs text-ink/40">
            Confírmalo apenas te llegue, así el vendedor sabe que todo salió bien.
          </p>
        </RevealOnScroll>
      )}

      <RevealOnScroll delay={200} className="mt-10 border border-ink/10 bg-white">
        <div className="border-b border-ink/10 p-4">
          <span className="section-mark mb-2 text-ink" aria-hidden="true" />
          <h2 className="font-impact text-sm uppercase tracking-tight text-ink">Tu pedido</h2>
        </div>
        <div className="space-y-1 p-4 text-sm text-ink/70">
          {order.items.map((item) => (
            <p key={item.id}>
              {item.quantity}x {item.label} — {formatBs(item.unitPrice * item.quantity)}
            </p>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-ink/10 p-4">
          <span className="text-sm font-medium text-ink/70">Total</span>
          <span className="font-mono text-base font-bold text-ink">{formatBs(order.total)}</span>
        </div>
        <div className="border-t border-ink/10 p-4 text-sm text-ink/60">
          <p>
            {deliveryTypeLabel(order.deliveryType)}: {order.customerAddress}
          </p>
          <p className="mt-1 text-xs text-ink/40">
            Pago: {order.paymentMethod === "qr" ? "QR" : "Contra entrega"}
          </p>
        </div>
      </RevealOnScroll>

      {store.whatsapp && (
        <RevealOnScroll delay={240} className="mt-6 text-center">
          <a
            href={`https://wa.me/591${store.whatsapp.replace(/\D/g, "")}?text=${whatsappMsg}`}
            target="_blank"
            className="nav-sweep text-sm font-semibold text-ink/60 hover:text-ink"
          >
            ¿Alguna duda? Escríbele a {store.name} por WhatsApp →
          </a>
        </RevealOnScroll>
      )}
    </div>
  );
}
