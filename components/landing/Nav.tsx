import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getStoreByUserId } from "@/lib/repo";
import AccountMenu from "@/components/AccountMenu";

export default async function Nav() {
  const user = await getCurrentUser();
  // Una cuenta logueada puede ser de un vendedor (tiene tienda) o de un
  // comprador (no tiene) — cada quien va a lo suyo, no asumimos que todos
  // los que se loguean quieren vender.
  const ownStore = user ? await getStoreByUserId(user.id) : null;

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <nav className="hidden items-center gap-6 text-xs font-semibold uppercase tracking-wider text-ink/70 md:flex">
          <a href="#como-funciona" className="nav-sweep hover:text-ink">
            Cómo funciona
          </a>
          <a href="#vendedores" className="nav-sweep hover:text-ink">
            Vendedores
          </a>
          <a href="#precios" className="nav-sweep hover:text-ink">
            Precios
          </a>
        </nav>

        <Link
          href="/"
          className="flex items-center gap-1 font-impact text-2xl tracking-tight text-ink md:absolute md:left-1/2 md:-translate-x-1/2"
        >
          DCOMPRAS
          <span className="h-1.5 w-1.5 rounded-full bg-jade-500" aria-hidden="true" />
        </Link>

        <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-wider">
          {user ? (
            <>
              <Link
                href={ownStore ? "/admin" : "/mis-pedidos"}
                className="nav-sweep hidden text-ink/70 hover:text-ink sm:inline"
              >
                {ownStore ? "Mi panel" : "Mis pedidos"}
              </Link>
              <AccountMenu email={user.email ?? ""} redirectTo="/" />
            </>
          ) : (
            <>
              <Link href="/login" className="nav-sweep hidden text-ink/70 hover:text-ink sm:inline">
                Iniciar sesión
              </Link>
              <Link href="/crear-tienda" className="btn-editorial btn-editorial-solid !py-2.5 !px-4 text-[11px]">
                Crear tienda
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
