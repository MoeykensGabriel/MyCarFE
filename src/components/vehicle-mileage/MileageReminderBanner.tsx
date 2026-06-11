"use client";

import { Gauge } from "lucide-react";

interface Props {
  /** Cantidad de vehículos (de los cargados) con kilometraje vencido. */
  dueCount: number;
}

/**
 * Aviso in-app en Mis Vehículos: hay vehículos cuyo kilometraje no se actualiza
 * hace más días que el umbral del taller. La acción concreta vive en cada card
 * ("Actualizar km") — este banner solo llama la atención sobre el conjunto.
 */
export function MileageReminderBanner({ dueCount }: Props) {
  if (dueCount === 0) return null;

  return (
    <div className="flex items-center gap-3 bg-gradient-to-r from-[#fea520]/15 to-[#fec15d]/10 border border-[#fea520]/40 rounded-2xl p-4 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-[#fea520]/20">
        <Gauge className="w-5 h-5 text-[#fea520] animate-pulse" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-extrabold text-[#041627]">
          {dueCount === 1
            ? "1 vehículo necesita que actualices su kilometraje"
            : `${dueCount} vehículos necesitan que actualices su kilometraje`}
        </p>
        <p className="text-[11px] font-semibold text-[#44474c]/80 mt-0.5 leading-snug">
          Tocá <span className="font-extrabold">Actualizar km</span> en cada vehículo — mantiene
          al día el aviso de service y el control de desgaste.
        </p>
      </div>
    </div>
  );
}
