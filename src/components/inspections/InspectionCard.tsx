"use client";

import { ClipboardCheck, Calendar } from "lucide-react";

import { formatDateTime } from "@/lib/format";
import { PendingInspection, PendingInspectionArea } from "@/types/api.types";

interface Props {
  inspection: PendingInspection;
  onPickArea: (area: PendingInspectionArea) => void;
}

/** Tarjeta de una orden en inspección: datos del vehículo + áreas pendientes de reporte. */
export function InspectionCard({ inspection, onPickArea }: Props) {
  const initials = `${inspection.vehicleBrand?.charAt(0) || ""}${inspection.vehicleModel?.charAt(0) || ""}`.toUpperCase();

  return (
    <article className="bg-white rounded-2xl border border-[#041627]/10 p-5 shadow-sm hover:border-[#fea520]/30 hover:shadow-md transition-all duration-300 relative overflow-hidden">
      {/* Vehículo Info */}
      <div className="flex items-center gap-3.5 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#041627] to-[#0a2540] border border-[#fea520]/20 flex items-center justify-center shrink-0 shadow-sm">
          <span className="text-xs font-black tracking-wider text-[#fea520]">
            {initials}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-extrabold text-[#041627] truncate leading-tight">
              {inspection.vehicleBrand} {inspection.vehicleModel}
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold font-mono text-[#041627] bg-[#fea520]/10 px-2 py-0.5 rounded border border-[#fea520]/30 shrink-0">
              {inspection.vehicleLicensePlate}
            </span>
          </div>
          {/* Sin propietario/cliente/flota: el mecánico no ve para quién es el trabajo. */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
            <p className="flex items-center gap-1 text-[10px] text-[#44474c]/65 font-semibold">
              <Calendar className="w-3 h-3 text-[#44474c]/40 shrink-0" />
              Ingreso {formatDateTime(inspection.workOrderCreatedAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Motivo de visita */}
      {inspection.serviceReason && (
        <div className="bg-[#eefcfd]/60 border border-[#041627]/5 rounded-xl p-3.5 mb-4 shadow-inner">
          <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#041627]/60 mb-1">
            Motivo de visita / Síntomas
          </p>
          <p className="text-xs font-semibold text-[#041627] whitespace-pre-wrap leading-relaxed">
            {inspection.serviceReason}
          </p>
        </div>
      )}

      {/* Áreas pendientes */}
      <div className="space-y-2.5 pt-1.5 border-t border-[#041627]/5">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#44474c]/75">
          Áreas pendientes de tu reporte
        </p>
        <div className="flex flex-wrap gap-2">
          {inspection.pendingAreas.map((area) => (
            <button
              key={area.areaId}
              onClick={() => onPickArea(area)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-gradient-to-r from-[#fea520] to-[#fec15d] text-[#041627] hover:shadow-md hover:shadow-[#fea520]/10 active:scale-[0.97] transition-all border border-[#fea520]/20 shadow shadow-[#fea520]/5"
            >
              <ClipboardCheck className="w-4 h-4 text-[#041627]/70 shrink-0" />
              {area.areaName}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}
