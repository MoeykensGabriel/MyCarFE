"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateWorkOrderPart } from "@/hooks/useWorkOrders";
import { WorkOrderPart } from "@/types/api.types";
import { PartForm } from "./PartForm";

interface Props {
  workOrderId: string;
  part: WorkOrderPart;
  open: boolean;
  onClose: () => void;
}

export function EditPartDialog({ workOrderId, part, open, onClose }: Props) {
  const { mutate: updatePart, isPending } = useUpdateWorkOrderPart(workOrderId);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar repuesto</DialogTitle>
        </DialogHeader>

        <PartForm
          initial={{
            productCode: part.productCode ?? "",
            name:        part.name,
            unitPrice:   part.unitPrice,
            quantity:    part.quantity,
          }}
          submitLabel="Guardar cambios"
          submitting={isPending}
          onCancel={onClose}
          onSubmit={(values) => {
            updatePart(
              {
                partId: part.id,
                data: {
                  workOrderId,
                  partId:      part.id,
                  productCode: values.productCode || undefined,
                  name:        values.name,
                  unitPrice:   values.unitPrice,
                  quantity:    values.quantity,
                },
              },
              {
                onSuccess: () => onClose(),
              },
            );
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
