"use client";

import { useState } from "react";
import { CircleGauge, Plus, Ruler, RefreshCw, AlertTriangle } from "lucide-react";

import { useVehicleTires } from "@/hooks/useVehicleTires";
import {
  TirePosition,
  TirePositionLabel,
  TirePositionShort,
  TireStatus,
  TireStatusLabel,
} from "@/lib/enums";
import type { VehicleTire } from "@/types/api.types";
import { TireFormModal } from "./TireFormModal";

interface Props {
  vehicleId: string;
  defaultMileage: number;
}

// Orden visual: vista del auto desde arriba (delanteras arriba, traseras abajo).
const SLOTS: TirePosition[] = [
  TirePosition.FrontLeft,
  TirePosition.FrontRight,
  TirePosition.RearLeft,
  TirePosition.RearRight,
];

type ModalState =
  | { mode: "create"; position: TirePosition }
  | { mode: "measure"; tire: VehicleTire }
  | { mode: "replace"; tire: VehicleTire }
  | null;

/**
 * Panel de cubiertas en el detalle del vehículo (admin/taller).
 * 4 slots posicionales (vista del auto desde arriba). Cada slot muestra estado,
 * última medición y km estimados, con acciones Medir / Reemplazar. Slots vacíos
 * ofrecen "Agregar".
 */
export function VehicleTiresCard({ vehicleId, defaultMileage }: Props) {
  const { data: tires, isLoading } = useVehicleTires(vehicleId);
  const [modal, setModal] = useState<ModalState>(null);

  const byPosition = (pos: TirePosition) =>
    tires?.find((t) => t.position === pos && t.isActive);

  return (
    <section className="bg-white rounded-2xl border border-[#041627]/10 shadow-md overflow-hidden">
      <div className="px-5 py-4 border-b border-[#041627]/5 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#fea520]/10 flex items-center justify-center">
          <CircleGauge className="w-4 h-4 text-[#fea520]" />
        </div>
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#fea520] leading-none">
            Neumáticos
          </p>
          <h3 className="text-sm font-black text-[#041627] mt-0.5">Estado de cubiertas</h3>
        </div>
      </div>

      <div className="px-5 py-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-[#c4c6cd]/20 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {SLOTS.map((pos) => {
              const tire = byPosition(pos);
              return tire ? (
                <TireSlot
                  key={pos}
                  tire={tire}
                  onMeasure={() => setModal({ mode: "measure", tire })}
                  onReplace={() => setModal({ mode: "replace", tire })}
                />
              ) : (
                <EmptySlot
                  key={pos}
                  position={pos}
                  onAdd={() => setModal({ mode: "create", position: pos })}
                />
              );
            })}
          </div>
        )}
      </div>

      {modal?.mode === "create" && (
        <TireFormModal vehicleId={vehicleId} defaultMileage={defaultMileage}
          mode="create" position={modal.position} onClose={() => setModal(null)} />
      )}
      {modal?.mode === "measure" && (
        <TireFormModal vehicleId={vehicleId} defaultMileage={defaultMileage}
          mode="measure" tire={modal.tire} onClose={() => setModal(null)} />
      )}
      {modal?.mode === "replace" && (
        <TireFormModal vehicleId={vehicleId} defaultMileage={defaultMileage}
          mode="replace" tire={modal.tire} onClose={() => setModal(null)} />
      )}
    </section>
  );
}

// ─── Slot con cubierta ────────────────────────────────────────────────────────

function TireSlot({
  tire,
  onMeasure,
  onReplace,
}: {
  tire: VehicleTire;
  onMeasure: () => void;
  onReplace: () => void;
}) {
  const est = tire.estimation;
  const s = statusStyle(est.status);

  return (
    <div className={`rounded-xl border p-3 flex flex-col gap-2 ${s.border} ${s.bg}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-wider text-[#041627]/60">
          {TirePositionShort[tire.position]}
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

      <p className="text-[10px] text-[#44474c]/70 leading-tight">
        {est.kmRemainingToUrgent != null
          ? <>~{est.kmRemainingToUrgent.toLocaleString("es-AR")} km hasta cambio urgente</>
          : <span className="italic">Sin estimación (faltan mediciones)</span>}
      </p>

      <div className="flex gap-1.5 mt-auto pt-1">
        <button onClick={onMeasure}
          className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-[#041627] text-[#fea520] hover:bg-[#0a2540]">
          <Ruler className="w-3 h-3" /> Medir
        </button>
        <button onClick={onReplace}
          className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-[#041627]/15 text-[#041627] hover:bg-white">
          <RefreshCw className="w-3 h-3" /> Cambiar
        </button>
      </div>
    </div>
  );
}

// ─── Slot vacío ───────────────────────────────────────────────────────────────

function EmptySlot({ position, onAdd }: { position: TirePosition; onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      className="rounded-xl border border-dashed border-[#041627]/20 p-3 flex flex-col items-center justify-center gap-1.5 text-[#44474c]/60 hover:border-[#fea520] hover:text-[#fea520] transition-colors min-h-28"
    >
      <Plus className="w-5 h-5" />
      <span className="text-[10px] font-bold text-center leading-tight">
        {TirePositionLabel[position]}
      </span>
      <span className="text-[9px] uppercase tracking-wider font-black">Agregar</span>
    </button>
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
