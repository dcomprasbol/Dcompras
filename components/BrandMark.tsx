// La "D" de Dcompras (mismo dibujo que app/icon.png) en SVG, para poder
// usarla a cualquier tamaño y animar sus piezas por separado. `bg` es el
// color de fondo sobre el que va: se usa para el corte diagonal del trazo.
export const MARK_VIEWBOX = "-2 -2 59 114";
export const MARK_D_PATH =
  "M0 0H40Q55 0 55 15V95Q55 110 40 110H0ZM21 18V92H31Q35 92 35 88V22Q35 18 31 18Z";
export const MARK_CUT_PATH = "M-2 57L21 75V112H-2Z";
export const MARK_NOTCH_PATH = "M0 66L21 82V110H0Z";

export default function BrandMark({
  className = "h-6 w-auto",
  color = "#14102A",
  bg = "#FAFAF8",
}: {
  className?: string;
  color?: string;
  bg?: string;
}) {
  return (
    <svg viewBox={MARK_VIEWBOX} className={`overflow-visible ${className}`} aria-hidden="true">
      <path d={MARK_D_PATH} fill={color} fillRule="evenodd" />
      <path d={MARK_CUT_PATH} fill={bg} />
      <path d={MARK_NOTCH_PATH} className="fill-jade-400" />
    </svg>
  );
}
