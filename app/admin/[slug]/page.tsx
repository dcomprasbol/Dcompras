import { redirect } from "next/navigation";
import { requireStoreAdmin, getCurrentUser } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminPage({ params }: { params: { slug: string } }) {
  const store = await requireStoreAdmin(params.slug);
  if (!store) redirect("/login");
  const user = await getCurrentUser();

  return (
    <AdminShell
      slug={params.slug}
      status={store.status}
      email={user?.email ?? ""}
      rejectionNote={store.rejectionNote}
    />
  );
}
