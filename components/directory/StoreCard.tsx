import Link from "next/link";
import Icon, { RankBadge } from "@/components/Icon";
import { categoryLabel } from "@/lib/utils";
import type { PublicStore } from "@/lib/repo";

// Tarjeta de una tienda en el directorio público. Portada armada con hasta 3
// fotos reales de sus productos (cargadas aparte, ver /api/img/product), el
// logo encima y los datos clave. Sin hooks: sirve en páginas de servidor y
// dentro del buscador de /tiendas.
export default function StoreCard({ store, rank }: { store: PublicStore; rank?: number }) {
  const [a, b, c] = store.previewIds;
  const img = (id: string) => `/api/img/product/${id}`;
  return (
    <Link
      href={`/${store.slug}`}
      className="group flex h-full flex-col overflow-hidden border border-ink/10 bg-white transition duration-300 hover:-translate-y-1 hover:border-ink/25 hover:shadow-[0_18px_40px_-20px_rgba(20,16,42,0.45)]"
    >
      <div className="relative h-40 overflow-hidden">
        {a ? (
          <div className="grid h-full grid-cols-3 grid-rows-2 gap-px bg-ink/10">
            <div className={`${b ? "col-span-2" : "col-span-3"} row-span-2 overflow-hidden`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img(a)} alt="" loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
            </div>
            {b && (
              <div className={`${c ? "" : "row-span-2"} overflow-hidden`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img(b)} alt="" loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
              </div>
            )}
            {c && (
              <div className="overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img(c)} alt="" loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
              </div>
            )}
          </div>
        ) : (
          <div className="relative h-full" style={{ backgroundColor: store.themeColor }}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)]" />
            <span className="absolute bottom-0 left-0 h-16 w-16 bg-ink/15 [clip-path:polygon(0_0,100%_100%,0_100%)]" aria-hidden="true" />
          </div>
        )}
        {rank !== undefined && (
          <span className="absolute left-3 top-3 shadow-sm">
            <RankBadge position={rank} />
          </span>
        )}
      </div>

      <div className="relative flex flex-1 flex-col px-4 pb-4">
        <div className="-mt-7 mb-2.5">
          {store.hasLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/${store.slug}/logo`}
              alt=""
              loading="lazy"
              className="h-14 w-14 rounded-full border-4 border-white bg-white object-cover shadow-sm"
            />
          ) : (
            <span
              className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white font-impact text-xl text-white shadow-sm"
              style={{ backgroundColor: store.themeColor }}
            >
              {store.name.trim().charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <p className="truncate text-base font-bold text-ink">{store.name.trim()}</p>
        {store.tagline && <p className="mt-0.5 line-clamp-2 text-sm text-ink/55">{store.tagline}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink/50">
          <span className="rounded-full bg-paper px-2 py-0.5 font-semibold text-ink/70">
            {categoryLabel(store.category)}
          </span>
          {store.city && (
            <span className="inline-flex items-center gap-1">
              <Icon name="pin" className="h-3 w-3" />
              {store.city}
            </span>
          )}
          <span>
            {store.productCount} producto{store.productCount === 1 ? "" : "s"}
          </span>
        </div>
        <span className="mt-auto flex items-center justify-between pt-4 font-impact text-xs uppercase tracking-wider text-ink">
          Ver tienda
          <span className="flex h-8 w-8 items-center justify-center bg-ink text-white transition duration-300 group-hover:translate-x-1 group-hover:bg-jade-500">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
