"use client";

import { CircleGauge, AlertTriangle } from "lucide-react";

import { useVehicleTires } from "@/hooks/useVehicleTires";
import {
  TirePosition,
  TirePositionNotation,
  TireStatus,
  TireStatusLabel,
} from "@/lib/enums";
import type { VehicleTire } from "@/types/api.types";

interface Props {
  vehicleId: string;
}

// Orden visual: vista del auto desde arriba (delanteras arriba, traseras abajo).
const SLOTS: TirePosition[] = [
  TirePosition.FrontLeft,
  TirePosition.FrontRight,
  TirePosition.RearLeft,
  TirePosition.RearRight,
];

/**
 * Vista de solo lectura del estado de cubiertas para el cliente.
 * Muestra lo que el taller registró durante la inspección, sin acciones de edición.
 * Si el vehículo no tiene cubiertas cargadas, no renderiza nada.
 */
export function CustomerTiresCard({ vehicleId }: Props) {
  const { data: tires, isLoading } = useVehicleTires(vehicleId);

  const activeTires = (tires ?? []).filter((t) => t.isActive);

  // Sin datos cargados → no mostramos la sección (evita una card vacía sin sentido).
  if (!isLoading && activeTires.length === 0) return null;

  const byPosition = (pos: TirePosition) =>
    activeTires.find((t) => t.position === pos);

  return (
    <section className="bg-white rounded-2xl border border-[#041627]/10 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-[#041627]/5 bg-gradient-to-r from-[#eefcfd] to-white">
        <CircleGauge className="w-4 h-4 text-[#041627]" strokeWidth={2} />
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627]/80">
          Estado de Cubiertas
        </p>
      </div>

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-[#c4c6cd]/20 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {/* Esquema del auto desde arriba con las 4 ruedas coloreadas por estado */}
            <TireDiagram byPosition={byPosition} />
            <TireLegend />

            <div className="grid grid-cols-2 gap-3 mt-4">
              {SLOTS.map((pos) => {
                const tire = byPosition(pos);
                return tire ? (
                  <TireSlot key={pos} tire={tire} />
                ) : (
                  <EmptySlot key={pos} position={pos} />
                );
              })}
            </div>
          </>
        )}
        <p className="text-[10px] text-[#44474c]/60 mt-3 leading-relaxed">
          Mediciones registradas por el taller en las inspecciones de tu vehículo.
        </p>
      </div>
    </section>
  );
}

// ─── Esquema visual del auto (vista desde arriba) ─────────────────────────────

function statusColor(status: TireStatus): string {
  switch (status) {
    case TireStatus.Healthy:     return "#16a34a"; // verde
    case TireStatus.Attention:   return "#eab308"; // amarillo
    case TireStatus.ReplaceSoon: return "#f97316"; // naranja
    case TireStatus.Urgent:      return "#dc2626"; // rojo
  }
}

function TireDiagram({
  byPosition,
}: {
  byPosition: (pos: TirePosition) => VehicleTire | undefined;
}) {
  // Una rueda del esquema: rect redondeado coloreado por estado + los mm adentro.
  const Wheel = ({ pos, x, y }: { pos: TirePosition; x: number; y: number }) => {
    const tire = byPosition(pos);
    const color = tire ? statusColor(tire.estimation.status) : "#c4c6cd";
    const mm = tire ? tire.estimation.currentAverageDepthMm.toFixed(1) : "—";
    return (
      <g>
        <rect x={x} y={y} width={26} height={48} rx={10} fill={color}>
          <title>
            {TirePositionNotation[pos]} — {tire ? `${mm} mm` : "Sin datos"}
          </title>
        </rect>
        <text x={x + 13} y={y + 28} textAnchor="middle" fontSize="11" fontWeight="800" fill="#ffffff">
          {mm}
        </text>
      </g>
    );
  };

  return (
    <svg viewBox="0 0 172 252" className="w-40 mx-auto block" role="img" aria-label="Estado de las cubiertas">
      {/* Carrocería (vista superior) */}
      <rect x={44} y={14} width={84} height={224} rx={32} fill="#eef2f6" stroke="#041627" strokeOpacity={0.12} />
      {/* Parabrisas y luneta */}
      <rect x={56} y={56} width={60} height={56} rx={16} fill="#dbe3ea" />
      <rect x={56} y={138} width={60} height={46} rx={14} fill="#dbe3ea" />
      {/* Ruedas (frente arriba) */}
      <Wheel pos={TirePosition.FrontLeft}  x={16}  y={34} />
      <Wheel pos={TirePosition.FrontRight} x={130} y={34} />
      <Wheel pos={TirePosition.RearLeft}   x={16}  y={170} />
      <Wheel pos={TirePosition.RearRight}  x={130} y={170} />
    </svg>
  );
}

function TireLegend() {
  const items: { status: TireStatus; label: string }[] = [
    { status: TireStatus.Healthy,     label: TireStatusLabel[TireStatus.Healthy] },
    { status: TireStatus.Attention,   label: TireStatusLabel[TireStatus.Attention] },
    { status: TireStatus.ReplaceSoon, label: TireStatusLabel[TireStatus.ReplaceSoon] },
    { status: TireStatus.Urgent,      label: TireStatusLabel[TireStatus.Urgent] },
  ];
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-2">
      {items.map((i) => (
        <span key={i.status} className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#44474c]/80">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColor(i.status) }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

// ─── Slot con cubierta ────────────────────────────────────────────────────────

function TireSlot({ tire }: { tire: VehicleTire }) {
  const est = tire.estimation;
  const s = statusStyle(est.status);

  return (
    <div className={`rounded-xl border p-3 flex flex-col gap-2 ${s.border} ${s.bg}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-wider text-[#041627]/60">
          {TirePositionNotation[tire.position]}
        </span>
        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${s.pill}`}>
          {TireStatusLabel[est.status]}
        </span>
      </div>

      <div>
        <p className="text-lg font-black leading-none text-[#041627]">
          {est.currentAverageDepthMm.toFixed(1)}
          <span className="text-xs font-bold text-[#44474c]/60"> mm</span>
        </p>
        <p className="text-[10px] text-[#44474c]/70 truncate mt-0.5">
          {tire.brand} {tire.model}
        </p>
      </div>

      {est.hasIrregularWear && (
        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-700">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          Desgaste irregular
        </div>
      )}

      <p className="text-[10px] text-[#44474c]/70 leading-tight mt-auto">
        {est.kmRemainingToUrgent != null
          ? <>~{est.kmRemainingToUrgent.toLocaleString("es-AR")} km hasta cambio urgente</>
          : <span className="italic">Sin estimación (faltan mediciones)</span>}
      </p>
    </div>
  );
}

// ─── Slot vacío (posición sin cubierta registrada) ────────────────────────────

function EmptySlot({ position }: { position: TirePosition }) {
  return (
    <div className="rounded-xl border border-dashed border-[#041627]/15 p-3 flex flex-col items-center justify-center gap-1 text-[#44474c]/45 min-h-24">
      <span className="text-[10px] font-black uppercase tracking-wider">
        {TirePositionNotation[position]}
      </span>
      <span className="text-[9px] uppercase tracking-wider font-bold">Sin datos</span>
    </div>
  );
}

// ─── Estilos por estado ───────────────────────────────────────────────────────

function statusStyle(status: TireStatus) {
  switch (status) {
    case TireStatus.Healthy:
      return { bg: "bg-emerald-50", border: "border-emerald-200", pill: "bg-emerald-100 text-emerald-800" };
    case TireStatus.Attention:
      return { bg: "bg-yellow-50", border: "border-yellow-200", pill: "bg-yellow-100 text-yellow-800" };
    case TireStatus.ReplaceSoon:
      return { bg: "bg-orange-50", border: "border-orange-200", pill: "bg-orange-100 text-orange-800" };
    case TireStatus.Urgent:
      return { bg: "bg-red-50", border: "border-red-200", pill: "bg-red-100 text-red-800" };
  }
}
