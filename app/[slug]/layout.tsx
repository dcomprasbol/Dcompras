import { getStoreBySlug, getStoreByUserId } from "@/lib/repo";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CartProvider } from "@/lib/cart-context";
import CartHeaderBadge from "@/components/CartHeaderBadge";
import AccountMenu from "@/components/AccountMenu";
import { fontStack } from "@/lib/utils";
import { readableAccentText, readableOnAccent } from "@/lib/color";
import { getCurrentUser, requirePlatformAdmin } from "@/lib/auth";
import { resolveStoreTheme } from "@/lib/storeTheme";
import Icon from "@/components/Icon";
import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";

function siteOrigin() {
  if (process.env.PUBLIC_APP_URL) return process.env.PUBLIC_APP_URL.replace(/\/$/, "");
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "www.dcompras.shop";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

// La marca del vendedor también fuera de la página: pestaña del navegador
// (nombre + logo), vista previa del link al compartirlo por WhatsApp o
// Facebook (nombre, frase y logo) y color de la barra del navegador en el
// celular. Antes todas las tiendas mostraban "Dcompras" ahí.
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const store = await getStoreBySlug(params.slug);
  if (!store || store.status !== "aprobada") return { title: "Tienda en Dcompras" };
  const origin = siteOrigin();
  const name = store.name.trim();
  const description =
    store.tagline?.trim() || `Compra en ${name}: catálogo en línea, pago por QR o contra entrega.`;
  const logo = store.logoUrl ? `${origin}/${store.slug}/logo` : undefined;
  return {
    metadataBase: new URL(origin),
    title: { default: name, template: `%s · ${name}` },
    description,
    icons: logo ? { icon: logo, apple: logo } : undefined,
    openGraph: {
      type: "website",
      locale: "es_BO",
      url: `${origin}/${store.slug}`,
      siteName: name,
      title: name,
      description,
      images: logo ? [{ url: logo, alt: name }] : undefined,
    },
    twitter: { card: "summary", title: name, description, images: logo ? [logo] : undefined },
  };
}

export async function generateViewport({ params }: { params: { slug: string } }): Promise<Viewport> {
  const store = await getStoreBySlug(params.slug);
  return store ? { themeColor: store.themeColor } : {};
}

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const store = await getStoreBySlug(params.slug);
  if (!store) notFound();
  // Cuenta del comprador (opcional): si ya tiene sesión, le mostramos un
  // acceso directo a "Mis pedidos" en vez de forzarlo a buscar el link de
  // seguimiento que le llegó por WhatsApp. Nunca es obligatorio para
  // comprar — el checkout como invitado sigue funcionando igual.
  const buyer = await getCurrentUser();

  // Una tienda no aprobada (pendiente, rechazada, suspendida) no existe para
  // el público. Solo la pueden abrir su dueño ("Vista previa" desde su
  // panel, para ver cómo queda antes de que la aprueben) y el admin de
  // plataforma (desde el directorio de /plataforma, para revisarla).
  const preview = store.status !== "aprobada";
  const isOwner = Boolean(buyer && buyer.id === store.userId);
  if (preview && !isOwner && !(await requirePlatformAdmin())) notFound();
  // Si el que está logueado es un vendedor (tiene su propia tienda en
  // Dcompras, sea esta o cualquier otra), le mostramos acceso directo a "Mi
  // panel" acá mismo — antes, si entraba a ver cómo se veía SU tienda como
  // comprador, para volver a su panel tenía que salir hasta la landing
  // (único lugar donde existía ese link). Mismo criterio que
  // components/landing/Nav.tsx.
  const ownStore = buyer ? await getStoreByUserId(buyer.id) : null;
  const theme = resolveStoreTheme(store.storeStyle, store.category);

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
    // Los íconos (components/Icon.tsx) toman el color de la tienda, no el jade de Dcompras.
    "--icon-accent": readableAccentText(store.themeColor),
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
        {preview && (
          <div className="bg-amber-400 px-5 py-2 text-center font-sans text-xs font-semibold text-ink">
            {isOwner ? "Vista previa · Así se verá tu tienda. " : "Vista de administrador · "}
            Esta tienda está <span className="uppercase">{store.status}</span> y el público todavía no
            puede verla.{" "}
            <Link href={isOwner ? `/admin/${params.slug}` : "/plataforma?seccion=tiendas"} className="underline">
              Volver al panel
            </Link>
          </div>
        )}
        <header className="store-header-bg store-border sticky top-0 z-10 border-b backdrop-blur">
          <div className="h-1 bg-[var(--store-accent)]" aria-hidden="true" />
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-3 md:px-8">
            <Link href={`/${params.slug}`} className="flex min-w-0 items-center gap-3">
              {store.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={store.logoUrl}
                  alt={store.name}
                  className="store-border h-12 w-12 shrink-0 rounded-[var(--store-radius)] border object-cover md:h-14 md:w-14"
                />
              ) : (
                <span className="store-accent-bg flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--store-radius)] font-display text-lg font-bold md:h-14 md:w-14">
                  {store.name.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="min-w-0">
                <span className="font-display store-text block truncate text-lg font-bold leading-tight md:text-xl">
                  {store.name}
                </span>
                {store.tagline && (
                  <span className="store-text-soft hidden max-w-xs truncate text-xs md:block">{store.tagline}</span>
                )}
              </span>
            </Link>
            <div className="flex items-center gap-3">
              {buyer ? (
                <>
                  {ownStore && (
                    <Link
                      href="/admin"
                      className="store-accent-soft-bg store-accent-text flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition hover:opacity-80"
                    >
                      <Icon name="panel" className="h-3.5 w-3.5" />
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
                    <Icon name="box" className="h-3.5 w-3.5" />
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
          <div className="h-1 bg-[var(--store-accent)]" aria-hidden="true" />
          <div className="mx-auto max-w-7xl px-5 py-10 md:px-8">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                {store.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={store.logoUrl}
                    alt={store.name}
                    className="store-border h-20 w-20 shrink-0 rounded-[var(--store-radius-lg)] border object-cover md:h-24 md:w-24"
                  />
                ) : (
                  <span className="store-accent-bg flex h-20 w-20 shrink-0 items-center justify-center rounded-[var(--store-radius-lg)] font-display text-3xl font-bold md:h-24 md:w-24">
                    {store.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="font-display store-text text-2xl font-bold leading-tight">{store.name}</p>
                  {store.tagline && <p className="store-text-soft mt-1 text-sm">{store.tagline}</p>}
                  {store.city && (
                    <p className="store-accent-text mt-1 text-xs font-semibold uppercase tracking-wider">{store.city}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {store.whatsapp && (
                  <a
                    href={`https://wa.me/591${store.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="store-accent-bg inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition hover:opacity-90"
                  >
                    <Icon name="chat" mono className="h-4 w-4" />
                    WhatsApp
                  </a>
                )}
                {socialLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.href!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="store-border store-text inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition hover:border-[var(--store-accent)]"
                  >
                    {s.label}
                  </a>
                ))}
                <Link
                  href={`/${params.slug}/mi-pedido`}
                  className="store-text-soft inline-flex items-center gap-1.5 px-2 py-2 text-sm font-semibold hover:opacity-80"
                >
                  <Icon name="box" className="h-4 w-4" />
                  Mi pedido
                </Link>
              </div>
            </div>
            <p className="store-text-soft mt-6 text-[11px] opacity-50">
              Tienda en Dcompras · pagos por QR o contra entrega ·{" "}
              <Link href="/terminos" className="underline hover:opacity-80">
                Términos
              </Link>{" "}
              ·{" "}
              <Link href="/privacidad" className="underline hover:opacity-80">
                Privacidad
              </Link>
            </p>
          </div>
          <div className="store-border overflow-hidden border-t px-4 py-2" aria-hidden="true">
            <p className="wordmark-crop text-center text-[13vw] text-[var(--store-accent-text)] opacity-25 sm:text-[7vw]">
              {store.name}
            </p>
          </div>
        </footer>
      </div>
    </CartProvider>
  );
}
