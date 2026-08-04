import { ClipboardCheck } from "lucide-react";

/**
 * Marca una orden que entró como SOLO INSPECCIÓN: el cliente quería saber qué tiene el
 * vehículo, no arreglarlo.
 *
 * Se muestra mientras siga siéndolo. Una vez promovida a orden de trabajo deja de tener
 * sentido en el encabezado — ahí pasa a ser un dato histórico y no el estado actual.
 *
 * Misma gramática visual que LateFindingBadge para que el listado se lea parejo.
 */
export function InspectionOnlyBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-bold uppercase tracking-wider bg-[#fea520]/15 border border-[#fea520]/40 text-[#865300] shrink-0 ${
        compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"
      }`}
      title="El cliente solo pidió saber qué tiene el vehículo — no se presupuesta ni se arregla"
    >
      <ClipboardCheck className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />
      Solo inspección
    </span>
  );
}
