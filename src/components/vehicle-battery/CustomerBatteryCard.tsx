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
  // Se calcula en vivo desde installedOn → va sumando por mes sola, sin guardar nada.
  const ageLabel = battery.installedOn ? formatBatteryAge(battery.installedOn) : null;
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
        {/* Remanencia con símbolo de batería que se rellena según el nivel */}
        {pct != null && (
          <div className="flex items-center gap-4">
            <BatterySymbol pct={pct} />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#44474c]">
                Remanencia
              </span>
              <p className="text-3xl font-black leading-none mt-0.5" style={{ color: remainingColor(pct) }}>
                {pct}
                <span className="text-sm font-bold text-[#44474c]"> %</span>
              </p>
            </div>
          </div>
        )}

        {/* Revisión: fecha + resultado */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-[#041627]/8 bg-[#f4f6f8] px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#44474c]">Revisión</p>
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
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#44474c]">Resultado</p>
            <span className={`inline-block mt-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${s.pill}`}>
              {BatteryStatusLabel[battery.currentStatus]}
            </span>
          </div>
        </div>

        {/* Datos secundarios: marca, capacidad, voltaje, antigüedad */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#041627]">
          {battery.brand && (
            <span>
              <span className="text-[#44474c] font-medium">Marca:</span>{" "}
              <span className="font-bold">{battery.brand}</span>
            </span>
          )}
          {battery.capacityAh != null && (
            <span>
              <span className="text-[#44474c] font-medium">Capacidad:</span>{" "}
              <span className="font-bold">{battery.capacityAh} Ah</span>
            </span>
          )}
          {lastCheck?.voltage != null && (
            <span>
              <span className="text-[#44474c] font-medium">Voltaje:</span>{" "}
              <span className="font-bold">{lastCheck.voltage.toFixed(1)} V</span>
            </span>
          )}
          {ageLabel && (
            <span>
              <span className="text-[#44474c] font-medium">Antigüedad:</span>{" "}
              <span className="font-bold">{ageLabel}</span>
            </span>
          )}
        </div>

        {/* Ficha técnica del repuesto: caja + borne (para identificar qué batería comprar) */}
        {(boxDimensions != null || battery.positiveTerminalSide != null) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#041627]">
            {boxDimensions != null && (
              <span>
                <span className="text-[#44474c] font-medium">Caja:</span>{" "}
                <span className="font-bold">{boxDimensions} cm</span>
              </span>
            )}
            {battery.positiveTerminalSide != null && (
              <span>
                <span className="text-[#44474c] font-medium">Borne +:</span>{" "}
                <span className="font-bold">{BatteryTerminalSideLabel[battery.positiveTerminalSide]}</span>
              </span>
            )}
          </div>
        )}

        {lastCheck?.notes && (
          <p className="text-xs text-[#44474c] leading-relaxed">{lastCheck.notes}</p>
        )}

        <p className="text-xs text-slate-500 leading-relaxed pt-1">
          Estado registrado por el taller en la inspección de tu vehículo.
        </p>
      </div>
    </section>
  );
}

// ─── Símbolo de batería que se rellena ────────────────────────────────────────

/**
 * Ícono de batería (horizontal) cuyo relleno y color reflejan la remanencia.
 * Verde → amarillo → naranja → rojo a medida que cae el porcentaje.
 */
function BatterySymbol({ pct }: { pct: number }) {
  const p = clamp(pct);
  const color = remainingColor(pct);
  // Track interno: x=6, ancho útil 74. El relleno arranca desde la izquierda.
  const fillWidth = (74 * p) / 100;

  return (
    <svg viewBox="0 0 96 48" className="w-24 shrink-0" role="img" aria-label={`Batería al ${p}%`}>
      {/* Cuerpo */}
      <rect x={2} y={8} width={82} height={32} rx={6} fill="#ffffff" stroke="#041627" strokeOpacity={0.25} strokeWidth={2} />
      {/* Borne */}
      <rect x={86} y={18} width={7} height={12} rx={2} fill="#041627" fillOpacity={0.35} />
      {/* Relleno coloreado */}
      {fillWidth > 0 && (
        <rect x={6} y={12} width={fillWidth} height={24} rx={3} fill={color} className="transition-all" />
      )}
      {/* Divisiones (estética de celdas) */}
      {[28, 50, 72].map((x) => (
        <line key={x} x1={x} y1={12} x2={x} y2={36} stroke="#ffffff" strokeOpacity={0.6} strokeWidth={1.5} />
      ))}
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(pct: number): number {
  return Math.max(0, Math.min(100, pct));
}

/**
 * Antigüedad de la batería desde su instalación, en meses (o años + meses al pasar
 * el año). Se calcula contra la fecha actual, así que crece sola con el tiempo.
 */
function formatBatteryAge(installedOnIso: string): string {
  const start = new Date(installedOnIso);
  const now = new Date();
  let months =
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  // Si todavía no se cumplió el día del mes, restamos un mes.
  if (now.getDate() < start.getDate()) months -= 1;
  months = Math.max(0, months);

  if (months < 1) return "menos de 1 mes";
  if (months < 12) return `${months} ${months === 1 ? "mes" : "meses"}`;

  const years = Math.floor(months / 12);
  const rem = months % 12;
  const yearsLabel = `${years} ${years === 1 ? "año" : "años"}`;
  return rem === 0 ? yearsLabel : `${yearsLabel} ${rem} ${rem === 1 ? "mes" : "meses"}`;
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
