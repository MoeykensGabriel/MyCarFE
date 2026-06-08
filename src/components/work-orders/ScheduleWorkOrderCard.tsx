"use client";

import { useState } from "react";
import { CalendarClock, X } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WorkOrder } from "@/types/api.types";
import { WorkOrderStatus } from "@/lib/enums";
import { useScheduleWorkOrder } from "@/hooks/useWorkOrders";
import { formatDateTime, formatWorkDuration } from "@/lib/format";

/**
 * Agenda de la orden en el calendario de ocupación del taller (por vehículo).
 * El admin elige la fecha de inicio; el fin se calcula como inicio + duración total
 * estimada de los servicios. No se muestra para órdenes cerradas (Delivered/Cancelled).
 */
export function ScheduleWorkOrderCard({ order }: { order: WorkOrder }) {
  const schedule = useScheduleWorkOrder(order.id);
  const [date, setDate] = useState("");

  const closed =
    order.currentStatus === WorkOrderStatus.Delivered ||
    order.currentStatus === WorkOrderStatus.Cancelled;
  if (closed) return null;

  const isScheduled = !!order.scheduledStart;
  const totalLabel = formatWorkDuration(order.totalEstimatedMinutes) || "sin estimar";

  function handleSchedule() {
    if (!date) return;
    // Inicio a las 08:00 (apertura típica); el backend calcula el fin con la duración total.
    schedule.mutate({ scheduledStart: `${date}T08:00:00` });
    setDate("");
  }

  function handleClear() {
    schedule.mutate({ scheduledStart: null, scheduledEnd: null });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <CalendarClock className="w-4 h-4 text-[#fea520]" />
          Agenda / ocupación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-[#44474c]">
          Duración total estimada:{" "}
          <strong className="text-[#041627]">{totalLabel}</strong>
        </p>

        {isScheduled ? (
          <div className="space-y-2">
            <div className="rounded-lg bg-[#eefcfd] border border-[#c4c6cd]/60 px-3 py-2 text-xs text-[#041627]">
              <div>
                <span className="text-[#44474c]/70">Entra:</span>{" "}
                <strong>{formatDateTime(order.scheduledStart!)}</strong>
              </div>
              {order.scheduledEnd && (
                <div>
                  <span className="text-[#44474c]/70">Fin estimado:</span>{" "}
                  <strong>{formatDateTime(order.scheduledEnd)}</strong>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={schedule.isPending}
              className="gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Quitar de la agenda
            </Button>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#44474c]/70">
                Fecha de inicio
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-[#041627]/10 bg-white"
              />
            </div>
            <Button
              size="sm"
              onClick={handleSchedule}
              disabled={!date || schedule.isPending}
            >
              {schedule.isPending ? "Agendando..." : "Agendar"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
