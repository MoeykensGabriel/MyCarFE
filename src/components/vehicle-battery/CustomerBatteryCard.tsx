"use client";

import { BatteryCharging } from "lucide-react";

import { useVehicleBattery } from "@/hooks/useVehicleBattery";
import { BatteryStatus, BatteryStatusLabel, BatteryTerminalSideLabel } from "@/lib/enums";

interface Props {
  vehicleId: string;
}

/**
 * Vista de solo lectura del estado de la batería para el cliente.
 * Muestra la última revisión: fecha, resultado (estado) y remanencia (%) con barra
 * coloreada. Si el vehículo no tiene batería registrada o chequeos, no renderiza nada.
 */
export function CustomerBatteryCard({ vehicleId }: Props) {
  const { data: battery, isLoading } = useVehicleBattery(vehicleId);

  if (isLoading) {
    return (
      <section className="bg-white rounded-2xl border border-[#041627]/10 shadow-sm overflow-hidden">
        <div className="px-4 py-4">
          <div className="h-24 bg-[#c4c6cd]/20 rounded-xl animate-pulse" />
        </div>
      </section>
    );
  }

  // Sin batería o sin chequeos → no mostramos la sección.
  if (!battery || battery.currentStatus == null) return null;

  const lastCheck = battery.checks[battery.checks.length - 1];
  const pct = battery.currentRemainingPercentage;
  const s = statusStyle(battery.currentStatus);
  // Antigüedad desde la instalación (de ahí se mide la vida útil / garantía).
  const ageYears = battery.installedOn
    ? Math.max(0, new Date().getFullYear() - new Date(battery.installedOn).getFullYear())
    : null;
  // Dimensiones de caja: solo si las 3 medidas están cargadas (ancho × largo × alto).
  const boxDimensions =
    battery.boxWidthCm != null && battery.boxLengthCm != null && battery.boxHeightCm != null
      ? `${battery.boxWidthCm}×${battery.boxLengthCm}×${battery.boxHeightCm}`
      : null;

  return (
    <section className="bg-white rounded-2xl border border-[#041627]/10 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-[#041627]/5 bg-gradient-to-r from-[#eefcfd] to-white">
        <BatteryCharging className="w-4 h-4 text-[#041627]" strokeWidth={2} />
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627]/80">
          Estado de la Batería
        </p>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Remanencia con barra de progreso coloreada */}
        {pct != null && (
          <div>
            <div className="flex items-end justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#44474c]/70">
                Remanencia
              </span>
              <span className="text-2xl font-black leading-none" style={{ color: remainingColor(pct) }}>
                {pct}
                <span className="text-xs font-bold text-[#44474c]/60"> %</span>
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-[#041627]/8 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${clamp(pct)}%`, backgroundColor: remainingColor(pct) }}
              />
            </div>
          </div>
        )}

        {/* Revisión: fecha + resultado */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-[#041627]/8 bg-[#f4f6f8] px-3 py-2">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#44474c]/60">Revisión</p>
            <p className="text-xs font-bold text-[#041627] mt-0.5">
              {lastCheck
                ? new Date(lastCheck.checkedOn).toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                : "—"}
            </p>
          </div>
          <div className="rounded-lg border border-[#041627]/8 bg-[#f4f6f8] px-3 py-2">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#44474c]/60">Resultado</p>
            <span className={`inline-block mt-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${s.pill}`}>
              {BatteryStatusLabel[battery.currentStatus]}
            </span>
          </div>
        </div>

        {/* Datos secundarios: marca, capacidad, voltaje, antigüedad */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#44474c]/70">
          {battery.brand && <span><span className="text-[#44474c]/50">Marca:</span> {battery.brand}</span>}
          {battery.capacityAh != null && (
            <span><span className="text-[#44474c]/50">Capacidad:</span> {battery.capacityAh} Ah</span>
          )}
          {lastCheck?.voltage != null && (
            <span><span className="text-[#44474c]/50">Voltaje:</span> {lastCheck.voltage.toFixed(1)} V</span>
          )}
          {ageYears != null && (
            <span><span className="text-[#44474c]/50">Antigüedad:</span> ~{ageYears} año{ageYears !== 1 ? "s" : ""}</span>
          )}
        </div>

        {/* Ficha técnica del repuesto: caja + borne (para identificar qué batería comprar) */}
        {(boxDimensions != null || battery.positiveTerminalSide != null) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#44474c]/70">
            {boxDimensions != null && (
              <span><span className="text-[#44474c]/50">Caja:</span> {boxDimensions} cm</span>
            )}
            {battery.positiveTerminalSide != null && (
              <span><span className="text-[#44474c]/50">Borne +:</span> {BatteryTerminalSideLabel[battery.positiveTerminalSide]}</span>
            )}
          </div>
        )}

        {lastCheck?.notes && (
          <p className="text-[10px] text-[#44474c]/70 leading-relaxed">{lastCheck.notes}</p>
        )}

        <p className="text-[10px] text-[#44474c]/60 leading-relaxed pt-1">
          Estado registrado por el taller en la inspección de tu vehículo.
        </p>
      </div>
    </section>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(pct: number): number {
  return Math.max(0, Math.min(100, pct));
}

/**
 * Color de la remanencia en escala de 4 niveles, de verde a rojo,
 * a medida que cae el porcentaje. Barra de carga común e intuitiva.
 */
function remainingColor(pct: number): string {
  if (pct >= 75) return "#16a34a"; // verde
  if (pct >= 50) return "#eab308"; // amarillo
  if (pct >= 25) return "#f97316"; // naranja
  return "#dc2626";                // rojo
}

// ─── Estilos del pill de estado ───────────────────────────────────────────────

function statusStyle(status: BatteryStatus) {
  switch (status) {
    case BatteryStatus.Good:
      return { pill: "bg-emerald-100 text-emerald-800" };
    case BatteryStatus.Fair:
      return { pill: "bg-yellow-100 text-yellow-800" };
    case BatteryStatus.ReplaceSoon:
      return { pill: "bg-orange-100 text-orange-800" };
    case BatteryStatus.Replace:
      return { pill: "bg-red-100 text-red-800" };
  }
}
