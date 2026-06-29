"use client";

import { useState } from "react";
import { BellRing } from "lucide-react";

import { MaintenanceAlertItemInput, MaintenanceAlertType, MaintenanceAlertTypeLabel } from "@/types/api.types";
import { isFactoryMilestone } from "@/lib/maintenance-baseline";
import { FactoryMilestoneField } from "@/components/vehicle-maintenance/FactoryMilestoneField";
import { MAINTENANCE_ALERT_PRESETS } from "./maintenance-presets";
import { Section, StepNav } from "./ui";

interface Props {
  ownerLabel?: string;
  /** Km actual del vehículo (del paso anterior) — base del cálculo "desde fábrica". */
  currentMileage: number;
  /** Si el usuario ya pasó por este paso, sus elecciones (solo las activas). */
  defaultItems?: MaintenanceAlertItemInput[];
  onNext: (items: MaintenanceAlertItemInput[]) => void;
  onBack: () => void;
}

type RowState = { enabled: boolean; km: string; months: string; lastService: string };

function toPosIntOrNull(s: string): number | null {
  const t = s.trim();
  if (t === "") return null;
  const n = Math.round(Number(t));
  return Number.isFinite(n) && n > 0 ? n : null;
}

const inputCls =
  "w-full px-3 py-2 text-sm rounded-lg border border-[#c4c6cd] bg-white text-[#041627] " +
  "placeholder:text-[#44474c]/40 focus:outline-none focus:ring-2 focus:ring-[#041627]/20 " +
  "focus:border-[#041627] transition-all disabled:bg-[#f4f6f8] disabled:text-[#44474c]/40";

/**
 * Paso del ingreso donde el recepcionista, con su criterio mecánico, elige y configura
 * las alertas de mantenimiento del vehículo: cada una por km y/o tiempo. El sistema solo
 * guarda esos umbrales — no calcula según motor/combustible. Se muestra antes de las fotos.
 */
export function StepMaintenanceAlerts({ ownerLabel, currentMileage, defaultItems, onNext, onBack }: Props) {
  const [rows, setRows] = useState<Record<number, RowState>>(() => {
    const visited = defaultItems !== undefined;
    const map: Record<number, RowState> = {};
    for (const p of MAINTENANCE_ALERT_PRESETS) {
      const existing = defaultItems?.find((i) => i.itemType === p.type);
      if (existing) {
        map[p.type] = {
          enabled:     true,
          km:          existing.intervalKm         != null ? String(existing.intervalKm)         : "",
          months:      existing.intervalMonths     != null ? String(existing.intervalMonths)     : "",
          lastService: existing.lastServiceMileage != null ? String(existing.lastServiceMileage) : "",
        };
      } else {
        map[p.type] = {
          // En una revisita respetamos que lo hayan destildado; en la 1ª vez, el preset.
          enabled:     visited ? false : p.defaultEnabled,
          km:          p.defaultKm     != null ? String(p.defaultKm)     : "",
          months:      p.defaultMonths != null ? String(p.defaultMonths) : "",
          lastService: "",
        };
      }
    }
    return map;
  });

  const [error, setError] = useState<string | null>(null);

  function update(type: MaintenanceAlertType, patch: Partial<RowState>) {
    setRows((prev) => ({ ...prev, [type]: { ...prev[type], ...patch } }));
    if (error) setError(null);
  }

  function handleNext() {
    const invalid = MAINTENANCE_ALERT_PRESETS.filter(
      (p) =>
        rows[p.type].enabled &&
        toPosIntOrNull(rows[p.type].km) === null &&
        toPosIntOrNull(rows[p.type].months) === null,
    );
    if (invalid.length > 0) {
      setError(
        `Completá km y/o tiempo en: ${invalid
          .map((p) => MaintenanceAlertTypeLabel[p.type])
          .join(", ")}.`,
      );
      return;
    }

    // El "último cambio" no puede superar el km actual del vehículo.
    const badLast = MAINTENANCE_ALERT_PRESETS.filter((p) => {
      const last = toPosIntOrNull(rows[p.type].lastService);
      return rows[p.type].enabled && last !== null && last > currentMileage;
    });
    if (badLast.length > 0) {
      setError(
        `El "último cambio" no puede superar el km actual (${currentMileage.toLocaleString(
          "es-AR",
        )} km) en: ${badLast.map((p) => MaintenanceAlertTypeLabel[p.type]).join(", ")}.`,
      );
      return;
    }

    const items: MaintenanceAlertItemInput[] = MAINTENANCE_ALERT_PRESETS
      .filter((p) => rows[p.type].enabled)
      .map((p) => ({
        itemType:       p.type,
        intervalKm:     toPosIntOrNull(rows[p.type].km),
        intervalMonths: toPosIntOrNull(rows[p.type].months),
        // Solo tiene sentido para ítems "desde fábrica"; el resto lo ignora el backend.
        lastServiceMileage: isFactoryMilestone(p.type)
          ? toPosIntOrNull(rows[p.type].lastService)
          : null,
      }));

    onNext(items);
  }

  return (
    <div className="space-y-6">
      {ownerLabel && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#041627]/5 border border-[#041627]/10">
          <BellRing className="w-3.5 h-3.5 text-[#fea520]" />
          <span className="text-xs text-[#44474c]">Alertas que verá el cliente para</span>
          <span className="text-xs font-semibold text-[#041627]">{ownerLabel}</span>
        </div>
      )}

      <Section title="Alertas de mantenimiento">
        <p className="text-xs text-[#44474c]/80 -mt-1">
          Elegí de qué avisar al cliente y cada cuánto: por <strong>kilómetros</strong>,
          por <strong>tiempo</strong>, o ambos (lo que llegue primero dispara la alerta).
          Podés ajustar los valores sugeridos.
        </p>

        <div className="space-y-2">
          {MAINTENANCE_ALERT_PRESETS.map((p) => {
            const row = rows[p.type];
            return (
              <div
                key={p.type}
                className={`rounded-lg border px-3 py-3 transition-colors ${
                  row.enabled ? "border-[#fea520]/50 bg-[#fea520]/[0.04]" : "border-[#c4c6cd] bg-white"
                }`}
              >
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={row.enabled}
                    onChange={(e) => update(p.type, { enabled: e.target.checked })}
                    className="accent-[#fea520] w-4 h-4"
                  />
                  <span className="text-sm font-semibold text-[#041627]">
                    {MaintenanceAlertTypeLabel[p.type]}
                  </span>
                </label>

                {row.enabled && (
                  <div className="grid grid-cols-2 gap-2 mt-2.5 pl-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#44474c]/70">
                        Cada (km)
                      </label>
                      <input
                        type="number" min={0} inputMode="numeric" placeholder="Ej: 10000"
                        className={inputCls}
                        value={row.km}
                        onChange={(e) => update(p.type, { km: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#44474c]/70">
                        Cada (meses)
                      </label>
                      <input
                        type="number" min={0} inputMode="numeric" placeholder="Ej: 6"
                        className={inputCls}
                        value={row.months}
                        onChange={(e) => update(p.type, { months: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {row.enabled && isFactoryMilestone(p.type) && (
                  <div className="pl-6">
                    <FactoryMilestoneField
                      type={p.type}
                      intervalKm={toPosIntOrNull(row.km)}
                      currentMileage={currentMileage}
                      value={row.lastService}
                      onChange={(v) => update(p.type, { lastService: v })}
                      inputCls={inputCls}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </Section>

      <StepNav onBack={onBack} onNext={handleNext} nextLabel="Siguiente" />
    </div>
  );
}
