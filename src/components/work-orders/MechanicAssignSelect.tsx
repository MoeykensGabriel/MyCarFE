"use client";

import { useState } from "react";
import { ChevronDown, Loader2, User2, X } from "lucide-react";

import { useAdminMechanics } from "@/hooks/useAdminMechanics";
import {
  useAssignMechanic,
  useUnassignMechanic,
} from "@/hooks/useWorkOrders";
import { WorkOrderServiceAssignmentStatus } from "@/lib/enums";

interface MechanicAssignSelectProps {
  workOrderId:           string;
  workOrderServiceId:    string;
  assignedMechanicId?:   string | null;
  assignedMechanicName?: string | null;
  assignmentStatus:      WorkOrderServiceAssignmentStatus;
  /**
   * Si es true, el control queda solo de lectura (mostrando el mecánico
   * actual sin posibilidad de cambiarlo). Útil cuando la WO está en estado
   * terminal o el servicio ya está Completed.
   */
  readOnly?: boolean;
}

export function MechanicAssignSelect({
  workOrderId,
  workOrderServiceId,
  assignedMechanicId,
  assignedMechanicName,
  assignmentStatus,
  readOnly = false,
}: MechanicAssignSelectProps) {
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useAdminMechanics({
    isActive: true,
    pageSize: 100,
  });
  const mechanics = data?.items ?? [];

  const assignMutation   = useAssignMechanic(workOrderId);
  const unassignMutation = useUnassignMechanic(workOrderId);

  const isCompleted =
    assignmentStatus === WorkOrderServiceAssignmentStatus.Completed;
  const disabled = readOnly || isCompleted;
  const isPending = assignMutation.isPending || unassignMutation.isPending;

  // ── Vista solo lectura ─────────────────────────────────────────────────────
  if (disabled) {
    if (!assignedMechanicId) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 italic">
          Sin mecánico
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-gray-600">
        <User2 className="w-3 h-3" />
        {assignedMechanicName ?? "—"}
      </span>
    );
  }

  // ── Editable ───────────────────────────────────────────────────────────────

  function handleSelect(mechanicId: string) {
    setOpen(false);
    if (mechanicId === assignedMechanicId) return;
    assignMutation.mutate({ workOrderServiceId, mechanicId });
  }

  function handleUnassign(e: React.MouseEvent) {
    e.stopPropagation();
    unassignMutation.mutate(workOrderServiceId);
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] transition-colors disabled:opacity-50 ${
          assignedMechanicId
            ? "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
            : "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
        }`}
      >
        {isPending ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <User2 className="w-3 h-3" />
        )}
        <span className="font-medium">
          {assignedMechanicName ?? "Asignar mecánico"}
        </span>
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </button>

      {/* Botón quitar (solo si hay asignación) */}
      {assignedMechanicId && !isPending && (
        <button
          type="button"
          onClick={handleUnassign}
          onMouseDown={(e) => e.preventDefault()}
          title="Quitar asignación"
          className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors align-middle"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-56 rounded-md border bg-white shadow-lg max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="px-3 py-2 text-xs text-gray-500">
              Cargando mecánicos...
            </div>
          ) : mechanics.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-500">
              No hay mecánicos activos.
            </div>
          ) : (
            mechanics.map((m) => {
              const isSelected = m.id === assignedMechanicId;
              return (
                <button
                  key={m.id}
                  type="button"
                  onMouseDown={() => handleSelect(m.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left border-b last:border-0 transition-colors ${
                    isSelected
                      ? "bg-amber-50 text-amber-900 font-medium"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <span className="truncate">
                    {m.firstName} {m.lastName}
                  </span>
                  {m.specialty && (
                    <span className="ml-2 text-[10px] text-gray-400 truncate">
                      {m.specialty}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
