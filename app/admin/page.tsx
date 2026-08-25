import { redirect } from "next/navigation";
import { getCurrentUser, requirePlatformAdmin } from "@/lib/auth";
import { getStoreByUserId } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function AdminIndexPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const store = await getStoreByUserId(user.id);
  if (store) redirect(`/admin/${store.slug}`);

  // Cuentas de administrador de plataforma no tienen tienda propia: van a
  // la cola de revisión en vez de al flujo de "crear tienda".
  const platformAdmin = await requirePlatformAdmin();
  if (platformAdmin) redirect("/plataforma");

  // Cuenta logueada sin tienda: puede ser un comprador (la mayoría de las
  // cuentas ahora no tienen tienda) o alguien a mitad de crear la suya. En
  // vez de asumir que quiere vender, lo mandamos a su historial de
  // compras — desde ahí mismo puede crear su tienda si quiere.
  redirect("/mis-pedidos");
}
