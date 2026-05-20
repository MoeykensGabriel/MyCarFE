"use client";

import { CheckCircle2, Clock, PlayCircle, X } from "lucide-react";

import { WorkOrderService } from "@/types/api.types";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  AssignmentStatusLabel,
  WorkOrderServiceAssignmentStatus,
  WorkOrderStatus,
} from "@/lib/enums";
import { useRemoveWorkOrderService } from "@/hooks/useWorkOrders";
import { MechanicAssignSelect } from "@/components/work-orders/MechanicAssignSelect";

interface ServicesListProps {
  workOrderId: string;
  services: WorkOrderService[];
  totalAmount: number;
  /** Si true, permite quitar servicios (solo en Diagnosing). */
  editable?: boolean;
  /** Estado actual de la WO. Determina si la asignación de mecánicos es editable. */
  workOrderStatus?: WorkOrderStatus;
}

export function ServicesList({
  workOrderId,
  services,
  totalAmount,
  editable = false,
  workOrderStatus,
}: ServicesListProps) {
  const { mutate: removeService, isPending } = useRemoveWorkOrderService(workOrderId);

  // Asignación de mecánicos: bloqueada solo en estados terminales de la WO.
  // En Diagnosing, AwaitingApproval e InProgress el admin puede asignar/reasignar.
  const isWoTerminal =
    workOrderStatus === WorkOrderStatus.Completed ||
    workOrderStatus === WorkOrderStatus.Delivered ||
    workOrderStatus === WorkOrderStatus.Cancelled;
  const canAssignMechanic = workOrderStatus !== undefined && !isWoTerminal;

  if (!services.length) {
    return (
      <p className="text-sm text-muted-foreground">
        {editable
          ? "Aún no hay servicios. Agregá los que correspondan al diagnóstico."
          : "Sin servicios registrados."}
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {services.map((s) => (
        <ServiceRow
          key={s.id}
          workOrderId={workOrderId}
          service={s}
          editable={editable}
          canAssignMechanic={canAssignMechanic}
          onRemove={() => removeService(s.id)}
          removing={isPending}
        />
      ))}

      <div className="flex justify-between items-center pt-3 border-t mt-1">
        <span className="text-sm font-semibold text-gray-900">Total estimado</span>
        <span className="text-base font-bold text-gray-900 tabular-nums">
          {formatCurrency(totalAmount)}
        </span>
      </div>
    </div>
  );
}

// ─── Fila de servicio ─────────────────────────────────────────────────────────

function ServiceRow({
  workOrderId,
  service: s,
  editable,
  canAssignMechanic,
  onRemove,
  removing,
}: {
  workOrderId: string;
  service: WorkOrderService;
  editable: boolean;
  canAssignMechanic: boolean;
  onRemove: () => void;
  removing: boolean;
}) {
  const status = s.assignmentStatus ?? WorkOrderServiceAssignmentStatus.Unassigned;

  return (
    <div className="py-3 border-b last:border-0">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{s.nameSnapshot}</p>
          {s.descriptionSnapshot && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {s.descriptionSnapshot}
            </p>
          )}
          {s.quantity > 1 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {s.quantity} × {formatCurrency(s.priceSnapshot)}
            </p>
          )}

          {/* Asignación + estado */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <AssignmentBadge status={status} />
            <MechanicAssignSelect
              workOrderId={workOrderId}
              workOrderServiceId={s.id}
              assignedMechanicId={s.assignedMechanicId}
              assignedMechanicName={s.assignedMechanicName}
              assignmentStatus={status}
              readOnly={!canAssignMechanic}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm font-medium text-gray-900 tabular-nums">
            {formatCurrency(s.subtotal)}
          </span>
          {editable && (
            <button
              onClick={onRemove}
              disabled={removing}
              className="text-muted-foreground hover:text-red-500 disabled:opacity-40 transition-colors"
              title="Quitar servicio"
              aria-label="Quitar servicio"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Notas del mecánico cuando finalizó */}
      {status === WorkOrderServiceAssignmentStatus.Completed && s.mechanicNotes && (
        <div className="mt-2 ml-0 space-y-1.5">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/80">
              Lo que hizo el mecánico
            </p>
            <p className="text-xs text-emerald-900 mt-0.5 whitespace-pre-wrap leading-relaxed">
              {s.mechanicNotes}
            </p>
          </div>
          {s.mechanicFindings && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700/80">
                Hallazgos / recomendaciones
              </p>
              <p className="text-xs text-blue-900 mt-0.5 whitespace-pre-wrap leading-relaxed">
                {s.mechanicFindings}
              </p>
            </div>
          )}
          {s.completedAt && (
            <p className="text-[10px] text-gray-500 pl-1">
              Finalizado el {formatDateTime(s.completedAt)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Badge de asignación ──────────────────────────────────────────────────────

function AssignmentBadge({ status }: { status: WorkOrderServiceAssignmentStatus }) {
  const config = {
    [WorkOrderServiceAssignmentStatus.Unassigned]: {
      icon: <Clock className="w-3 h-3" />,
      cls: "bg-gray-100 text-gray-600 border-gray-200",
    },
    [WorkOrderServiceAssignmentStatus.Pending]: {
      icon: <Clock className="w-3 h-3" />,
      cls: "bg-amber-50 text-amber-700 border-amber-200",
    },
    [WorkOrderServiceAssignmentStatus.Accepted]: {
      icon: <PlayCircle className="w-3 h-3" />,
      cls: "bg-blue-50 text-blue-700 border-blue-200",
    },
    [WorkOrderServiceAssignmentStatus.Completed]: {
      icon: <CheckCircle2 className="w-3 h-3" />,
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${config.cls}`}
    >
      {config.icon}
      {AssignmentStatusLabel[status]}
    </span>
  );
}
