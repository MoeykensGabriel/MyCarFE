"use client";

import { useState } from "react";
import { ClipboardPaste, CheckCircle2, AlertTriangle } from "lucide-react";

interface Props {
  /** Etiqueta de las columnas esperadas, ej: "código · descripción · precio" */
  columnsHint: string;
  /** Recibe el texto crudo pegado; devuelve null si se pudo usar, o un mensaje de error. */
  onPaste: (text: string) => string | null;
}

/**
 * Zona de pegado desde la planilla del jefe: la oficina copia la fila en Excel
 * y la pega acá — sin tipear. El parseo lo hace el caller (repuesto o servicio).
 */
export function PasteFromSheetZone({ columnsHint, onPaste }: Props) {
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  return (
    <div className="space-y-1">
      <div
        className="flex items-center gap-2 rounded-md border-2 border-dashed border-[#c4c6cd] bg-[#eefcfd]/60 px-3 py-2.5 focus-within:border-[#041627] transition-colors"
      >
        <ClipboardPaste className="w-4 h-4 text-[#44474c]/60 shrink-0" />
        <input
          type="text"
          value=""
          onChange={() => { /* solo pegado — el tipeo se ignora a propósito */ }}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData("text");
            const error = onPaste(text);
            setStatus(error ? { ok: false, msg: error } : { ok: true, msg: "Fila cargada — revisá y confirmá." });
          }}
          placeholder={`Pegá acá la fila del Excel (${columnsHint})`}
          className="flex-1 bg-transparent text-sm placeholder:text-[#44474c]/50 focus:outline-none"
        />
      </div>
      {status && (
        <p className={`flex items-center gap-1.5 text-xs ${status.ok ? "text-green-700" : "text-red-600"}`}>
          {status.ok
            ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
          {status.msg}
        </p>
      )}
    </div>
  );
}
