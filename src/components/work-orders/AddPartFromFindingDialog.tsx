"use client";

import { AlertTriangle, User } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InspectionReport } from "@/types/api.types";
import { useAddWorkOrderPart } from "@/hooks/useWorkOrders";
import { PartForm } from "./PartForm";

interface Props {
  workOrderId: string;
  finding: InspectionReport;
  open: boolean;
  onClose: () => void;
}

/**
 * Dialog para crear un repuesto a partir de un hallazgo.
 * El PartForm no tiene campo descripción/justificación — la conexión al finding
 * queda implícita en el contexto del dialog. El admin completa name + precio.
 */
export function AddPartFromFindingDialog({
  workOrderId,
  finding,
  open,
  onClose,
}: Props) {
  const { mutate: addPart, isPending } = useAddWorkOrderPart(workOrderId);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !isPending && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear repuesto desde la novedad</DialogTitle>
          <DialogDescription>
            Cargá el repuesto que hace falta para resolver esta novedad. Si tiene
            código de proveedor, se va a pedir al depósito al aprobar el presupuesto.
          </DialogDescription>
        </DialogHeader>

        {/* Card readonly con el finding como contexto */}
        <div className="rounded-md border border-red-200 bg-red-50/50 px-3 py-2.5 space-y-1.5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-700 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-red-700">
              {finding.areaName}
            </span>
            {finding.mechanicFullName && (
              <span className="text-xs text-gray-600 inline-flex items-center gap-1">
                <User className="w-3 h-3" />
                {finding.mechanicFullName}
              </span>
            )}
          </div>
          {finding.findings && (
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
              {finding.findings}
            </p>
          )}
        </div>

        <PartForm
          submitLabel="Crear repuesto"
          submitting={isPending}
          onCancel={onClose}
          onSubmit={(values) => {
            addPart(
              {
                workOrderId,
                productCode: values.productCode || undefined,
                name:        values.name,
                unitPrice:   values.unitPrice,
                quantity:    values.quantity,
              },
              { onSuccess: onClose },
            );
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
