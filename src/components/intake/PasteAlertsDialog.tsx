"use client";

import { useState } from "react";
import { CheckCircle2, AlertTriangle, ClipboardPaste } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MaintenanceAlertTypeLabel, MaintenanceAlertType } from "@/types/api.types";
import { parseAlertRows, AlertRowResult, ParsedAlertRow } from "@/lib/alerts-paste";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Recibe las filas válidas ya interpretadas para volcarlas al paso de alertas. */
  onApply: (rows: ParsedAlertRow[]) => void;
}

/**
 * Importación de alertas desde la planilla del dueño: copia N filas del Excel
 * (nombre | km | tiempo), las pega, revisa la vista previa y aplica. Los nombres
 * conocidos (aceite, cubiertas...) caen en su preset; el resto entra como "Otro"
 * con el nombre libre. Mismo patrón que el pegado de repuestos del presupuesto.
 */
export function PasteAlertsDialog({ open, onClose, onApply }: Props) {
  const [rows, setRows] = useState<AlertRowResult[]>([]);

  const validRows = rows.filter((r) => r.data !== null);
  const errorRows = rows.filter((r) => r.error !== null);

  function handleClose() {
    setRows([]);
    onClose();
  }

  function handleApply() {
    if (validRows.length === 0) return;
    onApply(validRows.map((r) => r.data!));
    handleClose();
  }

  function describe(d: ParsedAlertRow): string {
    const parts: string[] = [];
    if (d.intervalKm != null) parts.push(`cada ${d.intervalKm.toLocaleString("es-AR")} km`);
    if (d.intervalMonths != null)
      parts.push(
        d.intervalMonths % 12 === 0 && d.intervalMonths >= 12
          ? `cada ${d.intervalMonths / 12} año${d.intervalMonths > 12 ? "s" : ""}`
          : `cada ${d.intervalMonths} meses`,
      );
    return parts.join(" · ");
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90dvh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardPaste className="w-4 h-4 text-[#fea520]" />
            Pegar alertas desde la planilla
          </DialogTitle>
          <DialogDescription>
            Copiá las filas del Excel — columnas: <strong>nombre · kilometraje · tiempo</strong>{" "}
            (el tiempo en meses o años) — y pegalas acá.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 overflow-y-auto flex-1 min-h-0">
          <textarea
            rows={4}
            placeholder={"Aceite\t10000\t6 meses\nCorrea distribución\t60000\t5 años"}
            className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-[#c4c6cd] bg-[#eefcfd]/40 placeholder:text-[#44474c]/40 focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627]"
            onChange={(e) => setRows(parseAlertRows(e.target.value))}
          />

          {rows.length > 0 && (
            <div className="space-y-1.5">
              {validRows.map((r, i) => (
                <div
                  key={`ok-${i}`}
                  className="flex items-start gap-2 rounded-md bg-green-50 border border-green-200 px-3 py-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-green-900">
                    <span className="font-bold">
                      {r.data!.type === MaintenanceAlertType.Other
                        ? r.data!.title
                        : MaintenanceAlertTypeLabel[r.data!.type]}
                    </span>{" "}
                    — {describe(r.data!)}
                    {r.data!.type === MaintenanceAlertType.Other && (
                      <span className="text-green-700/70"> (personalizada)</span>
                    )}
                  </p>
                </div>
              ))}
              {errorRows.map((r, i) => (
                <div
                  key={`err-${i}`}
                  className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-800">
                    <span className="font-mono">{r.raw.slice(0, 60)}</span> — {r.error}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleApply} disabled={validRows.length === 0}>
            Aplicar {validRows.length > 0 ? `${validRows.length} alerta${validRows.length > 1 ? "s" : ""}` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
