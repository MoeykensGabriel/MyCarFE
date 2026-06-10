"use client";

import { useState } from "react";
import { ClipboardCheck } from "lucide-react";

import { useMyPendingInspections } from "@/hooks/useInspections";
import { PendingInspection, PendingInspectionArea } from "@/types/api.types";
import { ReportFormModal } from "@/components/inspections/ReportFormModal";
import { InspectionCard } from "@/components/inspections/InspectionCard";
import {
  InspectionSkeletons,
  InspectionsEmptyState,
} from "@/components/inspections/InspectionListStates";

/**
 * Inspecciones pendientes del mecánico: órdenes en revisión donde le toca
 * reportar sobre sus áreas. Al elegir un área se abre el modal de reporte
 * (ver components/inspections/).
 */
export default function MechanicInspectionsPage() {
  const { data, isLoading, isError } = useMyPendingInspections();
  const [picked, setPicked] = useState<
    { inspection: PendingInspection; area: PendingInspectionArea } | null
  >(null);

  const items = data ?? [];

  return (
    <div className="space-y-5 pb-12">
      {/* ── Título y Header Premium ─────────────────────────────────────────── */}
      <div className="bg-[#041627] text-white rounded-2xl p-5 shadow-md shadow-[#041627]/10 relative overflow-hidden">
        {/* Decoración circular de fondo */}
        <div className="absolute -right-10 -bottom-10 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-[#fea520]" />
            <h1 className="text-lg font-extrabold tracking-wide">
              Inspecciones pendientes
            </h1>
          </div>
          <p className="text-xs text-white/60 mt-1 leading-snug max-w-[280px]">
            Órdenes en revisión donde te toca opinar y reportar sobre tus áreas.
          </p>
        </div>
      </div>

      {/* ── Estados ────────────────────────────────────────────────────────── */}
      {isLoading && <InspectionSkeletons />}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center shadow-sm">
          <p className="text-sm text-red-600 font-bold">No pudimos cargar tus inspecciones.</p>
          <p className="text-xs text-red-400 mt-1">Por favor, intentá de nuevo recargando la página.</p>
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && <InspectionsEmptyState />}

      {/* ── Lista de inspecciones ──────────────────────────────────────────── */}
      {!isLoading && !isError && items.length > 0 && (
        <div className="space-y-4.5 animate-[fadeIn_0.2s_ease-out]">
          {items.map((inspection) => (
            <InspectionCard
              key={inspection.workOrderId}
              inspection={inspection}
              onPickArea={(area) => setPicked({ inspection, area })}
            />
          ))}
        </div>
      )}

      {/* ── Modal de reporte ────────────────────────────────────────────────── */}
      {picked && (
        <ReportFormModal
          inspection={picked.inspection}
          area={picked.area}
          onClose={() => setPicked(null)}
        />
      )}
    </div>
  );
}
