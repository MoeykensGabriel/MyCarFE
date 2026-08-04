"use client";

import { useState } from "react";
import { Wrench, ClipboardCheck, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WorkOrderStatus } from "@/lib/enums";
import { usePromoteToWorkOrder } from "@/hooks/useWorkOrders";
import { WorkOrder } from "@/types/api.types";

interface Props {
  order: WorkOrder;
}

/**
 * "Convertir en orden de trabajo" — visible solo en una orden de solo inspección ya cerrada.
 *
 * El cliente vio el resultado de la inspección y aceptó arreglar. La orden vuelve a
 * cotización con los hallazgos y propuestas que ya cargó el mecánico: no se re-inspecciona
 * nada ni se abre una orden nueva.
 */
export function PromoteToWorkOrderButton({ order }: Props) {
  const [open, setOpen] = useState(false);
  const { mutate: promote, isPending } = usePromoteToWorkOrder(order.id);

  const status = Number(order.currentStatus) as WorkOrderStatus;

  // El backend solo la promueve desde Completed. Mostrar el botón antes seria ofrecer
  // algo que va a fallar.
  if (!order.isInspectionOnly || status !== WorkOrderStatus.Completed) return null;

  const hallazgos = (order.inspectionReports ?? []).filter((r) => r.hasIssue).length;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-9 border-[#fea520] text-[#865300] hover:bg-[#fea520]/10"
      >
        <Wrench className="w-4 h-4 mr-1.5" />
        Convertir en orden de trabajo
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#865300]" />
              Convertir en orden de trabajo
            </DialogTitle>
            <DialogDescription>
              El cliente aceptó arreglar lo que se encontró en la inspección.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <div className="flex items-start gap-2.5 rounded-lg border border-[#c4c6cd] bg-[#eefcfd]/50 px-3 py-2.5">
              <ClipboardCheck className="w-4 h-4 text-[#041627] shrink-0 mt-0.5" />
              <p className="text-xs text-[#44474c] leading-relaxed">
                La orden vuelve a <strong className="text-[#041627]">Diagnosticando</strong> con
                todo lo que se inspeccionó. No hace falta revisar el vehículo de nuevo:{" "}
                {hallazgos > 0 ? (
                  <>
                    los <strong className="text-[#041627]">{hallazgos} hallazgo{hallazgos > 1 ? "s" : ""}</strong>{" "}
                    y las propuestas del mecánico quedan listos para armar el presupuesto.
                  </>
                ) : (
                  <>los hallazgos y propuestas cargados quedan disponibles para el presupuesto.</>
                )}
              </p>
            </div>

            <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                No tiene vuelta atrás: la orden deja de ser de solo inspección y pasa a
                seguir el circuito normal de presupuesto y aprobación.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              onClick={() => promote(undefined, { onSuccess: () => setOpen(false) })}
              disabled={isPending}
            >
              {isPending ? "Convirtiendo..." : "Convertir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
