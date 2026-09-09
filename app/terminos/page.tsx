import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/landing/Nav";
import Footer from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Términos y Condiciones | Dcompras",
  description: "Términos y condiciones de uso de la plataforma Dcompras.",
};

// Última actualización fija (no "hoy" en cada carga) — solo se toca a mano
// cuando de verdad cambia el contenido de este documento.
const LAST_UPDATED = "9 de septiembre de 2026";

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-10 font-impact text-lg uppercase tracking-tight text-ink">{children}</h2>
  );
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-5 text-sm font-bold text-ink">{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-sm leading-relaxed text-ink/70">{children}</p>;
}
function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink/70">{children}</ul>;
}

export default function TerminosPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-5 py-16 md:px-8">
        <span className="tag-editorial bg-ink text-white">Legal</span>
        <h1 className="mt-4 font-impact text-3xl uppercase leading-[0.95] tracking-tight text-ink md:text-4xl">
          Términos y Condiciones
        </h1>
        <p className="mt-2 text-sm text-ink/50">Última actualización: {LAST_UPDATED}</p>

        <P>
          Este documento es un borrador base pensado para reflejar cómo funciona Dcompras hoy.
          Todavía va a pasar por revisión legal antes de considerarse definitivo.
        </P>

        <H2>1. Quiénes somos</H2>
        <P>
          Dcompras es una plataforma tecnológica que permite a personas y negocios
          (&quot;Vendedores&quot;) crear su propia tienda en línea y vender sus productos a
          compradores (&quot;Compradores&quot;) en Bolivia. Dcompras no es dueña de los productos
          que se publican, no los fabrica ni los vende directamente: actúa como intermediario que
          conecta a Vendedores y Compradores, y facilita el catálogo, el carrito de compras, el
          checkout y, cuando corresponde, el cobro por código QR.
        </P>
        <P>
          Dcompras opera actualmente sin una sociedad formalmente constituida a la fecha de esta
          versión de los Términos. Si en el futuro se constituye una sociedad para operarla, esa
          sociedad asumirá los derechos y obligaciones aquí descritos, sin que eso cambie las
          condiciones de uso para los usuarios.
        </P>

        <H2>2. Aceptación de estos Términos</H2>
        <P>
          Al crear una cuenta, crear una tienda, o realizar un pedido en Dcompras, aceptás estos
          Términos y Condiciones y nuestra{" "}
          <Link href="/privacidad" className="font-semibold text-ink underline">
            Política de Privacidad
          </Link>
          . Si no estás de acuerdo, no debés usar la plataforma.
        </P>

        <H2>3. Quién puede usar Dcompras</H2>
        <P>
          Tenés que ser mayor de 18 años, o contar con la supervisión de un adulto responsable,
          para crear una cuenta, una tienda, o realizar una compra.
        </P>

        <H2>4. Cuentas de usuario</H2>
        <Ul>
          <li>Podés crear una cuenta con email y contraseña, o con tu cuenta de Google.</li>
          <li>
            Sos responsable de mantener la confidencialidad de tus credenciales y de toda
            actividad que ocurra desde tu cuenta.
          </li>
          <li>La información que nos das (nombre, teléfono, etc.) tiene que ser real y estar actualizada.</li>
          <li>
            Podés comprar sin crear una cuenta (&quot;como invitado&quot;); en ese caso, podés
            encontrar tus pedidos más adelante escribiendo el mismo teléfono que usaste al
            comprar, desde la sección &quot;Mi pedido&quot; de cada tienda.
          </li>
        </Ul>

        <H2>5. Tiendas y Vendedores</H2>
        <H3>5.1 Creación y aprobación</H3>
        <P>
          Cualquier persona puede solicitar crear su tienda en Dcompras. Toda tienda nueva pasa
          por una revisión antes de quedar visible al público; Dcompras puede aprobar, rechazar
          (indicando el motivo) o pedir cambios antes de aprobar una tienda, a su sola
          discreción, si considera que no cumple con estos Términos o representa un riesgo para
          la plataforma o sus usuarios.
        </P>
        <H3>5.2 Responsabilidad del Vendedor</H3>
        <P>El Vendedor es el único responsable de:</P>
        <Ul>
          <li>La veracidad de la información de sus productos (descripción, precio, fotos, stock disponible).</li>
          <li>Que sus productos sean legales, seguros y no infrinjan derechos de terceros (marcas, patentes, derechos de autor).</li>
          <li>Cumplir con sus obligaciones tributarias y comerciales frente a las autoridades bolivianas correspondientes a su actividad.</li>
          <li>Coordinar y realizar la entrega de lo que vendió, en el plazo y forma que ofreció.</li>
          <li>Atender los reclamos o dudas de sus compradores.</li>
        </Ul>
        <P>
          Dcompras puede suspender o eliminar una tienda si detecta incumplimiento de estos
          Términos, fraude, venta de productos prohibidos, o reclamos reiterados de compradores.
        </P>
        <H3>5.3 Comisión y liquidaciones</H3>
        <P>
          Cuando un Comprador paga con el QR automático generado por Dcompras, se suma una
          comisión sobre el precio del Vendedor, que paga el Comprador (nunca se le descuenta al
          Vendedor) — el monto de esa comisión se muestra siempre antes de confirmar el pago. Los
          pedidos pagados contra entrega, o coordinados directamente entre Vendedor y Comprador,
          no pagan comisión y nunca pasan por las cuentas de Dcompras.
        </P>
        <P>
          El dinero de las ventas por QR ingresa primero a una cuenta de cobro operada por
          Dcompras (a través de un proveedor de procesamiento de pagos) y se le transfiere
          después al Vendedor cuando este agenda su liquidación desde su panel, mediante el QR de
          cobro personal que el Vendedor carga en su cuenta. La liquidación queda cerrada solo
          cuando el propio Vendedor confirma haber recibido la transferencia.
        </P>
        <P>
          Dcompras puede modificar el porcentaje de esta comisión, informándolo con anticipación
          razonable a los Vendedores.
        </P>

        <H2>6. Pedidos y pagos (para Compradores)</H2>
        <Ul>
          <li>
            Podés pagar con QR automático (procesado por un proveedor externo de pagos) o contra
            entrega en efectivo, según lo que ofrezca cada tienda.
          </li>
          <li>
            El pedido, una vez confirmado, es un acuerdo de compra-venta entre vos y el Vendedor
            de esa tienda — Dcompras no es parte de ese contrato, solo facilita la plataforma y,
            cuando corresponde, el cobro.
          </li>
          <li>
            Reclamos sobre el producto (calidad, que no llegue, que no coincida con lo pedido) se
            resuelven directamente con el Vendedor, por WhatsApp desde la página de seguimiento
            de tu pedido. Dcompras puede mediar si el Vendedor no responde, pero no garantiza
            reembolsos ni el resultado de esa mediación.
          </li>
          <li>
            Hoy Dcompras no procesa reembolsos automáticos: cualquier devolución o cancelación
            depende de lo que acuerdes con el Vendedor.
          </li>
        </Ul>

        <H2>7. Contenido que subís</H2>
        <P>
          Al subir fotos, descripciones o cualquier contenido a tu tienda, garantizás que tenés
          los derechos para usarlo y le das a Dcompras el permiso necesario para mostrarlo en la
          plataforma (catálogo, redes, etc.) mientras tu tienda esté activa.
        </P>

        <H2>8. Uso prohibido</H2>
        <P>No podés usar Dcompras para:</P>
        <Ul>
          <li>Vender productos ilegales, robados, falsificados o prohibidos por la ley boliviana.</li>
          <li>Cometer fraude, suplantar identidad, o engañar a otros usuarios.</li>
          <li>Enviar spam o contenido no solicitado.</li>
          <li>Intentar vulnerar la seguridad de la plataforma.</li>
        </Ul>

        <H2>9. Propiedad intelectual</H2>
        <P>
          La marca &quot;Dcompras&quot;, el diseño y el código de la plataforma son propiedad de
          Dcompras (o de sus licenciantes) y no pueden copiarse ni usarse sin autorización.
        </P>

        <H2>10. Disponibilidad del servicio</H2>
        <P>
          Dcompras hace su mejor esfuerzo para que la plataforma esté disponible, pero no
          garantiza que funcione sin interrupciones, errores, o que un pago vía QR se confirme
          instantáneamente en todos los casos (el proveedor de pagos externo puede tener demoras
          ajenas a Dcompras).
        </P>

        <H2>11. Límite de responsabilidad</H2>
        <P>
          En la máxima medida permitida por la ley, Dcompras no es responsable por: la calidad,
          legalidad o entrega de los productos vendidos por los Vendedores; pérdidas causadas por
          fallas de terceros (proveedor de pagos, WhatsApp, internet); ni por daños indirectos
          derivados del uso de la plataforma.
        </P>

        <H2>12. Cambios a estos Términos</H2>
        <P>
          Podemos actualizar estos Términos en cualquier momento; los cambios importantes se van
          a anunciar en la plataforma. Seguir usando Dcompras después de un cambio implica que lo
          aceptás.
        </P>

        <H2>13. Ley aplicable</H2>
        <P>
          Estos Términos se rigen por las leyes del Estado Plurinacional de Bolivia. Cualquier
          disputa se someterá a los tribunales competentes de Bolivia.
        </P>

        <H2>14. Contacto</H2>
        <P>
          Para cualquier consulta sobre estos Términos, escribinos a{" "}
          <a href="mailto:dcomprasbol@gmail.com" className="font-semibold text-ink underline">
            dcomprasbol@gmail.com
          </a>
          .
        </P>
      </main>
      <Footer />
    </>
  );
}
