"use client";

interface Props {
  /** Si viene vacía/undefined no se renderiza nada (queda el texto secundario de la card). */
  plate: string | null | undefined;
  /** "lg" para cards de listados (patente protagonista), "sm" para filas compactas. */
  size?: "sm" | "lg";
  className?: string;
}

/**
 * Patente con estética de chapa Mercosur: franja azul arriba y tipografía
 * bold con tracking ancho (la sans del sistema en negro pesa mejor que la
 * mono por defecto). Es EL identificador visual del vehículo en los listados
 * de vehículos y de órdenes — usar siempre este componente para mantenerlos
 * idénticos.
 */
export function PlateBadge({ plate, size = "lg", className = "" }: Props) {
  if (!plate) return null;

  const strip = size === "lg" ? "h-1" : "h-0.5";
  const text  = size === "lg"
    ? "text-lg px-2.5 py-0.5"
    : "text-[11px] px-1.5 py-[1px]";

  return (
    <span
      className={`inline-flex flex-col overflow-hidden rounded-md border border-[#041627]/25 bg-gradient-to-b from-white to-[#f4f6f8] shadow-sm w-fit ${className}`}
    >
      <span className={`${strip} w-full bg-[#041627]`} />
      <span
        className={`${text} font-black tracking-[0.14em] leading-tight text-[#041627] uppercase tabular-nums whitespace-nowrap`}
      >
        {plate}
      </span>
    </span>
  );
}
