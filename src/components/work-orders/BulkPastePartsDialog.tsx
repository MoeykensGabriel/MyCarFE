"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, AlertTriangle, ClipboardPaste } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { workOrdersService } from "@/services/work-orders.service";
import { workOrderKeys } from "@/hooks/useWorkOrders";
import { formatCurrency } from "@/lib/format";
import { parsePartRows, RowResult, ParsedPartRow } from "@/lib/paste-parse";

interface Props {
  workOrderId: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Pegado masivo de repuestos desde la planilla del jefe.
 * La oficina copia N filas del Excel (código | descripción | precio), las pega,
 * revisa la vista previa y confirma — se crean todos los repuestos del presupuesto
 * sin tipear nada. Cantidad por defecto 1, editable por fila antes de confirmar.
 */
export function BulkPastePartsDialog({ workOrderId, open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<RowResult<ParsedPartRow>[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const validRows = rows.filter((r) => r.data !== null);
  const errorRows = rows.filter((r) => r.error !== null);

  function handlePaste(text: string) {
    const parsed = parsePartRows(text);
    setRows(parsed);
    setQuantities({});
  }

  function reset() {
    setRows([]);
    setQuantities({});
  }

  async function handleConfirm() {
    if (validRows.length === 0) return;
    setSubmitting(true);
    let created = 0;
    try {
      // Secuencial a propósito: cada alta recalcula el total de la orden en el BE.
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row.data) continue;
        await workOrdersService.addPart(workOrderId, {
          workOrderId,
          productCode: row.data.productCode ?? undefined,
          name:        row.data.name,
          unitPrice:   row.data.unitPrice,
          quantity:    quantities[i] ?? 1,
        });
        created++;
      }
      toast.success(`${created} repuestos agregados al presupuesto`);
      reset();
      onClose();
    } catch {
      toast.error(
        created > 0
          ? `Se agregaron ${created} repuestos y falló el siguiente — revisá el presupuesto y volvé a pegar los que faltan.`
          : "No se pudieron agregar los repuestos.",
      );
    } finally {
      // Refresca detalle y listados pase lo que pase (altas parciales incluidas).
      queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(workOrderId) });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() });
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !submitting && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pegar repuestos desde la planilla</DialogTitle>
          <DialogDescription>
            Copiá las filas en el Excel del jefe (código · descripción · precio) y pegalas acá.
            Revisá la vista previa y confirmá — se cargan todas juntas al presupuesto.
          </DialogDescription>
        </DialogHeader>

        {/* Zona de pegado */}
        <div className="flex items-start gap-2 rounded-md border-2 border-dashed border-[#c4c6cd] bg-[#eefcfd]/60 px-3 py-2.5 focus-within:border-[#041627] transition-colors">
          <ClipboardPaste className="w-4 h-4 text-[#44474c]/60 shrink-0 mt-1" />
          <textarea
            rows={rows.length === 0 ? 4 : 2}
            value=""
            onChange={() => { /* solo pegado — el tipeo se ignora a propósito */ }}
            onPaste={(e) => {
              e.preventDefault();
              handlePaste(e.clipboardData.getData("text"));
            }}
            placeholder="Pegá acá una o varias filas del Excel..."
            className="flex-1 bg-transparent text-sm placeholder:text-[#44474c]/50 focus:outline-none resize-none"
            disabled={submitting}
          />
        </div>

        {/* Vista previa */}
        {rows.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-[#44474c]">
                Vista previa — {validRows.length} ok
                {errorRows.length > 0 && (
                  <span className="text-red-600"> · {errorRows.length} con error</span>
                )}
              </p>
              <Button variant="ghost" size="sm" onClick={reset} disabled={submitting}>
                Limpiar
              </Button>
            </div>

            <ul className="divide-y divide-gray-200 rounded-md border">
              {rows.map((row, i) => (
                <li key={i} className="px-3 py-2 flex items-center gap-3 text-sm">
                  {row.data ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      <span className="font-mono text-xs text-[#44474c] w-28 truncate shrink-0">
                        {row.data.productCode ?? "— sin código —"}
                      </span>
                      <span className="flex-1 min-w-0 truncate" title={row.data.name}>
                        {row.data.name}
                      </span>
                      <span className="tabular-nums font-semibold shrink-0">
                        {formatCurrency(row.data.unitPrice)}
                      </span>
                      <label className="flex items-center gap-1 text-xs text-[#44474c] shrink-0">
                        ×
                        <input
                          type="number"
                          min={1}
                          max={9999}
                          value={quantities[i] ?? 1}
                          onChange={(e) =>
                            setQuantities((q) => ({ ...q, [i]: Math.max(1, parseInt(e.target.value, 10) || 1) }))
                          }
                          className="w-14 px-1.5 py-1 rounded border border-[#c4c6cd] text-sm focus:outline-none focus:ring-1 focus:ring-[#041627]"
                          disabled={submitting}
                        />
                      </label>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span className="flex-1 min-w-0 truncate font-mono text-xs text-[#44474c]" title={row.raw}>
                        {row.raw}
                      </span>
                      <span className="text-xs text-red-600 shrink-0">{row.error}</span>
                    </>
                  )}
                </li>
              ))}
            </ul>

            {errorRows.length > 0 && (
              <p className="text-xs text-[#44474c]">
                Las filas con error no se cargan — corregilas en el Excel y volvé a pegar, o cargalas a mano.
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={validRows.length === 0 || submitting}
          >
            {submitting
              ? "Agregando..."
              : `Agregar ${validRows.length} repuesto${validRows.length === 1 ? "" : "s"}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
