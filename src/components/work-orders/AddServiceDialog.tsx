"use client";

import { useState } from "react";
import { ClipboardPaste, ListChecks, Sparkles } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { workOrdersService } from "@/services/work-orders.service";
import { formatCurrency } from "@/lib/format";
import { parseServiceRows, ParsedServiceRow } from "@/lib/paste-parse";
import { CatalogServiceForm } from "./CatalogServiceForm";
import { AdHocServiceForm } from "./AdHocServiceForm";
import { BulkPastePanel } from "./BulkPastePanel";
import { SegmentedTabs, SegmentedTab } from "./SegmentedTabs";

interface Props {
  workOrderId: string;
  open: boolean;
  onClose: () => void;
}

type Tab = "catalog" | "adhoc" | "sheet";

const TABS: SegmentedTab<Tab>[] = [
  { id: "catalog", label: "Del catálogo",  icon: <ListChecks className="w-3.5 h-3.5" /> },
  { id: "adhoc",   label: "Puntual",       icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: "sheet",   label: "Desde planilla", icon: <ClipboardPaste className="w-3.5 h-3.5" /> },
];

/**
 * Alta de servicios al presupuesto, por las tres vías: del catálogo, puntual
 * (solo para esta orden) o pegando varias filas de la planilla del jefe.
 *
 * Vive en un modal para que la card del presupuesto muestre solo lo cargado y no
 * los formularios: el total y la condición de venta quedan siempre a la vista.
 */
export function AddServiceDialog({ workOrderId, open, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("catalog");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar servicio</DialogTitle>
          <DialogDescription>
            Del catálogo del taller, uno puntual solo para esta orden, o varios de una
            desde la planilla.
          </DialogDescription>
        </DialogHeader>

        <SegmentedTabs tabs={TABS} current={tab} onChange={setTab} />

        {tab === "catalog" && (
          <CatalogServiceForm workOrderId={workOrderId} onSuccess={onClose} />
        )}

        {tab === "adhoc" && (
          <AdHocServiceForm
            workOrderId={workOrderId}
            onSuccess={onClose}
            onCancel={onClose}
            submitLabel="Agregar"
          />
        )}

        {tab === "sheet" && (
          <BulkPastePanel<ParsedServiceRow>
            workOrderId={workOrderId}
            columnsHint="nombre · descripción · precio"
            parse={parseServiceRows}
            itemNoun={["servicio", "servicios"]}
            renderPreview={(data) => (
              <>
                <span className="flex-1 min-w-0 truncate" title={data.name}>
                  {data.name}
                  {data.description && (
                    <span className="text-muted-foreground"> — {data.description}</span>
                  )}
                </span>
                <span className="tabular-nums font-semibold shrink-0">
                  {formatCurrency(data.price)}
                </span>
              </>
            )}
            onAdd={async (data, quantity) => {
              // Pegados desde la planilla van como servicios puntuales: no están en
              // el catálogo y solo valen para esta orden.
              await workOrdersService.addAdHocService(workOrderId, {
                workOrderId,
                name:                     data.name,
                description:              data.description,
                price:                    data.price,
                estimatedDurationMinutes: 0,
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
