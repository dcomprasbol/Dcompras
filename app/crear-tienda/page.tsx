import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getStoreByUserId } from "@/lib/repo";
import CrearTiendaForm from "./CrearTiendaForm";

export const dynamic = "force-dynamic";

// Si ya hay sesión y esa cuenta ya tiene una tienda, no tiene sentido
// mostrarle el formulario de nuevo (el POST fallaría con "Ya tienes una
// tienda creada") — la mandamos directo a su panel. Se resuelve acá, en el
// servidor, para que no haya ni parpadeo ni ida y vuelta en el cliente.
export default async function CrearTiendaPage() {
  const user = await getCurrentUser();

  if (user) {
    const store = await getStoreByUserId(user.id);
    if (store) redirect(`/admin/${store.slug}`);
  }

  const metadata = user?.user_metadata;
  const googleName = (metadata?.full_name || metadata?.name) as string | undefined;

  return (
    <CrearTiendaForm
      initialSession={user ? { email: user.email ?? null, ownerName: googleName ?? "" } : null}
    />
  );
}
