"use client";

import { useState } from "react";
import { ClipboardPaste, Pencil } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { workOrdersService } from "@/services/work-orders.service";
import { useAddWorkOrderPart } from "@/hooks/useWorkOrders";
import { formatCurrency } from "@/lib/format";
import { parsePartRow, parsePartRows, ParsedPartRow } from "@/lib/paste-parse";
import { PartForm, PartFormValues } from "./PartForm";
import { PasteFromSheetZone } from "./PasteFromSheetZone";
import { BulkPastePanel } from "./BulkPastePanel";
import { SegmentedTabs, SegmentedTab } from "./SegmentedTabs";

interface Props {
  workOrderId: string;
  open: boolean;
  onClose: () => void;
}

type Tab = "manual" | "sheet";

const TABS: SegmentedTab<Tab>[] = [
  { id: "manual", label: "Manual",         icon: <Pencil className="w-3.5 h-3.5" /> },
  { id: "sheet",  label: "Desde planilla", icon: <ClipboardPaste className="w-3.5 h-3.5" /> },
];

/**
 * Alta de repuestos al presupuesto: uno a mano (con la opción de pegar su fila del
 * Excel para prellenar) o varios de una desde la planilla.
 */
export function AddPartDialog({ workOrderId, open, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("manual");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar repuesto</DialogTitle>
          <DialogDescription>
            Uno a mano o varios de una desde la planilla del jefe.
          </DialogDescription>
        </DialogHeader>

        <SegmentedTabs tabs={TABS} current={tab} onChange={setTab} />

        {tab === "manual" && <ManualPartTab workOrderId={workOrderId} onClose={onClose} />}

        {tab === "sheet" && (
          <BulkPastePanel<ParsedPartRow>
            workOrderId={workOrderId}
            columnsHint="código · descripción · precio"
            parse={parsePartRows}
            itemNoun={["repuesto", "repuestos"]}
            renderPreview={(data) => (
              <>
                <span className="font-mono text-xs text-[#44474c] w-28 truncate shrink-0">
                  {data.productCode ?? "— sin código —"}
                </span>
                <span className="flex-1 min-w-0 truncate" title={data.name}>
                  {data.name}
                </span>
                <span className="tabular-nums font-semibold shrink-0">
                  {formatCurrency(data.unitPrice)}
                </span>
              </>
            )}
            onAdd={async (data, quantity) => {
              await workOrdersService.addPart(workOrderId, {
                workOrderId,
                productCode: data.productCode ?? undefined,
                name:        data.name,
                unitPrice:   data.unitPrice,
                quantity,
              });
            }}
            onDone={onClose}
            onCancel={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Pestaña manual ───────────────────────────────────────────────────────────

function ManualPartTab({ workOrderId, onClose }: { workOrderId: string; onClose: () => void }) {
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

  return (
    <div className="space-y-3">
      {/* Pegado de una fila desde la planilla del jefe — la oficina no tipea */}
      <PasteFromSheetZone
        columnsHint="código · descripción · precio"
        onPaste={handlePaste}
      />

      <PartForm
        key={formKey}
        initial={prefill}
        submitLabel="Agregar"
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
    </div>
  );
}
