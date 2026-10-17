import { redirect } from "next/navigation";
import { requireStoreAdmin, getCurrentUser } from "@/lib/auth";
import { getSellerOverview } from "@/lib/repo";
import AdminShell from "@/components/admin/AdminShell";
import type { SellerTab } from "@/components/admin/SellerHome";

export const dynamic = "force-dynamic";

const TABS: SellerTab[] = ["inicio", "productos", "pedidos", "diseno", "billetera", "datos", "soporte"];

export default async function AdminPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { tab?: string };
}) {
  const store = await requireStoreAdmin(params.slug);
  if (!store) redirect("/login");
  if (store.deletedAt) redirect("/crear-tienda");
  const [user, overview] = await Promise.all([getCurrentUser(), getSellerOverview(store.id)]);
  const initialTab = TABS.find((t) => t === searchParams.tab) ?? "inicio";

  return (
    <AdminShell
      slug={params.slug}
      status={store.status}
      email={user?.email ?? ""}
      rejectionNote={store.rejectionNote}
      suspensionNote={store.suspensionNote}
      store={{
        name: store.name,
        ownerName: store.ownerName,
        logoUrl: store.logoUrl,
        themeColor: store.themeColor,
      }}
      overview={overview}
      checklist={{
        hasLogo: Boolean(store.logoUrl),
        hasStyle: Boolean(store.storeStyle),
        hasProducts: overview.products > 0,
        hasQr: Boolean(store.paymentQrImageUrl),
        hasSocial: Boolean(store.instagramUrl || store.tiktokUrl || store.facebookUrl),
      }}
      initialTab={initialTab}
    />
  );
}
