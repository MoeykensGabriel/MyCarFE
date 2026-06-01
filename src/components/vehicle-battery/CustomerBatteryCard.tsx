"use client";

import { BatteryCharging } from "lucide-react";

import { useVehicleBattery } from "@/hooks/useVehicleBattery";
import { BatteryStatus, BatteryStatusLabel } from "@/lib/enums";

interface Props {
  vehicleId: string;
}

/**
 * Vista de solo lectura del estado de la batería para el cliente.
 * Muestra lo que el taller registró en la inspección (estado del último chequeo).
 * Si el vehículo no tiene batería registrada o chequeos, no renderiza nada.
 */
export function CustomerBatteryCard({ vehicleId }: Props) {
  const { data: battery, isLoading } = useVehicleBattery(vehicleId);

  if (isLoading) {
    return (
      <section className="bg-white rounded-2xl border border-[#041627]/10 shadow-sm overflow-hidden">
        <div className="px-4 py-4">
          <div className="h-20 bg-[#c4c6cd]/20 rounded-xl animate-pulse" />
        </div>
      </section>
    );
  }

  // Sin batería o sin chequeos → no mostramos la sección.
  if (!battery || battery.currentStatus == null) return null;

  const s = statusStyle(battery.currentStatus);
  const lastCheck = battery.checks[battery.checks.length - 1];
  const ageYears = battery.manufacturedOn
    ? Math.max(0, new Date().getFullYear() - new Date(battery.manufacturedOn).getFullYear())
    : null;

  return (
    <section className="bg-white rounded-2xl border border-[#041627]/10 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-[#041627]/5 bg-gradient-to-r from-[#eefcfd] to-white">
        <BatteryCharging className="w-4 h-4 text-[#041627]" strokeWidth={2} />
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627]/80">
          Estado de la Batería
        </p>
      </div>

      <div className="px-4 py-4">
        <div className={`rounded-xl border p-4 flex flex-col gap-2 ${s.border} ${s.bg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#041627]/60">
              {battery.brand ? battery.brand : "Batería"}
            </span>
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${s.pill}`}>
              {BatteryStatusLabel[battery.currentStatus]}
            </span>
          </div>

          <div className="flex items-end gap-3">
            {lastCheck?.voltage != null && (
              <p className="text-2xl font-black leading-none text-[#041627]">
                {lastCheck.voltage.toFixed(1)}
                <span className="text-xs font-bold text-[#44474c]/60"> V</span>
              </p>
            )}
            <div className="text-[10px] text-[#44474c]/70 leading-tight">
              {ageYears != null && <p>Antigüedad: ~{ageYears} año{ageYears !== 1 ? "s" : ""}</p>}
              {lastCheck && (
                <p>
                  Revisada el{" "}
                  {new Date(lastCheck.checkedOn).toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>

          {lastCheck?.notes && (
            <p className="text-[10px] text-[#44474c]/70 leading-relaxed">{lastCheck.notes}</p>
          )}
        </div>

        <p className="text-[10px] text-[#44474c]/60 mt-3 leading-relaxed">
          Estado registrado por el taller en la inspección de tu vehículo.
        </p>
      </div>
    </section>
  );
}

// ─── Estilos por estado ───────────────────────────────────────────────────────

function statusStyle(status: BatteryStatus) {
  switch (status) {
    case BatteryStatus.Good:
      return { bg: "bg-emerald-50", border: "border-emerald-200", pill: "bg-emerald-100 text-emerald-800" };
    case BatteryStatus.Fair:
      return { bg: "bg-yellow-50", border: "border-yellow-200", pill: "bg-yellow-100 text-yellow-800" };
    case BatteryStatus.ReplaceSoon:
      return { bg: "bg-orange-50", border: "border-orange-200", pill: "bg-orange-100 text-orange-800" };
    case BatteryStatus.Replace:
      return { bg: "bg-red-50", border: "border-red-200", pill: "bg-red-100 text-red-800" };
  }
}
