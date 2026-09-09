import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/landing/Nav";
import Footer from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Política de Privacidad | Dcompras",
  description: "Cómo Dcompras recolecta, usa y protege tus datos personales.",
};

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

export default function PrivacidadPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-5 py-16 md:px-8">
        <span className="tag-editorial bg-ink text-white">Legal</span>
        <h1 className="mt-4 font-impact text-3xl uppercase leading-[0.95] tracking-tight text-ink md:text-4xl">
          Política de Privacidad
        </h1>
        <p className="mt-2 text-sm text-ink/50">Última actualización: {LAST_UPDATED}</p>

        <P>
          Este documento es un borrador base pensado para reflejar qué datos recolecta Dcompras
          hoy y para qué los usa. Todavía va a pasar por revisión legal antes de considerarse
          definitivo.
        </P>

        <H2>1. Quién trata tus datos</H2>
        <P>
          Dcompras es responsable de los datos personales que se describen en esta política.
          Podés contactarnos en{" "}
          <a href="mailto:dcomprasbol@gmail.com" className="font-semibold text-ink underline">
            dcomprasbol@gmail.com
          </a>{" "}
          para cualquier consulta sobre tus datos.
        </P>

        <H2>2. Qué datos recolectamos</H2>
        <H3>Si sos Comprador</H3>
        <Ul>
          <li>
            Nombre, teléfono/WhatsApp y dirección de entrega que escribís al hacer un pedido (o
            la ubicación que elegís en el mapa, si la usás).
          </li>
          <li>Email y método de inicio de sesión, si creás una cuenta (con contraseña o con Google).</li>
          <li>
            El historial de tus pedidos, su estado, y —si elegís dejarlos— calificación y
            comentario sobre un pedido recibido.
          </li>
        </Ul>
        <H3>Si sos Vendedor</H3>
        <Ul>
          <li>Nombre, WhatsApp, ciudad, categoría y redes sociales de tu tienda.</li>
          <li>El logo y las fotos de productos que subís.</li>
          <li>La foto del QR que usás para recibir tus liquidaciones.</li>
          <li>Email y método de inicio de sesión de tu cuenta.</li>
        </Ul>
        <H3>En ambos casos</H3>
        <Ul>
          <li>
            Datos técnicos básicos (dirección IP, tipo de navegador) que se generan
            automáticamente al usar cualquier sitio web.
          </li>
          <li>
            El contenido de tu carrito de compras y, si buscás un pedido por teléfono en
            &quot;Mi pedido&quot;, ese teléfono — estos dos datos se guardan en tu propio
            navegador, no en nuestros servidores, y solo vos podés verlos desde tu dispositivo.
          </li>
        </Ul>
        <P>
          Nunca recolectamos ni almacenamos los datos de tu tarjeta o cuenta bancaria: los pagos
          por QR los procesa un proveedor externo especializado en pagos, que cumple sus propias
          normas de seguridad.
        </P>

        <H2>3. Para qué usamos tus datos</H2>
        <Ul>
          <li>Procesar y hacer seguimiento de tus pedidos.</li>
          <li>Permitir que el Vendedor coordine la entrega con vos.</li>
          <li>Procesar pagos por QR a través de nuestro proveedor de pagos.</li>
          <li>Liquidar a los Vendedores lo que corresponde por sus ventas.</li>
          <li>Prevenir fraude y mantener segura la plataforma.</li>
          <li>Comunicarte novedades de tu pedido o de la plataforma.</li>
        </Ul>

        <H2>4. Con quién compartimos tus datos</H2>
        <Ul>
          <li>
            El Vendedor de la tienda donde comprás ve tu nombre, teléfono y dirección — es
            indispensable para que pueda entregarte tu pedido.
          </li>
          <li>Nuestro proveedor de procesamiento de pagos recibe los datos necesarios para cobrar el QR (monto, referencia del pedido).</li>
          <li>No vendemos ni alquilamos tus datos a terceros con fines de publicidad.</li>
          <li>Podemos compartir datos si una autoridad competente lo requiere por ley.</li>
        </Ul>

        <H2>5. Dónde se guardan tus datos</H2>
        <P>
          Tus datos se guardan en servidores de nuestro proveedor de base de datos, con acceso
          restringido y conexión cifrada (HTTPS).
        </P>

        <H2>6. Cuánto tiempo los guardamos</H2>
        <P>
          Guardamos tus datos mientras tu cuenta esté activa, y el tiempo adicional razonable que
          necesitemos por temas contables, de seguridad o para resolver algún reclamo pendiente.
        </P>

        <H2>7. Tus derechos</H2>
        <P>Podés pedirnos en cualquier momento:</P>
        <Ul>
          <li>Acceder a los datos que tenemos sobre vos.</li>
          <li>Corregirlos si están mal.</li>
          <li>Pedir que los eliminemos (salvo los que debamos conservar por ley, ej. registros de una venta ya realizada).</li>
        </Ul>
        <P>
          Escribinos a{" "}
          <a href="mailto:dcomprasbol@gmail.com" className="font-semibold text-ink underline">
            dcomprasbol@gmail.com
          </a>{" "}
          para ejercer cualquiera de estos derechos.
        </P>

        <H2>8. Menores de edad</H2>
        <P>Dcompras no está dirigido a menores de 18 años sin supervisión de un adulto responsable.</P>

        <H2>9. Cambios a esta política</H2>
        <P>Podemos actualizar esta política; si el cambio es importante, lo vamos a anunciar en la plataforma.</P>

        <H2>10. Contacto</H2>
        <P>
          <a href="mailto:dcomprasbol@gmail.com" className="font-semibold text-ink underline">
            dcomprasbol@gmail.com
          </a>
        </P>

        <P>
          Ver también nuestros{" "}
          <Link href="/terminos" className="font-semibold text-ink underline">
            Términos y Condiciones
          </Link>
          .
        </P>
      </main>
      <Footer />
    </>
  );
}
