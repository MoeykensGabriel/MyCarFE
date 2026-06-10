"use client";

import { ClipboardCheck } from "lucide-react";

/** Placeholder de carga del listado de inspecciones pendientes. */
export function InspectionSkeletons() {
  return (
    <div className="space-y-4.5 animate-pulse">
      {[...Array(2)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-[#041627]/5 p-5 space-y-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#c4c6cd]/30" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-36 bg-[#c4c6cd]/30 rounded" />
              <div className="h-3 w-28 bg-[#c4c6cd]/20 rounded" />
            </div>
          </div>
          <div className="h-14 w-full bg-[#c4c6cd]/15 rounded-xl" />
          <div className="space-y-2">
            <div className="h-3 w-40 bg-[#c4c6cd]/25 rounded" />
            <div className="flex gap-2">
              <div className="h-9 w-24 bg-[#c4c6cd]/30 rounded-xl" />
              <div className="h-9 w-24 bg-[#c4c6cd]/30 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Estado vacío: el mecánico no tiene órdenes esperando su reporte. */
export function InspectionsEmptyState() {
  return (
    <div className="flex flex-col items-center gap-3.5 py-16 px-4 text-center bg-white border border-[#041627]/10 rounded-2xl shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-[#eefcfd] flex items-center justify-center">
        <ClipboardCheck className="w-6 h-6 text-[#041627]" />
      </div>
      <p className="text-sm font-extrabold text-[#041627]">Nada pendiente</p>
      <p className="text-xs text-[#44474c]/85 max-w-xs leading-relaxed font-medium">
        No hay órdenes esperando tu reporte. Si necesitás reportar y no ves nada acá,
        avisá al administrador para que te asigne áreas o revisá tu listado de trabajos activos.
      </p>
    </div>
  );
}
