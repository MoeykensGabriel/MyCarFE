"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Car } from "lucide-react";

import { useOccupancy } from "@/hooks/useSchedule";
import { PageHeader } from "@/components/shared/PageHeader";
import { WorkOrderStatus } from "@/lib/enums";
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
  return d.toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "2-digit" });
}

// ─── Estilo por estado del vehículo en la bahía ─────────────────────────────────

function slotStyle(status: WorkOrderStatus): { chip: string; tag: string } {
  switch (status) {
    case WorkOrderStatus.InProgress:
      // Trabajo activo
      return { chip: "border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900", tag: "En trabajo" };
    case WorkOrderStatus.Completed:
      // Terminado, esperando que lo retiren (ya no se le aplica trabajo)
      return { chip: "border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-600", tag: "Esperando retiro" };
    case WorkOrderStatus.Approved:
    default:
      // Agendado pero todavía no presente
      return { chip: "border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-900", tag: "Agendado" };
  }
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
      const key = toISODate(d);
      map[key] = slots.filter((s) => {
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
        title="Ocupación del taller"
        subtitle={
          <span>
            Del <strong>{dayLabel(weekDays[0])}</strong> al <strong>{dayLabel(weekDays[6])}</strong>.
            {capacity > 0 && <> Capacidad: <strong>{capacity}</strong> {capacity === 1 ? "lugar" : "lugares"}.</>}
            {" "}Cada día muestra los vehículos que ocupan una bahía.
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
          No se pudo cargar la ocupación.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {weekDays.map((d) => {
            const key   = toISODate(d);
            const here  = slotsByDay[key] ?? [];
            const count = here.length;
            const full  = capacity > 0 && count >= capacity;
            const near  = capacity > 0 && !full && count / capacity >= 0.8;

            const countCls = full
              ? "bg-red-100 text-red-700 border-red-200"
              : near
                ? "bg-amber-100 text-amber-700 border-amber-200"
                : "bg-emerald-100 text-emerald-700 border-emerald-200";

            return (
              <div key={key} className="rounded-xl border border-[#c4c6cd] bg-white overflow-hidden flex flex-col">
                <div className="px-3 py-2 border-b border-[#c4c6cd]/60 bg-gray-50 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">{dayLabel(d)}</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full border tabular-nums ${countCls}`}>
                    {count}{capacity > 0 ? ` / ${capacity}` : ""}
                  </span>
                </div>
                <div className="p-2 space-y-1.5 min-h-[3rem]">
                  {count === 0 ? (
                    <span className="text-[11px] text-gray-300">—</span>
                  ) : (
                    here.map((s) => {
                      const st = slotStyle(s.status);
                      return (
                        <Link
                          key={s.workOrderId}
                          href={`/admin/work-orders/${s.workOrderId}`}
                          className={`block rounded-lg border px-2 py-1.5 transition-colors ${st.chip}`}
                          title={`${s.vehicleBrand} ${s.vehicleModel}${s.ownerName ? ` — ${s.ownerName}` : ""}`}
                        >
                          <div className="flex items-center gap-1 font-mono text-xs font-bold">
                            <Car className="w-3 h-3 shrink-0" />
                            {s.vehicleLicensePlate}
                          </div>
                          <div className="text-[10px] opacity-80 truncate">{s.vehicleBrand} {s.vehicleModel}</div>
                          <div className="text-[9px] font-bold uppercase tracking-wide opacity-70 mt-0.5">{st.tag}</div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
