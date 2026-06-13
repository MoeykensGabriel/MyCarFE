"use client";

import Link from "next/link";
import { Disc3, Droplet, BatteryWarning, ChevronRight, type LucideIcon } from "lucide-react";

import {
  MaintenanceAlert,
  MaintenanceAlertSeverity,
  MaintenanceAlertType,
} from "@/types/api.types";

const TYPE_ICON: Record<MaintenanceAlertType, LucideIcon> = {
  [MaintenanceAlertType.Tire]:    Disc3,
  [MaintenanceAlertType.Oil]:     Droplet,
  [MaintenanceAlertType.Battery]: BatteryWarning,
};

/**
 * Alertas de mantenimiento en el Inicio, una card por vehículo afectado. Cada
 * una linkea al detalle del vehículo (donde está la card completa del sistema).
 * El color marca la urgencia: rojo crítico, ámbar advertencia.
 */
export function MaintenanceAlertList({ alerts }: { alerts: MaintenanceAlert[] }) {
  if (alerts.length === 0) return null;

  return (
    <>
      {alerts.map((alert) => {
        const Icon = TYPE_ICON[alert.type] ?? Disc3;
        const critical = alert.severity === MaintenanceAlertSeverity.Critical;

        return (
          <Link
            key={`${alert.vehicleId}-${alert.type}`}
            href={`/my-vehicles/${alert.vehicleId}`}
            className={`flex items-center gap-3 bg-white rounded-2xl border shadow-sm p-4 active:scale-[0.98] hover:shadow-md transition-all ${
              critical ? "border-red-200" : "border-[#fea520]/40"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                critical ? "bg-red-50" : "bg-[#fea520]/15"
              }`}
            >
              <Icon className={`w-5 h-5 ${critical ? "text-red-500" : "text-[#e8951d]"}`} strokeWidth={2} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-xs font-extrabold text-[#041627]">
                  {alert.title} · {alert.licensePlate}
                </p>
                <span
                  className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    critical
                      ? "bg-red-50 text-red-600 border border-red-200"
                      : "bg-[#fea520]/15 text-[#865300] border border-[#fea520]/40"
                  }`}
                >
                  {critical ? "Urgente" : "Atención"}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-[#44474c]/80 mt-0.5 leading-snug">
                {alert.detail}
              </p>
              <p className="text-[10px] font-semibold text-[#44474c]/55 mt-0.5">
                {alert.brand} {alert.model}
              </p>
            </div>

            <ChevronRight className={`w-4 h-4 shrink-0 ${critical ? "text-red-300" : "text-[#fea520]"}`} />
          </Link>
        );
      })}
    </>
  );
}
