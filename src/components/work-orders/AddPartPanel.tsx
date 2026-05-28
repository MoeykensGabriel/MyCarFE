"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAddWorkOrderPart } from "@/hooks/useWorkOrders";
import { PartForm } from "./PartForm";

interface Props {
  workOrderId: string;
}

export function AddPartPanel({ workOrderId }: Props) {
  const [open, setOpen] = useState(false);
  const { mutate: addPart, isPending } = useAddWorkOrderPart(workOrderId);

  if (!open) {
    return (
      <div className="pt-4 mt-2 border-t">
        <Button
          size="sm"
          onClick={() => setOpen(true)}
          className="w-full bg-[#041627] hover:bg-[#0a2947] text-white hover:text-[#fea520] transition-all duration-300 font-bold shadow-sm flex items-center justify-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Agregar repuesto
        </Button>
      </div>
    );
  }

  return (
    <div className="pt-4 mt-2 border-t">
      <PartForm
        submitLabel="Agregar"
        submitting={isPending}
        onCancel={() => setOpen(false)}
        onSubmit={(values) => {
          addPart(
            {
              workOrderId,
              productCode: values.productCode || undefined,
              name:        values.name,
              unitPrice:   values.unitPrice,
              quantity:    values.quantity,
              tier:        values.tier,
            },
            {
              onSuccess: () => setOpen(false),
            },
          );
        }}
      />
    </div>
  );
}
