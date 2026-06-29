import { Factory } from "lucide-react";

import { MaintenanceAlertType } from "@/types/api.types";
import { previewFactoryNextDue } from "@/lib/maintenance-baseline";

function toPosIntOrNull(s: string): number | null {
  const t = s.trim();
  if (t === "") return null;
  const n = Math.round(Number(t));
  return Number.isFinite(n) && n > 0 ? n : null;
}

interface Props {
  type:           MaintenanceAlertType;
  /** Intervalo de km ya tipeado en la fila (string del input → number|null). */
  intervalKm:     number | null;
  currentMileage: number;
  /** Km del último cambio (controlado, como string). "" = no sé / desde fábrica. */
  value:          string;
  onChange:       (v: string) => void;
  inputCls:       string;
}

/**
 * Bloque que aparece bajo una alerta "desde fábrica" (transmisión, distribución, etc.).
 * Explica por qué se mide distinto, deja cargar opcionalmente el último cambio, y muestra
 * en vivo en qué km va a avisar — para que el recepcionista no se lleve sorpresas. El
 * cálculo real lo hace el backend; esto lo espeja vía lib/maintenance-baseline.
 */
export function FactoryMilestoneField({
  type, intervalKm, currentMileage, value, onChange, inputCls,
}: Props) {
  const last = toPosIntOrNull(value);
  const over = last != null && last > currentMileage;
  const preview = previewFactoryNextDue(type, intervalKm, currentMileage, over ? null : last);

  return (
    <div className="mt-2.5 rounded-lg border border-[#fea520]/40 bg-[#fea520]/[0.06] p-2.5 space-y-2">
      <div className="flex items-start gap-2">
        <Factory className="w-3.5 h-3.5 text-[#865300] mt-0.5 shrink-0" />
        <p className="text-[11px] leading-snug text-[#865300]">
          Se mide <strong>desde fábrica</strong>. Sin el último cambio, avisa en el próximo
          múltiplo de km. Si el cliente sabe a qué km se hizo, cargalo y el aviso se ajusta.
        </p>
      </div>

      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:gap-2.5">
        <div className="space-y-1 sm:w-48 sm:shrink-0">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#865300]/80">
            Último cambio (km) · opcional
          </label>
          <input
            type="number" min={0} inputMode="numeric"
            placeholder="No sé / desde fábrica"
            className={inputCls}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>

        <div className="flex-1 min-w-0 sm:pb-1.5">
          {over ? (
            <p className="text-[11px] text-red-600">
              No puede superar el km actual ({currentMileage.toLocaleString("es-AR")} km).
            </p>
          ) : preview ? (
            <p className="text-[11px] text-[#865300]">
              Avisará a los <strong>{preview.nextDueKm.toLocaleString("es-AR")} km</strong>
              {preview.kmRemaining > 0 ? (
                <> · faltan {preview.kmRemaining.toLocaleString("es-AR")} km</>
              ) : (
                <> · ya corresponde el cambio</>
              )}
              <span className="text-[#44474c]/60">
                {preview.fromFactory ? " (desde fábrica)" : " (según el último cambio)"}
              </span>
            </p>
          ) : (
            <p className="text-[11px] text-[#44474c]/60">
              Cargá el intervalo en km para ver cuándo avisará.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
