"use client";

import { AlertTriangle } from "lucide-react";
import { useVehicleSkippedInspections } from "@/hooks/useInspections";
import { formatDate } from "@/lib/format";

/**
 * Aviso "quedó sin inspeccionar": áreas cuya inspección se omitió en la última
 * visita del vehículo. No renderiza nada si la última visita cubrió todo.
 *
 * Se muestra en la ficha del vehículo y al abrir una nueva orden, para que la
 * omisión no se pierda: la próxima visita arranca sabiendo qué quedó pendiente.
 */
export function SkippedInspectionsAlert({ vehicleId }: { vehicleId: string | undefined }) {
  const { data: skipped } = useVehicleSkippedInspections(vehicleId);

  if (!skipped || skipped.length === 0) return null;

  return (
    <div className="rounded-xl bg-amber-50 border border-amber-300 px-4 py-3 space-y-2">
      <p className="flex items-center gap-2 text-sm font-bold text-amber-900">
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
        Quedaron áreas sin inspeccionar en la última visita
      </p>
      <ul className="space-y-1 pl-6">
        {skipped.map((s) => (
          <li key={s.areaId} className="text-sm text-amber-900">
            <span className="font-semibold">{s.areaName}</span>
            <span className="text-amber-800/80"> — {s.skipReason}</span>
            <span className="block text-xs text-amber-700/70">
              Omitida el {formatDate(s.skippedAt)}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-amber-800/80 pl-6">
        Priorizá estas áreas en la inspección de esta visita.
      </p>
    </div>
  );
}
