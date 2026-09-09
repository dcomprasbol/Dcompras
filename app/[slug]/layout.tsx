import { getStoreBySlug, getStoreByUserId } from "@/lib/repo";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CartProvider } from "@/lib/cart-context";
import CartHeaderBadge from "@/components/CartHeaderBadge";
import AccountMenu from "@/components/AccountMenu";
import { fontStack } from "@/lib/utils";
import { readableAccentText, readableOnAccent } from "@/lib/color";
import { getCurrentUser } from "@/lib/auth";
import { themeForCategory } from "@/lib/storeTheme";

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const store = await getStoreBySlug(params.slug);
  if (!store || store.status !== "aprobada") notFound();

  // Cuenta del comprador (opcional): si ya tiene sesión, le mostramos un
  // acceso directo a "Mis pedidos" en vez de forzarlo a buscar el link de
  // seguimiento que le llegó por WhatsApp. Nunca es obligatorio para
  // comprar — el checkout como invitado sigue funcionando igual.
  const buyer = await getCurrentUser();
  // Si el que está logueado es un vendedor (tiene su propia tienda en
  // Dcompras, sea esta o cualquier otra), le mostramos acceso directo a "Mi
  // panel" acá mismo — antes, si entraba a ver cómo se veía SU tienda como
  // comprador, para volver a su panel tenía que salir hasta la landing
  // (único lugar donde existía ese link). Mismo criterio que
  // components/landing/Nav.tsx.
  const ownStore = buyer ? await getStoreByUserId(buyer.id) : null;
  const theme = themeForCategory(store.category);

  // Personalización por tienda: sobreescribimos las variables CSS que ya
  // usa el resto de la plataforma (--font-display / --font-body) y
  // agregamos --store-accent, para que las clases font-display, font-sans
  // y store-accent-* (globals.css) tomen automáticamente el color y la
  // tipografía elegidos por el dueño, sin tocar cada componente.
  //
  // El color de marca es cualquier hex que elija el vendedor — algunos
  // (amarillos, celestes pastel) son ilegibles como texto plano sobre
  // blanco, o como fondo de botón con texto blanco encima. Derivamos dos
  // variantes automáticamente para que siempre se vea bien sin pedirle al
  // vendedor que piense en contraste.
  const themeStyle = {
    "--store-accent": store.themeColor,
    "--store-accent-text": readableAccentText(store.themeColor),
    "--store-accent-ink": readableOnAccent(store.themeColor),
    "--font-display": fontStack(store.fontChoice),
    "--font-body": fontStack(store.fontChoice),
  } as React.CSSProperties;

  const socialLinks = [
    { href: store.instagramUrl, label: "Instagram" },
    { href: store.tiktokUrl, label: "TikTok" },
    { href: store.facebookUrl, label: "Facebook" },
  ].filter((s) => s.href);

  return (
    <CartProvider storeSlug={params.slug}>
      <div className="store-bg store-text min-h-screen font-sans" style={themeStyle} data-store-theme={theme}>
        <header className="store-header-bg store-border sticky top-0 z-10 border-b backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 md:px-8">
            <Link href={`/${params.slug}`} className="flex items-center gap-2.5">
              {store.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={store.logoUrl}
                  alt={store.name}
                  className="h-8 w-8 rounded-[var(--store-radius)] object-cover"
                />
              ) : (
                <span className="store-accent-bg flex h-8 w-8 items-center justify-center rounded-[var(--store-radius)] font-display text-sm font-bold">
                  {store.name.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="font-display store-text text-lg font-bold">{store.name}</span>
            </Link>
            <div className="flex items-center gap-3">
              {buyer ? (
                <>
                  {ownStore && (
                    <Link
                      href="/admin"
                      className="store-accent-soft-bg store-accent-text flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition hover:opacity-80"
                    >
                      <span aria-hidden="true">🛠️</span>
                      <span>Mi panel</span>
                    </Link>
                  )}
                  <Link
                    href="/mis-pedidos"
                    className="store-text-soft hidden text-xs font-semibold uppercase tracking-wider hover:opacity-80 sm:inline"
                  >
                    Mis pedidos
                  </Link>
                  <AccountMenu email={buyer.email ?? ""} redirectTo={`/${params.slug}`} />
                </>
              ) : (
                <>
                  {/* Para comprar sin cuenta: si cerró la pestaña de
                      seguimiento y no la tiene más, acá busca su pedido por
                      teléfono (ver /[slug]/mi-pedido) — no le pedimos crear
                      cuenta para eso. A pedido del dueño: tiene que ser
                      fácil de encontrar (no un link de texto perdido) para
                      que un cliente nuevo no crea que lo estafaron si no
                      encuentra cómo ver su pedido — por eso va SIEMPRE
                      visible (también en mobile, a diferencia de "Iniciar
                      sesión") como una pastilla con ícono, no como texto
                      plano. */}
                  <Link
                    href={`/${params.slug}/mi-pedido`}
                    className="store-accent-soft-bg store-accent-text flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition hover:opacity-80"
                  >
                    <span aria-hidden="true">📦</span>
                    <span>Mis pedidos</span>
                  </Link>
                  <Link
                    href={`/login?next=${encodeURIComponent(`/${params.slug}`)}`}
                    className="store-text-soft hidden text-xs font-semibold uppercase tracking-wider hover:opacity-80 sm:inline"
                  >
                    Iniciar sesión
                  </Link>
                </>
              )}
              <CartHeaderBadge slug={params.slug} />
            </div>
          </div>
        </header>
        <main>{children}</main>

        <footer className="store-border mt-10 border-t">
          <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-display store-text text-sm font-bold">{store.name}</p>
                {store.city && <p className="store-text-soft mt-1 text-xs">{store.city}</p>}
              </div>
              <div className="store-text-soft flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-wider">
                <Link href={`/${params.slug}/mi-pedido`} className="nav-sweep hover:opacity-80">
                  📦 Mi pedido
                </Link>
                {store.whatsapp && (
                  <a
                    href={`https://wa.me/591${store.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    className="nav-sweep hover:opacity-80"
                  >
                    WhatsApp
                  </a>
                )}
                {socialLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.href!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nav-sweep hover:opacity-80"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
            <p className="store-text-soft mt-6 text-[11px] opacity-50">
              Tienda en Dcompras · pagos por QR o contra entrega
            </p>
          </div>
          <div className="store-border overflow-hidden border-t px-4 py-2" aria-hidden="true">
            <p className="wordmark-crop store-text text-center text-[13vw] opacity-[0.05] sm:text-[7vw]">
              {store.name}
            </p>
          </div>
        </footer>
      </div>
    </CartProvider>
  );
}
