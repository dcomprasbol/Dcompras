import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listOrdersByBuyerId, getStoreByUserId } from "@/lib/repo";
import { formatBs, statusLabel } from "@/lib/utils";
import AccountMenu from "@/components/AccountMenu";
import RevealOnScroll from "@/components/landing/RevealOnScroll";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  pagado: "bg-green-100 text-green-800",
  en_preparacion: "bg-blue-100 text-blue-800",
  enviado: "bg-gray-200 text-ink/70",
  entregado: "bg-emerald-100 text-emerald-800",
};

export default async function MisPedidosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/mis-pedidos");

  const [orders, ownStore] = await Promise.all([
    listOrdersByBuyerId(user.id),
    getStoreByUserId(user.id),
  ]);

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-10 border-b border-ink/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="font-impact text-xl text-ink">
            DCOMPRAS
          </Link>
          <AccountMenu email={user.email ?? ""} redirectTo="/" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10 md:px-8">
        <RevealOnScroll>
          <span className="section-mark mb-2 text-ink" aria-hidden="true" />
          <h1 className="font-impact text-3xl uppercase tracking-tight text-ink">Mis pedidos</h1>
          <p className="mt-2 text-sm text-ink/50">
            Todas tus compras en Dcompras, de cualquier tienda, en un solo lugar.
          </p>
        </RevealOnScroll>

        {orders.length === 0 ? (
          <RevealOnScroll
            delay={80}
            className="mt-8 border border-dashed border-ink/15 bg-white p-8 text-center"
          >
            <p className="text-sm text-ink/50">Todavía no hiciste ningún pedido.</p>
            <Link href="/" className="btn-editorial btn-editorial-solid mt-4 inline-flex">
              Ver tiendas en Dcompras
            </Link>
          </RevealOnScroll>
        ) : (
          <div className="mt-8 space-y-3">
            {orders.map((order, i) => (
              <RevealOnScroll key={order.id} delay={Math.min(i, 6) * 60}>
                <Link
                  href={`/${order.storeSlug}/pedido/${order.id}`}
                  className="flex items-center justify-between gap-4 border border-ink/10 bg-white p-4 transition hover:border-ink/25"
                >
                  <div>
                    <p className="text-sm font-bold text-ink">
                      #{order.id.slice(-6).toUpperCase()}{" "}
                      <span className="font-normal text-ink/40">· {order.storeName}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-ink/40">
                      {new Date(order.createdAt).toLocaleDateString("es-BO", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}{" "}
                      · {order.items.length} producto{order.items.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-mono text-sm font-bold text-ink">
                      {formatBs(order.total)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[order.status]}`}
                    >
                      {statusLabel(order.status)}
                    </span>
                  </div>
                </Link>
              </RevealOnScroll>
            ))}
          </div>
        )}

        {!ownStore && (
          <RevealOnScroll delay={120} className="mt-10 border border-ink/10 bg-ink p-6 text-center text-white">
            <p className="font-impact text-lg uppercase tracking-tight">¿Vendes por redes sociales?</p>
            <p className="mt-1 text-sm text-white/60">
              Crea tu propia tienda en Dcompras, gratis.
            </p>
            <Link href="/crear-tienda" className="btn-editorial bg-white text-ink border-white mt-4 inline-flex">
              Crear mi tienda
            </Link>
          </RevealOnScroll>
        )}
      </main>
    </div>
  );
}
