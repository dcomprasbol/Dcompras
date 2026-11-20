// Estado del retiro en Punto Dcompras para el comprador (página de
// seguimiento). Sin hooks: se renderiza en el servidor.
import Icon from "@/components/Icon";
import { formatBs } from "@/lib/utils";
import { amountToCollect } from "@/lib/pickupRules";

type Point = {
  name: string;
  address: string;
  city: string;
  reference: string | null;
  hours: string;
  lat: number;
  lng: number;
};

function fmtDate(value: string) {
  return new Date(value).toLocaleDateString("es-BO", { weekday: "long", day: "numeric", month: "long" });
}

export default function PickupStatusCard({
  point,
  status,
  code,
  deadline,
  fee,
  storageFeePerDay,
  pickedUpAt,
}: {
  point: Point;
  status: string;
  code: string | null;
  deadline: string | null;
  fee: number;
  storageFeePerDay: number;
  pickedUpAt: string | null;
}) {
  const due = amountToCollect(fee, storageFeePerDay, deadline);
  return (
    <div className="border border-ink/10 bg-white">
      <div className="flex items-center gap-2 border-b border-ink/10 p-4">
        <Icon name="pin" className="h-5 w-5" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Retiro en Punto Dcompras</p>
          <p className="text-sm font-bold text-ink">{point.name}</p>
        </div>
      </div>

      {status === "esperando_vendedor" && (
        <div className="p-4 text-sm text-ink/70">
          <p className="font-semibold text-ink">La tienda va a dejar tu pedido en el punto.</p>
          <p className="mt-1 text-xs text-ink/50">
            Cuando lo recibamos te mostramos aquí tu código de retiro. Guarda este link.
          </p>
        </div>
      )}

      {status === "en_punto" && (
        <div className="p-4">
          <p className="text-sm font-semibold text-jade-700">¡Tu pedido ya está en el punto!</p>
          <div className="mt-3 border-2 border-dashed border-ink/20 p-4 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/40">Tu código de retiro</p>
            <p className="font-mono text-4xl font-bold tracking-[0.3em] text-ink">{code}</p>
            <p className="mt-1 text-xs text-ink/50">Dáselo al encargado junto con tu nombre.</p>
          </div>
          <div className="mt-3 space-y-1 text-xs text-ink/60">
            {deadline && (
              <p>
                <span className="font-semibold text-ink">Retíralo hasta el {fmtDate(deadline)}</span>
                {due.overdueDays > 0
                  ? ` · Ya pasó el plazo: se suman ${formatBs(storageFeePerDay)} por día de custodia.`
                  : " sin costo extra."}
              </p>
            )}
            <p>
              Pagas al retirar: <span className="font-semibold text-ink">{formatBs(due.total)}</span>
              {due.storage > 0 ? ` (servicio ${formatBs(due.fee)} + custodia ${formatBs(due.storage)})` : " (servicio de retiro)"}
            </p>
          </div>
        </div>
      )}

      {status === "retirado" && (
        <div className="p-4 text-sm font-semibold text-jade-700">
          <Icon name="check" mono className="mr-1 h-4 w-4" />
          Retiraste tu pedido{pickedUpAt ? ` el ${fmtDate(pickedUpAt)}` : ""}.
        </div>
      )}

      {status === "devuelto" && (
        <div className="p-4 text-sm text-ink/70">
          Tu pedido no se retiró a tiempo y volvió a la tienda. Escríbele a la tienda para coordinar.
        </div>
      )}

      {(status === "esperando_vendedor" || status === "en_punto") && (
        <div className="border-t border-ink/10 p-4 text-xs text-ink/60">
          <p>
            {point.address}, {point.city}
            {point.reference ? ` · ${point.reference}` : ""}
          </p>
          <p className="mt-0.5">
            <Icon name="clock" mono className="mr-1 h-3 w-3" />
            {point.hours}
          </p>
          <a
            href={`https://www.google.com/maps?q=${point.lat},${point.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block font-semibold text-ink underline underline-offset-2"
          >
            Cómo llegar →
          </a>
        </div>
      )}
    </div>
  );
}
