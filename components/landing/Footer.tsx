import Link from "next/link";

// Solo enlaces a secciones/rutas que existen de verdad — nada de columnas
// "Sobre nosotros / Blog / Carreras" apuntando a páginas que no existen.
const PRODUCT_LINKS = [
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#precios", label: "Precios" },
  { href: "#preguntas", label: "Preguntas frecuentes" },
];

export default function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="font-impact text-2xl text-ink">DCOMPRAS</span>
            <p className="mt-2 max-w-xs text-sm text-ink/50">
              Hecho en Bolivia, para vendedoras y vendedores de redes sociales.
            </p>
          </div>

          <div className="flex gap-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-ink/40">
                Producto
              </p>
              <ul className="mt-3 space-y-2 text-sm text-ink/60">
                {PRODUCT_LINKS.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} className="nav-sweep hover:text-ink">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-ink/40">
                Cuenta
              </p>
              <ul className="mt-3 space-y-2 text-sm text-ink/60">
                <li>
                  <Link href="/crear-tienda" className="nav-sweep hover:text-ink">
                    Crear tienda
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="nav-sweep hover:text-ink">
                    Iniciar sesión
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-ink/10 pt-6 text-xs text-ink/40">
          © {new Date().getFullYear()} Dcompras.
        </div>
      </div>

      {/* Wordmark de cierre — motivo puramente decorativo, recortado por el
          overflow del footer. */}
      <div className="overflow-hidden border-t border-ink/10 px-5 py-4" aria-hidden="true">
        <p className="wordmark-crop text-center text-[19vw] text-ink/[0.06] sm:text-[13vw]">
          DCOMPRAS
        </p>
      </div>
    </footer>
  );
}
