"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { useSchedule } from "@/hooks/useSchedule";
import { PageHeader } from "@/components/shared/PageHeader";
import type { ScheduleSlot } from "@/types/api.types";

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
  return d.toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "2-digit" });
}

const UNASSIGNED_AREA = "__UNASSIGNED__";

// ─── Página ───────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const from = toISODate(weekDays[0]);
  const to   = toISODate(weekDays[6]);

  const { data: slots, isLoading, isError } = useSchedule(from, to);

  // Agrupamos por área y luego, dentro de cada área, por día.
  const grouped = useMemo(() => groupByAreaAndDay(slots ?? [], weekDays), [slots, weekDays]);

  return (
    <div className="space-y-5">
      {/* Header Unificado */}
      <PageHeader
        title="Calendario del taller"
        subtitle={
          <span>
            Mostrando del <strong>{dayLabel(weekDays[0])}</strong> al{" "}
            <strong>{dayLabel(weekDays[6])}</strong>. Cada celda muestra las patentes que están ocupando ese área durante el día.
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

      {/* Estado */}
      {isLoading && (
        <div className="rounded border bg-white p-6 text-sm text-gray-500">Cargando...</div>
      )}
      {isError && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          No se pudo cargar el calendario.
        </div>
      )}

      {/* Grilla */}
      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded border bg-white">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="sticky left-0 z-10 bg-gray-50 border-b border-r px-3 py-2 text-left font-semibold text-gray-700 w-44">
                  Área
                </th>
                {weekDays.map((d) => (
                  <th
                    key={d.toISOString()}
                    className="border-b px-3 py-2 text-left font-semibold text-gray-700 min-w-[10rem]"
                  >
                    {dayLabel(d)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grouped.areas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                    No hay trabajos agendados en esta semana.
                  </td>
                </tr>
              ) : (
                grouped.areas.map((area) => (
                  <tr key={area.key} className="border-b last:border-b-0">
                    <td className="sticky left-0 z-10 bg-white border-r px-3 py-2 align-top font-medium text-gray-800">
                      {area.name}
                    </td>
                    {weekDays.map((d) => {
                      const dayKey  = toISODate(d);
                      const slotsHere = area.byDay[dayKey] ?? [];
                      return (
                        <td key={dayKey} className="align-top px-2 py-2 border-l">
                          {slotsHere.length === 0 ? (
                            <span className="text-xs text-gray-300">—</span>
                          ) : (
                            <ul className="space-y-1">
                              {slotsHere.map((s) => (
                                <SlotChip key={s.workOrderServiceId} slot={s} />
                              ))}
                            </ul>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Pieza visual de un slot ──────────────────────────────────────────────────

function SlotChip({ slot }: { slot: ScheduleSlot }) {
  return (
    <li>
      <Link
        href={`/admin/work-orders/${slot.workOrderId}`}
        className="block rounded border border-amber-300 bg-amber-50 px-2 py-1 hover:bg-amber-100"
        title={`${slot.serviceName} — ${slot.vehicleBrand} ${slot.vehicleModel}${
          slot.mechanicFullName ? ` — ${slot.mechanicFullName}` : ""
        }`}
      >
        <div className="font-mono text-xs font-bold text-amber-900">
          {slot.vehicleLicensePlate}
        </div>
        <div className="text-[10px] text-gray-600 truncate">{slot.serviceName}</div>
        {slot.mechanicFullName && (
          <div className="text-[10px] text-gray-500 truncate">{slot.mechanicFullName}</div>
        )}
      </Link>
    </li>
  );
}

// ─── Agrupación ───────────────────────────────────────────────────────────────

interface GroupedArea {
  key: string;
  name: string;
  byDay: Record<string, ScheduleSlot[]>;
}

function groupByAreaAndDay(slots: ScheduleSlot[], weekDays: Date[]): {
  areas: GroupedArea[];
} {
  const byArea = new Map<string, GroupedArea>();

  for (const s of slots) {
    const key  = s.areaId ?? UNASSIGNED_AREA;
    const name = s.areaName ?? "(Sin área)";

    if (!byArea.has(key)) {
      byArea.set(key, { key, name, byDay: {} });
    }
    const entry = byArea.get(key)!;

    const start = new Date(s.scheduledStart);
    const end   = new Date(s.scheduledEnd);

    for (const d of weekDays) {
      const dStart = new Date(d);
      dStart.setHours(0, 0, 0, 0);
      const dEnd = new Date(d);
      dEnd.setHours(23, 59, 59, 999);
      // El slot intersecta el día si start <= dEnd y end >= dStart
      if (start <= dEnd && end >= dStart) {
        const k = toISODate(d);
        (entry.byDay[k] ||= []).push(s);
      }
    }
  }

  const areas = Array.from(byArea.values()).sort((a, b) => {
    if (a.key === UNASSIGNED_AREA) return 1;
    if (b.key === UNASSIGNED_AREA) return -1;
    return a.name.localeCompare(b.name);
  });

  return { areas };
}
