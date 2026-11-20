import Link from "next/link";
import { redirect } from "next/navigation";
import { getPickupAccess } from "@/lib/auth";
import AccountMenu from "@/components/AccountMenu";
import PickupOperatorPanel from "@/components/pickup/PickupOperatorPanel";

export const dynamic = "force-dynamic";

// Panel del encargado del Punto Dcompras (rol "operador"). Entra quien
// figure como encargado de algún punto (lo asigna el admin en /plataforma →
// Puntos Dcompras) o el propio admin de plataforma.
export default async function PuntoPage() {
  const access = await getPickupAccess();
  if (!access) redirect("/login?next=/punto");

  const points = access.points.filter((p) => p.active || access.isAdmin);

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-10 border-b border-ink/5 bg-white/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link href="/punto" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Dcompras" className="h-6 w-auto" />
            <span className="border-l border-ink/10 pl-2.5 text-xs font-semibold text-ink/60">Punto Dcompras</span>
          </Link>
          <AccountMenu email={access.email} redirectTo="/login?next=/punto" />
        </div>
      </header>

      {points.length === 0 ? (
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <p className="text-base font-bold text-ink">Tu cuenta no es encargada de ningún punto</p>
          <p className="mt-2 text-sm text-ink/55">
            Pídele al equipo de Dcompras que agregue <span className="font-semibold">{access.email}</span> como encargado de un
            Punto Dcompras.
          </p>
        </div>
      ) : (
        <PickupOperatorPanel
          email={access.email}
          points={points.map((p) => ({
            id: p.id,
            name: p.name,
            city: p.city,
            address: p.address,
            hours: p.hours,
            fee: p.fee,
            storageFeePerDay: p.storageFeePerDay,
          }))}
        />
      )}
    </div>
  );
}
