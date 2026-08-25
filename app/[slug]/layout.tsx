import { getStoreBySlug } from "@/lib/repo";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CartProvider } from "@/lib/cart-context";
import CartHeaderBadge from "@/components/CartHeaderBadge";
import AccountMenu from "@/components/AccountMenu";
import { fontStack } from "@/lib/utils";
import { readableAccentText, readableOnAccent } from "@/lib/color";
import { getCurrentUser } from "@/lib/auth";

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
      <div className="min-h-screen bg-paper font-sans" style={themeStyle}>
        <header className="sticky top-0 z-10 border-b border-ink/10 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 md:px-8">
            <Link href={`/${params.slug}`} className="flex items-center gap-2.5">
              {store.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={store.logoUrl} alt={store.name} className="h-8 w-8 object-cover" />
              ) : (
                <span className="store-accent-bg flex h-8 w-8 items-center justify-center font-display text-sm font-bold">
                  {store.name.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="font-display text-lg font-bold text-ink">{store.name}</span>
            </Link>
            <div className="flex items-center gap-3">
              {buyer ? (
                <>
                  <Link
                    href="/mis-pedidos"
                    className="hidden text-xs font-semibold uppercase tracking-wider text-ink/60 hover:text-ink sm:inline"
                  >
                    Mis pedidos
                  </Link>
                  <AccountMenu email={buyer.email ?? ""} redirectTo={`/${params.slug}`} />
                </>
              ) : (
                <Link
                  href={`/login?next=${encodeURIComponent(`/${params.slug}`)}`}
                  className="hidden text-xs font-semibold uppercase tracking-wider text-ink/60 hover:text-ink sm:inline"
                >
                  Iniciar sesión
                </Link>
              )}
              <CartHeaderBadge slug={params.slug} />
            </div>
          </div>
        </header>
        <main>{children}</main>

        <footer className="mt-10 border-t border-ink/10">
          <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-display text-sm font-bold text-ink">{store.name}</p>
                {store.city && <p className="mt-1 text-xs text-ink/50">{store.city}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-wider text-ink/60">
                {store.whatsapp && (
                  <a
                    href={`https://wa.me/591${store.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    className="nav-sweep hover:text-ink"
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
                    className="nav-sweep hover:text-ink"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
            <p className="mt-6 text-[11px] text-ink/30">
              Tienda en Dcompras · pagos por QR o contra entrega
            </p>
          </div>
          <div className="overflow-hidden border-t border-ink/10 px-4 py-2" aria-hidden="true">
            <p className="wordmark-crop text-center text-[13vw] text-ink/[0.05] sm:text-[7vw]">
              {store.name}
            </p>
          </div>
        </footer>
      </div>
    </CartProvider>
  );
}
