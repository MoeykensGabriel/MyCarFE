"use client";

import { Car, Users, Activity, AlertCircle } from "lucide-react";

import { DashboardWorkshopLoad } from "@/types/api.types";
import { formatEstimatedDuration } from "@/lib/format";

interface Props {
  load: DashboardWorkshopLoad;
}

/**
 * Widget de carga del taller en tiempo real.
 *
 * Pensado para que el admin pueda responder en 3 segundos preguntas como:
 *   "¿Puedo aceptar este trabajo para el viernes?"
 *   "¿Quién está más libre para asignarle algo?"
 *
 * Muestra 3 cosas:
 *  1. Vehículos en el taller vs capacidad física (ocupación)
 *  2. Carga total de trabajo pendiente (en horas)
 *  3. Carga por mecánico con barra visual (libre → ocupado → sobrecargado)
 */
export function WorkshopLoadCard({ load }: Props) {
  const occupancyPct = load.physicalCapacity > 0
    ? Math.min(100, Math.round((load.vehiclesInShop / load.physicalCapacity) * 100))
    : 0;

  const isFull          = load.vehiclesInShop >= load.physicalCapacity;
  const isNearlyFull    = !isFull && occupancyPct >= 80;

  return (
    <section className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-[#c4c6cd]/60 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#fea520]" />
          <h2 className="text-sm font-semibold text-[#041627]">Carga del taller</h2>
        </div>
        {isFull && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-3 h-3" />
            Lleno
          </span>
        )}
        {isNearlyFull && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            Casi lleno
          </span>
        )}
      </div>

      {/* Bloque ocupación + trabajo pendiente */}
      <div className="px-5 py-4 grid grid-cols-2 gap-4 border-b border-[#c4c6cd]/40">
        {/* Vehículos en el taller */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Car className="w-3.5 h-3.5 text-[#44474c]/60" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">
              En el taller
            </p>
          </div>
          <p className="text-2xl font-bold text-[#041627] tabular-nums">
            {load.vehiclesInShop}
            <span className="text-sm font-normal text-[#44474c]/60"> / {load.physicalCapacity}</span>
          </p>
          {/* Barra de ocupación */}
          <div className="w-full h-1.5 rounded-full bg-[#c4c6cd]/30 mt-2">
            <div
              className={`h-1.5 rounded-full transition-all ${
                isFull ? "bg-red-500" : isNearlyFull ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{ width: `${occupancyPct}%` }}
            />
          </div>
        </div>

        {/* Trabajo pendiente total */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Users className="w-3.5 h-3.5 text-[#44474c]/60" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">
              Trabajo pendiente
            </p>
          </div>
          <p className="text-2xl font-bold text-[#041627] tabular-nums">
            {load.totalPendingMinutes > 0
              ? formatEstimatedDuration(load.totalPendingMinutes)
              : "—"}
          </p>
          <p className="text-[10px] text-[#44474c]/60 mt-2">
            Suma de servicios asignados sin completar
          </p>
        </div>
      </div>

      {/* Carga por mecánico */}
      <div className="px-5 py-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70 mb-3">
          Por mecánico
        </p>

        {load.mechanicsLoad.length === 0 ? (
          <p className="text-xs text-[#44474c] italic">
            No hay mecánicos activos.
          </p>
        ) : (
          <MechanicLoadList items={load.mechanicsLoad} />
        )}
      </div>
    </section>
  );
}

// ─── Sub-componente: lista de mecánicos con barras ────────────────────────────

function MechanicLoadList({
  items,
}: {
  items: DashboardWorkshopLoad["mechanicsLoad"];
}) {
  // Calculamos el máximo del conjunto para escalar las barras proporcionalmente.
  // Mínimo 60 (1 hora) para que las barras chicas no sean invisibles.
  const maxMinutes = Math.max(60, ...items.map((m) => m.pendingMinutes));

  return (
    <div className="space-y-3">
      {items.map((m) => {
        const pct = maxMinutes > 0 ? Math.round((m.pendingMinutes / maxMinutes) * 100) : 0;

        // Etiqueta de estado: libre / ocupado / sobrecargado.
        // Sobrecargado: > 8 hs (una jornada). Libre: 0. Resto: ocupado.
        const isFree      = m.pendingMinutes === 0;
        const isOverload  = m.pendingMinutes > 60 * 8;
        const statusLabel = isFree ? "Libre" : isOverload ? "Sobrecargado" : "Ocupado";
        const statusCls   = isFree
          ? "text-emerald-700"
          : isOverload
            ? "text-red-700"
            : "text-amber-700";
        const barCls = isFree
          ? "bg-emerald-400"
          : isOverload
            ? "bg-red-500"
            : "bg-amber-500";

        return (
          <div key={m.mechanicId} className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-[#041627] truncate">{m.fullName}</p>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-semibold text-[#44474c]">
                  {m.pendingTaskCount} {m.pendingTaskCount === 1 ? "tarea" : "tareas"}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${statusCls}`}>
                  {statusLabel}
                </span>
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-[#c4c6cd]/30">
              <div
                className={`h-2 rounded-full transition-all ${barCls}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-[10px] text-[#44474c]/70 tabular-nums">
              {m.pendingMinutes > 0
                ? `${formatEstimatedDuration(m.pendingMinutes)} de trabajo pendiente`
                : "Sin trabajo asignado"}
            </p>
          </div>
        );
      })}
    </div>
  );
}
