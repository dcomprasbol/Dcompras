import Link from "next/link";

// Encabezado de las páginas públicas del directorio (/tiendas,
// /categoria/[x]): logo de Dcompras, acceso a todas las tiendas y a crear la
// propia.
export default function DirectoryHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-ink/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
        <Link href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Dcompras" className="h-6 w-auto" />
        </Link>
        <nav className="flex items-center gap-5 text-xs font-semibold uppercase tracking-wider">
          <Link href="/tiendas" className="nav-sweep hidden text-ink/60 hover:text-ink sm:inline">
            Todas las tiendas
          </Link>
          <Link href="/crear-tienda" className="btn-editorial btn-editorial-solid !px-4 !py-2.5 text-[11px]">
            Crear mi tienda
          </Link>
        </nav>
      </div>
    </header>
  );
}
