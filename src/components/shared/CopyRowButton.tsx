"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

import { copyText } from "@/lib/clipboard";

/**
 * Botón chico para copiar una fila de ítem (TSV) al portapapeles, para pegar en la
 * planilla de comisiones. `label` solo afecta el tooltip/aria.
 */
export function CopyRowButton({ text, label = "ítem" }: { text: string; label?: string }) {
  async function handleCopy() {
    const ok = await copyText(text);
    if (ok) toast.success("Copiado — pegalo en tu planilla");
    else toast.error("No se pudo copiar");
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-muted-foreground hover:text-[#041627] transition-colors"
      title={`Copiar ${label} para la planilla`}
      aria-label={`Copiar ${label}`}
    >
      <Copy className="w-3.5 h-3.5" />
    </button>
  );
}
