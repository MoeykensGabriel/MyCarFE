"use client";

import { WorkOrderStatus, getWorkOrderStatusConfig } from "@/lib/enums";

/**
 * Etapas del viaje de la orden tal como las entiende el cliente. Varios estados
 * internos colapsan en una misma etapa (ej. UnderInspection y Diagnosing son
 * "Revisión") para que la barra sea simple de leer.
 */
const STEPS = ["Ingreso", "Revisión", "Presupuesto", "En taller", "Listo"] as const;

function stepIndexFor(status: WorkOrderStatus): number {
  switch (status) {
    case WorkOrderStatus.Received:         return 0;
    case WorkOrderStatus.UnderInspection:
    case WorkOrderStatus.Diagnosing:       return 1;
    case WorkOrderStatus.AwaitingApproval: return 2;
    case WorkOrderStatus.Approved:
    case WorkOrderStatus.InProgress:       return 3;
    case WorkOrderStatus.Completed:
    case WorkOrderStatus.Delivered:        return 4;
    default:                               return 0;
  }
}

interface Props {
  status: WorkOrderStatus;
}

/**
 * Barra de progreso de 5 etapas para que el cliente vea "dónde está mi auto"
 * de un vistazo. No se renderiza para órdenes canceladas (el badge alcanza).
 */
export function OrderStatusStepper({ status }: Props) {
  if (status === WorkOrderStatus.Cancelled) return null;

  const current   = stepIndexFor(status);
  const delivered = status === WorkOrderStatus.Delivered;

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {STEPS.map((step, i) => {
          const done    = delivered || i < current;
          const isHere  = !delivered && i === current;
          return (
            <div key={step} className="flex-1">
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  done
                    ? "bg-emerald-400"
                    : isHere
                      ? "bg-[#fea520] animate-pulse"
                      : "bg-[#041627]/10"
                }`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-bold uppercase tracking-wider text-[#44474c]/60">
          {delivered ? "Viaje completado" : `Etapa ${current + 1} de ${STEPS.length} · ${STEPS[current]}`}
        </p>
        <p className="text-[9px] font-bold uppercase tracking-wider text-[#44474c]/45">
          {getWorkOrderStatusConfig(status).label}
        </p>
      </div>
    </div>
  );
}
