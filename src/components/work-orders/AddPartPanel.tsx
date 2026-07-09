"use client";

import { useState } from "react";
import { Plus, ClipboardPaste } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAddWorkOrderPart } from "@/hooks/useWorkOrders";
import { parsePartRow } from "@/lib/paste-parse";
import { PartForm, PartFormValues } from "./PartForm";
import { PasteFromSheetZone } from "./PasteFromSheetZone";
import { BulkPastePartsDialog } from "./BulkPastePartsDialog";

interface Props {
  workOrderId: string;
}

export function AddPartPanel({ workOrderId }: Props) {
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const { mutate: addPart, isPending } = useAddWorkOrderPart(workOrderId);

  // Fila pegada desde el Excel del jefe → prellenar el form (remount por key).
  const [prefill, setPrefill] = useState<Partial<PartFormValues> | undefined>();
  const [formKey, setFormKey] = useState(0);

  function handlePaste(text: string): string | null {
    const firstRow = text.split(/\r?\n/).find((r) => r.trim().length > 0) ?? "";
    const result = parsePartRow(firstRow);
    if (result.error || !result.data) return result.error ?? "No se pudo leer la fila.";
    setPrefill({
      productCode: result.data.productCode ?? "",
      name:        result.data.name,
      unitPrice:   result.data.unitPrice,
      quantity:    1,
    });
    setFormKey((k) => k + 1);
    return null;
  }

  if (!open) {
    return (
      <div className="pt-4 mt-2 border-t space-y-2">
        <Button
          size="sm"
          onClick={() => setOpen(true)}
          className="w-full bg-[#041627] hover:bg-[#0a2947] text-white hover:text-[#fea520] transition-all duration-300 font-bold shadow-sm flex items-center justify-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Agregar repuesto
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setBulkOpen(true)}
          className="w-full flex items-center justify-center gap-1.5 font-bold"
        >
          <ClipboardPaste className="w-4 h-4" />
          Pegar repuestos desde planilla
        </Button>

        <BulkPastePartsDialog
          workOrderId={workOrderId}
          open={bulkOpen}
          onClose={() => setBulkOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="pt-4 mt-2 border-t space-y-3">
      {/* Pegado desde la planilla del jefe — la oficina no tipea */}
      <PasteFromSheetZone
        columnsHint="código · descripción · precio"
        onPaste={handlePaste}
      />

      <PartForm
        key={formKey}
        initial={prefill}
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
