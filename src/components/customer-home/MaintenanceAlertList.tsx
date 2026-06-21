"use client";

import Link from "next/link";
import {
  Disc3, Droplet, BatteryWarning, ChevronRight, AlertTriangle, Clock,
  Cog, Settings2, Wrench, Zap, Droplets, Bell,
  type LucideIcon,
} from "lucide-react";

import { PlateBadge } from "@/components/shared/PlateBadge";
import {
  MaintenanceAlert,
  MaintenanceAlertSeverity,
  MaintenanceAlertType,
} from "@/types/api.types";

const TYPE_ICON: Record<MaintenanceAlertType, LucideIcon> = {
  [MaintenanceAlertType.Oil]:              Droplet,
  [MaintenanceAlertType.Tires]:            Disc3,
  [MaintenanceAlertType.Battery]:          BatteryWarning,
  [MaintenanceAlertType.TimingKit]:        Cog,
  [MaintenanceAlertType.Transmission]:     Settings2,
  [MaintenanceAlertType.Differential]:     Wrench,
  [MaintenanceAlertType.SparkPlugs]:       Zap,
  [MaintenanceAlertType.InjectorCleaning]: Droplets,
  [MaintenanceAlertType.Other]:            Bell,
};

interface VehicleGroup {
  vehicleId: string;
  licensePlate: string;
  brand: string;
  model: string;
  alerts: MaintenanceAlert[];
  /** El vehículo tiene al menos una alerta crítica → manda el rojo. */
  critical: boolean;
}

/**
 * Agrupa las alertas (que el backend devuelve por vehículo+sistema) en una por
 * vehículo. Dentro de cada grupo el orden se preserva tal cual viene del server
 * (críticas primero). Ordena los vehículos: los que tienen alguna crítica arriba.
 */
function groupByVehicle(alerts: MaintenanceAlert[]): VehicleGroup[] {
  const map = new Map<string, MaintenanceAlert[]>();
  for (const alert of alerts) {
    const existing = map.get(alert.vehicleId);
    if (existing) existing.push(alert);
    else map.set(alert.vehicleId, [alert]);
  }

  return Array.from(map.values())
    .map((list): VehicleGroup => ({
      vehicleId:    list[0].vehicleId,
      licensePlate: list[0].licensePlate,
      brand:        list[0].brand,
      model:        list[0].model,
      alerts:       list,
      critical:     list.some((a) => a.severity === MaintenanceAlertSeverity.Critical),
    }))
    .sort((a, b) => {
      if (a.critical !== b.critical) return a.critical ? -1 : 1;
      return a.licensePlate.localeCompare(b.licensePlate);
    });
}

/**
 * Alertas de mantenimiento del Inicio: una card por vehículo afectado, con sus
 * alertas (cubiertas / aceite / batería) adentro. La card entera linkea al
 * detalle del vehículo, donde está cada sistema completo. El color marca la
 * urgencia: rojo si hay alguna crítica, ámbar si solo hay advertencias.
 */
export function MaintenanceAlertList({ alerts }: { alerts: MaintenanceAlert[] }) {
  if (alerts.length === 0) return null;

  return (
    <>
      {groupByVehicle(alerts).map((group) => (
        <VehicleAlertCard key={group.vehicleId} group={group} />
      ))}
    </>
  );
}

function VehicleAlertCard({ group }: { group: VehicleGroup }) {
  const { vehicleId, licensePlate, brand, model, alerts, critical } = group;

  return (
    <Link
      href={`/my-vehicles/${vehicleId}`}
      className={`block bg-white rounded-2xl border shadow-sm overflow-hidden active:scale-[0.99] hover:shadow-md transition-all ${
        critical ? "border-red-200" : "border-[#fea520]/40"
      }`}
    >
      {/* Header: vehículo + peor severidad */}
      <div className="flex items-center justify-between gap-2.5 p-4">
        <div className="min-w-0">
          <PlateBadge plate={licensePlate} size="lg" />
          <p className="text-[11px] font-semibold text-[#44474c]/70 mt-1 truncate">
            {brand} {model}
          </p>
        </div>
        {critical ? (
          <span className="inline-flex items-center gap-1 text-[12px] font-black uppercase tracking-wider px-4 py-1 rounded bg-red-50 text-red-600 border border-red-200 shrink-0">
            <AlertTriangle className="w-3 h-3" />
            Urgente
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[12px] font-black uppercase tracking-wider px-4 py-1 rounded bg-[#fea520]/15 text-[#865300] border border-[#fea520]/40 shrink-0">
            <Clock className="w-3 h-3" />
            Atención
          </span>
        )}
      </div>

      {/* Una fila por sistema (cada una con su propio color) */}
      <div className="border-t border-[#041627]/5">
        {alerts.map((alert, i) => {
          const Icon = TYPE_ICON[alert.type] ?? Disc3;
          const sub  = alert.severity === MaintenanceAlertSeverity.Critical;
          return (
            <div
              key={alert.id}
              className={`flex items-center gap-3 px-4 py-2.5 ${i > 0 ? "border-t border-[#041627]/5" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  sub ? "bg-red-50" : "bg-[#fea520]/15"
                }`}
              >
                <Icon className={`w-4 h-4 ${sub ? "text-red-500" : "text-[#e8951d]"}`} strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#041627]">{alert.title}</p>
                <p className="text-[11px] font-semibold text-[#44474c]/80 leading-snug">{alert.detail}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer / CTA */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#041627]/5 bg-[#f4f6f8]">
        <span className="text-[11px] font-bold text-[#44474c]/70">Ver detalle del vehículo</span>
        <ChevronRight className={`w-4 h-4 ${critical ? "text-red-300" : "text-[#fea520]"}`} />
      </div>
    </Link>
  );
}
