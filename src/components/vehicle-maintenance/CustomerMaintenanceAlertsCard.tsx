"use client";

import { Wrench } from "lucide-react";

import { useVehicleMaintenanceAlerts } from "@/hooks/useVehicleMaintenanceAlerts";
import {
  MaintenanceAlertConfig,
  MaintenanceAlertSeverity,
} from "@/types/api.types";
import { MAINTENANCE_TYPE_ICON } from "./alert-icons";

interface Props {
  vehicleId: string;
}

function severityRank(s?: MaintenanceAlertSeverity | null): number {
  if (s === MaintenanceAlertSeverity.Critical) return 0;
  if (s === MaintenanceAlertSeverity.Warning) return 1;
  return 2;
}

function intervalText(c: MaintenanceAlertConfig): string {
  const parts: string[] = [];
  if (c.intervalKm != null) parts.push(`${c.intervalKm.toLocaleString("es-AR")} km`);
  if (c.intervalMonths != null) parts.push(`${c.intervalMonths} ${c.intervalMonths === 1 ? "mes" : "meses"}`);
  return parts.length ? `Cada ${parts.join(" · ")}` : "";
}

function statusInfo(c: MaintenanceAlertConfig) {
  if (c.severity === MaintenanceAlertSeverity.Critical) {
    return {
      pill: "bg-red-50 text-red-700 border-red-200",
      iconBox: "bg-red-50 text-red-500",
      label: "Vencido",
      detail: "Coordiná el service",
    };
  }
  if (c.severity === MaintenanceAlertSeverity.Warning) {
    const detail =
      c.kmRemaining != null && c.kmRemaining <= 1000
        ? `Faltan ${Math.max(0, c.kmRemaining).toLocaleString("es-AR")} km`
        : c.daysRemaining != null
          ? `Faltan ${Math.max(0, c.daysRemaining)} días`
          : "Próximo";
    return {
      pill: "bg-[#fea520]/15 text-[#865300] border-[#fea520]/40",
      iconBox: "bg-[#fea520]/15 text-[#e8951d]",
      label: "Próximo",
      detail,
    };
  }
  const parts: string[] = [];
  if (c.kmRemaining != null && c.kmRemaining > 0) parts.push(`${c.kmRemaining.toLocaleString("es-AR")} km`);
  if (c.daysRemaining != null && c.daysRemaining > 0) parts.push(`${c.daysRemaining} días`);
  return {
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
    iconBox: "bg-[#eefcfd] text-[#44474c]/70",
    label: "Al día",
    detail: parts.length ? `Faltan ${parts.join(" · ")}` : "",
  };
}

/**
 * Vista de solo lectura para el cliente: los avisos de mantenimiento que el taller
 * configuró para este vehículo (por km y/o tiempo), con su estado. Si el vehículo no
 * tiene alertas configuradas, no renderiza nada. Ancla #mantenimiento para el deep-link
 * desde el Inicio.
 */
export function CustomerMaintenanceAlertsCard({ vehicleId }: Props) {
  const { data, isLoading } = useVehicleMaintenanceAlerts(vehicleId);

  if (isLoading) {
    return (
      <section className="bg-white rounded-2xl border border-[#041627]/10 shadow-sm overflow-hidden">
        <div className="px-4 py-4">
          <div className="h-20 bg-[#c4c6cd]/20 rounded-xl animate-pulse" />
        </div>
      </section>
    );
  }

  if (!data || data.length === 0) return null;

  const sorted = [...data].sort((a, b) => severityRank(a.severity) - severityRank(b.severity));

  return (
    <section id="mantenimiento" className="scroll-mt-20 bg-white rounded-2xl border border-[#041627]/10 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-[#041627]/5 bg-gradient-to-r from-[#eefcfd] to-white">
        <Wrench className="w-4 h-4 text-[#041627]" strokeWidth={2} />
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627]/80">
          Mantenimiento
        </p>
      </div>

      <div className="divide-y divide-[#041627]/5">
        {sorted.map((c) => {
          const Icon = MAINTENANCE_TYPE_ICON[c.itemType];
          const s = statusInfo(c);
          const interval = intervalText(c);
          const sub = [interval, s.detail].filter(Boolean).join(" · ");
          return (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.iconBox}`}>
                <Icon className="w-4.5 h-4.5" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#041627] truncate">{c.title}</p>
                {sub && <p className="text-[11px] font-semibold text-[#44474c]/75 leading-snug">{sub}</p>}
              </div>
              <span className={`inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded border shrink-0 ${s.pill}`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed px-4 py-3 border-t border-[#041627]/5">
        Avisos configurados por el taller según el uso de tu vehículo. Se actualizan con tu kilometraje.
      </p>
    </section>
  );
}
