"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ValidTransitions, WorkOrderStatus, WorkOrderStatusConfig, PhotoType } from "@/lib/enums";
import { WorkOrder } from "@/types/api.types";
import { useUpdateWorkOrderStatus, workOrderKeys } from "@/hooks/useWorkOrders";
import { AfterPhotosUploader } from "./AfterPhotosUploader";

interface ChangeStatusModalProps {
  workOrder: WorkOrder;
  open: boolean;
  onClose: () => void;
}

export function ChangeStatusModal({ workOrder, open, onClose }: ChangeStatusModalProps) {
  const numericStatus = Number(workOrder.currentStatus) as WorkOrderStatus;
  const validNext = ValidTransitions[numericStatus] ?? [];
  const [selectedStatus, setSelectedStatus] = useState<WorkOrderStatus | "">("");
  const [note, setNote] = useState("");

  const queryClient = useQueryClient();
  const { mutate: updateStatus, isPending } = useUpdateWorkOrderStatus(workOrder.id);

  const isDelivered = selectedStatus === WorkOrderStatus.Delivered;
  const isCancelling = selectedStatus === WorkOrderStatus.Cancelled;
  const noteRequired = isCancelling;

  const hasAfterPhotos = (workOrder.photos?.filter(
    (p) =>
      Number(p.photoType) === PhotoType.After &&
      !p.workOrderServiceId &&
      !p.inspectionReportId
  ) ?? []).length > 0;

  const canSubmit =
    selectedStatus !== "" &&
    (!noteRequired || note.trim().length > 0) &&
    (!isDelivered || hasAfterPhotos);

  const handleSubmit = () => {
    if (selectedStatus === "") return;
    updateStatus(
      { workOrderId: workOrder.id, newStatus: selectedStatus, note: note.trim() || undefined },
      {
        onSuccess: () => {
          handleClose();
        },
      }
    );
  };

  const handleClose = () => {
    setSelectedStatus("");
    setNote("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className={`transition-all duration-300 max-h-[90vh] overflow-y-auto ${
        selectedStatus === WorkOrderStatus.Delivered ? "sm:max-w-xl" : "sm:max-w-md"
      }`}>
        <DialogHeader>
          <DialogTitle>Cambiar estado</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Selector de estado */}
          <div className="space-y-1.5">
            <Label>Nuevo estado</Label>
            {validNext.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Esta orden no puede cambiar de estado.
              </p>
            ) : (
              <Select
                value={selectedStatus.toString()}
                onValueChange={(v) => setSelectedStatus(Number(v) as WorkOrderStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná un estado..." />
                </SelectTrigger>
                <SelectContent>
                  {validNext.map((s) => (
                    <SelectItem key={s} value={s.toString()}>
                      {WorkOrderStatusConfig[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Nota */}
          {selectedStatus !== "" && (
            <div className="space-y-1.5">
              <Label>
                Nota{noteRequired ? <span className="text-red-500 ml-1">*</span> : " (opcional)"}
              </Label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                rows={3}
                placeholder={
                  isCancelling
                    ? "Explicá el motivo de la cancelación..."
                    : "Podés agregar una nota..."
                }
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              {noteRequired && note.trim().length === 0 && (
                <p className="text-xs text-red-500">La nota es obligatoria para cancelar.</p>
              )}
            </div>
          )}

          {/* Cargador Estructurado de Fotos para Entrega */}
          {selectedStatus === WorkOrderStatus.Delivered && (
            <div className="border-t border-slate-100 pt-4 mt-2">
              <AfterPhotosUploader
                workOrderId={workOrder.id}
                allPhotos={workOrder.photos ?? []}
                onUploaded={() => {
                  queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(workOrder.id) });
                }}
              />
              {!hasAfterPhotos && (
                <p className="text-xs text-amber-600 font-medium mt-2">
                  ⚠️ Debes subir al menos una foto de entrega para confirmar el cambio.
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isPending || validNext.length === 0}
          >
            {isPending ? "Guardando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
