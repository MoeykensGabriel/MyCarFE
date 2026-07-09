"use client";

import { useState } from "react";
import { AlertTriangle, User } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InspectionReport } from "@/types/api.types";
import { parseServiceRow } from "@/lib/paste-parse";
import { AdHocServiceForm, AdHocServiceFormInitial } from "./AdHocServiceForm";
import { PasteFromSheetZone } from "./PasteFromSheetZone";

interface Props {
  workOrderId: string;
  finding: InspectionReport;
  open: boolean;
  onClose: () => void;
}

/**
 * Dialog para crear un servicio puntual a partir de un hallazgo de inspección.
 * Muestra el finding como contexto arriba y prellenar la descripción del form
 * para que el admin solo tenga que poner nombre + precio.
 */
export function AddServiceFromFindingDialog({
  workOrderId,
  finding,
  open,
  onClose,
}: Props) {
  // Prellenar descripción con: texto del finding + atribución (área + mecánico).
  // El nombre lo escribe el admin — el finding suele ser muy largo para usarlo como title.
  const attribution = [
    finding.areaName,
    finding.mechanicFullName ? `reportado por ${finding.mechanicFullName}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const prefilledDescription = finding.findings
    ? `${finding.findings}\n\n— ${attribution}`
    : `Novedad en ${attribution}`;

  // Fila pegada desde el Excel del jefe → prellenar el form (remount por key).
  // Si el Excel trae descripción propia, pisa la del finding (es la redacción oficial);
  // si no trae, se conserva el reporte del mecánico.
  const [prefill, setPrefill] = useState<AdHocServiceFormInitial>({
    description: prefilledDescription,
  });
  const [formKey, setFormKey] = useState(0);

  function handlePaste(text: string): string | null {
    const firstRow = text.split(/\r?\n/).find((r) => r.trim().length > 0) ?? "";
    const result = parseServiceRow(firstRow);
    if (result.error || !result.data) return result.error ?? "No se pudo leer la fila.";
    setPrefill({
      name:        result.data.name,
      description: result.data.description || prefilledDescription,
      price:       result.data.price,
      quantity:    1,
    });
    setFormKey((k) => k + 1);
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear servicio desde la novedad</DialogTitle>
          <DialogDescription>
            Se crea un servicio puntual (ad-hoc) en esta orden. .
          </DialogDescription>
        </DialogHeader>

        {/* Card readonly con el finding */}
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

        {/* Pegado desde la planilla del jefe — la oficina no tipea */}
        <PasteFromSheetZone
          columnsHint="nombre · descripción · precio"
          onPaste={handlePaste}
        />

        <AdHocServiceForm
          key={formKey}
          workOrderId={workOrderId}
          initial={prefill}
          onSuccess={onClose}
          onCancel={onClose}
          submitLabel="Crear servicio"
        />
      </DialogContent>
    </Dialog>
  );
}
