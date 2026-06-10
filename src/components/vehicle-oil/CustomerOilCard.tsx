"use client";

import { Droplet, CalendarClock, Gauge } from "lucide-react";

import { useVehicleOil } from "@/hooks/useVehicleOil";
import { OilServiceStatus, OilServiceStatusLabel } from "@/lib/enums";

interface Props {
  vehicleId: string;
}

/**
 * Vista de solo lectura del estado del aceite para el cliente.
 * Muestra la aproximación al próximo service por los dos contadores (km y tiempo),
 * resaltando el que llega primero. Si el vehículo no tiene cambios registrados, no
 * renderiza nada. Lo carga el taller en la inspección.
 */
export function CustomerOilCard({ vehicleId }: Props) {
  const { data: oil, isLoading } = useVehicleOil(vehicleId);

  if (isLoading) {
    return (
      <section className="bg-white rounded-2xl border border-[#041627]/10 shadow-sm overflow-hidden">
        <div className="px-4 py-4">
          <div className="h-24 bg-[#c4c6cd]/20 rounded-xl animate-pulse" />
        </div>
      </section>
    );
  }

  // Sin cambios registrados → no mostramos la sección.
  if (!oil) return null;

  // Progreso de cada contador (0..1). El que esté más avanzado es el que "manda".
  const kmProgress = clamp01((oil.currentMileage - oil.changedAtKm) / Math.max(1, oil.intervalKm));
  const totalDays  = Math.max(1, daysBetweenIso(oil.changedOn, oil.nextServiceOn));
  const timeProgress = clamp01((totalDays - oil.daysRemaining) / totalDays);

  const progress = Math.max(kmProgress, timeProgress);
  const drivesByKm = kmProgress >= timeProgress;
  const pctLabel = Math.min(100, Math.round(progress * 100));

  const color = statusColor(oil.status);

  return (
    <section className="bg-white rounded-2xl border border-[#041627]/10 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-[#041627]/5 bg-gradient-to-r from-[#eefcfd] to-white">
        <Droplet className="w-4 h-4 text-[#041627]" strokeWidth={2} />
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627]/80">
          Aceite · Próximo Service
        </p>
      </div>

      <div className="px-4 py-4 space-y-3.5">
        {/* Barra de progreso al próximo service + estado */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#44474c]">
              Avance hasta el próximo service
            </span>
            <span
              className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded"
              style={{ backgroundColor: `${color}1a`, color }}
            >
              {OilServiceStatusLabel[oil.status]}
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-[#f0f2f4] overflow-hidden border border-[#041627]/5">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.max(4, pctLabel)}%`, backgroundColor: color }}
            />
          </div>
          <p className="text-[10px] font-semibold text-[#44474c]/70">
            {oil.status === OilServiceStatus.Overdue
              ? "El service ya está vencido — coordiná el cambio con el taller."
              : `Llega primero por ${drivesByKm ? "kilometraje" : "tiempo"}.`}
          </p>
        </div>

        {/* Dos contadores: km y tiempo. Se resalta el que manda. */}
        <div className="grid grid-cols-2 gap-2">
          <Counter
            icon={Gauge}
            highlighted={drivesByKm}
            label="Por kilometraje"
            primary={
              oil.kmRemaining > 0
                ? `Faltan ${oil.kmRemaining.toLocaleString("es-AR")} km`
                : `Pasado ${Math.abs(oil.kmRemaining).toLocaleString("es-AR")} km`
            }
            secondary={`Próximo a ${oil.nextServiceKm.toLocaleString("es-AR")} km`}
            color={color}
          />
          <Counter
            icon={CalendarClock}
            highlighted={!drivesByKm}
            label="Por tiempo"
            primary={
              oil.daysRemaining > 0
                ? `Faltan ${oil.daysRemaining.toLocaleString("es-AR")} días`
                : `Vencido hace ${Math.abs(oil.daysRemaining).toLocaleString("es-AR")} días`
            }
            secondary={`Vence ${formatIsoDate(oil.nextServiceOn)}`}
            color={color}
          />
        </div>

        {/* Datos del último cambio */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#041627] pt-0.5">
          <span>
            <span className="text-[#44474c] font-medium">Último cambio:</span>{" "}
            <span className="font-bold">
              {formatIsoDate(oil.changedOn)} · {oil.changedAtKm.toLocaleString("es-AR")} km
            </span>
          </span>
          {oil.oilType && (
            <span>
              <span className="text-[#44474c] font-medium">Aceite:</span>{" "}
              <span className="font-bold">
                {oil.oilType}
                {oil.oilBrand ? ` (${oil.oilBrand})` : ""}
              </span>
            </span>
          )}
          <span>
            <span className="text-[#44474c] font-medium">Filtro:</span>{" "}
            <span className="font-bold">{oil.filterChanged ? "Cambiado" : "No"}</span>
          </span>
        </div>

        {oil.notes && (
          <p className="text-xs text-[#44474c] leading-relaxed">{oil.notes}</p>
        )}

        <p className="text-xs text-slate-500 leading-relaxed pt-1">
          Service registrado por el taller. El aviso salta por kilometraje o por tiempo, lo que ocurra primero.
        </p>
      </div>
    </section>
  );
}

// ─── Sub-componente: contador (km o tiempo) ──────────────────────────────────

function Counter({
  icon: Icon,
  highlighted,
  label,
  primary,
  secondary,
  color,
}: {
  icon: React.ElementType;
  highlighted: boolean;
  label: string;
  primary: string;
  secondary: string;
  color: string;
}) {
  return (
    <div
      className="rounded-lg border px-3 py-2"
      style={
        highlighted
          ? { borderColor: `${color}66`, backgroundColor: `${color}0f` }
          : { borderColor: "rgba(4,22,39,0.08)", backgroundColor: "#f4f6f8" }
      }
    >
      <div className="flex items-center gap-1">
        <Icon className="w-3 h-3 shrink-0" style={{ color: highlighted ? color : "#44474c" }} />
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#44474c]">{label}</p>
      </div>
      <p className="text-xs font-black text-[#041627] mt-0.5">{primary}</p>
      <p className="text-[10px] font-semibold text-[#44474c]/70">{secondary}</p>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/** Color del estado: verde (al día) → ámbar (próximo) → rojo (vencido). */
function statusColor(status: OilServiceStatus): string {
  switch (status) {
    case OilServiceStatus.Ok:      return "#16a34a"; // verde
    case OilServiceStatus.DueSoon: return "#f97316"; // naranja
    case OilServiceStatus.Overdue: return "#dc2626"; // rojo
  }
}

/**
 * Formatea una fecha ISO (yyyy-MM-dd) a dd/MM/yyyy sin pasar por Date(), para evitar
 * el corrimiento de un día por zona horaria (Argentina es UTC-3).
 */
function formatIsoDate(iso: string): string {
  const datePart = iso.split("T")[0];
  const [y, m, d] = datePart.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

/** Días entre dos fechas ISO (yyyy-MM-dd), en UTC para evitar corrimientos. */
function daysBetweenIso(fromIso: string, toIso: string): number {
  const from = Date.parse(`${fromIso.split("T")[0]}T00:00:00Z`);
  const to   = Date.parse(`${toIso.split("T")[0]}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.round((to - from) / 86_400_000);
}
