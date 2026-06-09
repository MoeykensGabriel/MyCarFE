"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Car } from "lucide-react";

import { useOccupancy } from "@/hooks/useSchedule";
import { PageHeader } from "@/components/shared/PageHeader";
import type { OccupancySlot } from "@/types/api.types";

// ─── Helpers de fechas ────────────────────────────────────────────────────────

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const diff = (x.getDay() + 6) % 7; // lunes = 0
  x.setDate(x.getDate() - diff);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dayLabel(d: Date): string {
  return d.toLocaleDateString("es-AR", { weekday: "long", day: "2-digit", month: "2-digit" });
}

// ─── Agrupación por servicio/área dentro de un día ──────────────────────────────

interface AreaRow {
  key: string;
  name: string;
  slots: OccupancySlot[];
}

function areaRowsForDay(daySlots: OccupancySlot[]): AreaRow[] {
  const map = new Map<string, AreaRow>();
  for (const s of daySlots) {
    // Un vehículo sin servicios/áreas cae en "Sin área".
    const areas = s.areas.length > 0 ? s.areas : [{ areaId: null, areaName: null }];
    for (const a of areas) {
      const key = a.areaId ?? "__none__";
      const name = a.areaName ?? "Sin área";
      let row = map.get(key);
      if (!row) {
        row = { key, name, slots: [] };
        map.set(key, row);
      }
      row.slots.push(s);
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    if (a.key === "__none__") return 1;
    if (b.key === "__none__") return -1;
    return a.name.localeCompare(b.name);
  });
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const from = toISODate(weekDays[0]);
  const to   = toISODate(weekDays[6]);

  const { data, isLoading, isError } = useOccupancy(from, to);

  const capacity = data?.physicalCapacity ?? 0;
  const slots    = data?.slots ?? [];

  // Vehículos que ocupan cada día (intersección [start, end] con el día).
  const slotsByDay = useMemo(() => {
    const map: Record<string, OccupancySlot[]> = {};
    for (const d of weekDays) {
      const dStart = new Date(d); dStart.setHours(0, 0, 0, 0);
      const dEnd   = new Date(d); dEnd.setHours(23, 59, 59, 999);
      map[toISODate(d)] = slots.filter((s) => {
        const start = new Date(s.scheduledStart);
        const end   = new Date(s.scheduledEnd);
        return start <= dEnd && end >= dStart;
      });
    }
    return map;
  }, [slots, weekDays]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tablero del taller"
        subtitle={
          <span>
            Del <strong>{dayLabel(weekDays[0])}</strong> al <strong>{dayLabel(weekDays[6])}</strong>.
            {capacity > 0 && <> Capacidad: <strong>{capacity}</strong> {capacity === 1 ? "lugar" : "lugares"} por día.</>}
            {" "}Cada día muestra, por servicio, los vehículos en el taller.
          </span>
        }
        Icon={CalendarDays}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setWeekStart((w) => addDays(w, -7))}
              className="px-3 py-1.5 text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 rounded-lg border border-[#c4c6cd] flex items-center gap-1.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Semana anterior
            </button>
            <button
              onClick={() => setWeekStart(startOfWeek(new Date()))}
              className="px-3 py-1.5 text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 rounded-lg border border-[#c4c6cd] shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              Hoy
            </button>
            <button
              onClick={() => setWeekStart((w) => addDays(w, 7))}
              className="px-3 py-1.5 text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 rounded-lg border border-[#c4c6cd] flex items-center gap-1.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              Semana siguiente <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        }
      />

      {isLoading && (
        <div className="rounded border bg-white p-6 text-sm text-gray-500">Cargando...</div>
      )}
      {isError && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          No se pudo cargar el tablero.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="space-y-4">
          {weekDays.map((d) => {
            const key      = toISODate(d);
            const daySlots = slotsByDay[key] ?? [];
            const rows     = areaRowsForDay(daySlots);
            const count    = daySlots.length; // vehículos distintos en el taller ese día
            const full     = capacity > 0 && count >= capacity;
            const near     = capacity > 0 && !full && count / capacity >= 0.8;
            const countCls = full
              ? "bg-red-100 text-red-700 border-red-200"
              : near
                ? "bg-amber-100 text-amber-700 border-amber-200"
                : "bg-emerald-100 text-emerald-700 border-emerald-200";

            return (
              <div key={key} className="rounded-xl border border-[#c4c6cd] bg-white overflow-hidden">
                {/* Cabecera del día */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#041627] text-white">
                  <span className="text-sm font-bold capitalize">{dayLabel(d)}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border tabular-nums ${countCls}`}>
                    {count}{capacity > 0 ? ` / ${capacity}` : ""} {count === 1 ? "vehículo" : "vehículos"}
                  </span>
                </div>

                {/* Filas por servicio/área */}
                {rows.length === 0 ? (
                  <p className="px-4 py-4 text-xs text-gray-400">Sin vehículos agendados.</p>
                ) : (
                  <div className="divide-y divide-[#c4c6cd]/40">
                    {rows.map((row) => (
                      <div key={row.key} className="grid grid-cols-[140px_1fr_auto] gap-3 items-center px-4 py-2.5">
                        {/* Servicio / área */}
                        <span className="text-sm font-semibold text-[#041627] truncate">{row.name}</span>

                        {/* Chips de patentes */}
                        <div className="flex flex-wrap gap-1.5">
                          {row.slots.map((s) => (
                            <Link
                              key={s.workOrderId}
                              href={`/admin/work-orders/${s.workOrderId}`}
                              title={`${s.vehicleBrand} ${s.vehicleModel}${s.ownerName ? ` — ${s.ownerName}` : ""}`}
                              className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 font-mono text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors"
                            >
                              <Car className="w-3 h-3 shrink-0" />
                              {s.vehicleLicensePlate}
                            </Link>
                          ))}
                        </div>

                        {/* Conteo */}
                        <span className="text-xs font-bold text-[#44474c]/70 whitespace-nowrap tabular-nums">
                          {row.slots.length} {row.slots.length === 1 ? "vehículo" : "vehículos"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
