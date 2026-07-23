"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, AlertTriangle, ClipboardPaste } from "lucide-react";

import { Button } from "@/components/ui/button";
import { workOrderKeys } from "@/hooks/useWorkOrders";
import { RowResult } from "@/lib/paste-parse";

interface Props<T> {
  workOrderId: string;
  /** Columnas esperadas, ej: "código · descripción · precio". */
  columnsHint: string;
  parse: (text: string) => RowResult<T>[];
  /** Celdas de la vista previa de una fila válida (la cantidad la agrega el panel). */
  renderPreview: (data: T) => React.ReactNode;
  /** Alta de una fila. Se llama una por una, en orden. */
  onAdd: (data: T, quantity: number) => Promise<void>;
  /** Nombre del ítem para los mensajes: ["repuesto", "repuestos"]. */
  itemNoun: [singular: string, plural: string];
  /** Se llama cuando el lote se cargó completo (el modal lo usa para cerrarse). */
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Pegado masivo desde la planilla del jefe: la oficina copia N filas del Excel,
 * las pega, revisa la vista previa y confirma — se cargan todas de una sin tipear.
 * Cantidad por defecto 1, editable por fila antes de confirmar.
 *
 * Genérico entre repuestos y servicios: lo único que cambia es el parseo, cómo se
 * ve cada fila y con qué endpoint se da de alta.
 */
export function BulkPastePanel<T>({
  workOrderId,
  columnsHint,
  parse,
  renderPreview,
  onAdd,
  itemNoun,
  onDone,
  onCancel,
}: Props<T>) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<RowResult<T>[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const validRows = rows.filter((r) => r.data !== null);
  const errorRows = rows.filter((r) => r.error !== null);
  const [singular, plural] = itemNoun;

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
        await onAdd(row.data, quantities[i] ?? 1);
        created++;
      }
      toast.success(`${created} ${created === 1 ? singular : plural} agregados al presupuesto`);
      reset();
      onDone();
    } catch {
      toast.error(
        created > 0
          ? `Se agregaron ${created} y falló el siguiente — revisá el presupuesto y volvé a pegar los que faltan.`
          : `No se pudieron agregar los ${plural}.`,
      );
    } finally {
      // Refresca detalle y listados pase lo que pase (altas parciales incluidas).
      queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(workOrderId) });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() });
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Copiá las filas en el Excel del jefe ({columnsHint}) y pegalas acá. Revisá la vista
        previa y confirmá — se cargan todas juntas al presupuesto.
      </p>

      {/* Zona de pegado */}
      <div className="flex items-start gap-2 rounded-md border-2 border-dashed border-[#c4c6cd] bg-[#eefcfd]/60 px-3 py-2.5 focus-within:border-[#041627] transition-colors">
        <ClipboardPaste className="w-4 h-4 text-[#44474c]/60 shrink-0 mt-1" />
        <textarea
          rows={rows.length === 0 ? 4 : 2}
          value=""
          onChange={() => { /* solo pegado — el tipeo se ignora a propósito */ }}
          onPaste={(e) => {
            e.preventDefault();
            setRows(parse(e.clipboardData.getData("text")));
            setQuantities({});
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

          <ul className="divide-y divide-gray-200 rounded-md border max-h-64 overflow-y-auto">
            {rows.map((row, i) => (
              <li key={i} className="px-3 py-2 flex items-center gap-3 text-sm">
                {row.data ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    {renderPreview(row.data)}
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
        <Button variant="outline" size="sm" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button size="sm" onClick={handleConfirm} disabled={validRows.length === 0 || submitting}>
          {submitting
            ? "Agregando..."
            : `Agregar ${validRows.length} ${validRows.length === 1 ? singular : plural}`}
        </Button>
      </div>
    </div>
  );
}
