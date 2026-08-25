import Link from "next/link";

// Barra angosta arriba del nav, estilo Shopify/SaaS: anuncia lo último de
// verdad (nada inventado) y empuja al mismo CTA principal.
export default function PromoBar() {
  return (
    <div className="bg-ink px-5 py-2 text-center text-white">
      <Link
        href="/crear-tienda"
        className="nav-sweep inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider"
      >
        Nuevo: elige el color, logo y tipografía de tu tienda — gratis
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
