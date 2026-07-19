"use client";

import { useState } from "react";
import { BellRing, ClipboardPaste, Trash2 } from "lucide-react";

import { MaintenanceAlertItemInput, MaintenanceAlertType, MaintenanceAlertTypeLabel } from "@/types/api.types";
import { isFactoryMilestone } from "@/lib/maintenance-baseline";
import { ParsedAlertRow } from "@/lib/alerts-paste";
import { FactoryMilestoneField } from "@/components/vehicle-maintenance/FactoryMilestoneField";
import { MAINTENANCE_ALERT_PRESETS } from "./maintenance-presets";
import { PasteAlertsDialog } from "./PasteAlertsDialog";
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

/** Alerta "Otro" con nombre libre — típicamente importada de la planilla del dueño. */
type CustomRow = { title: string; km: string; months: string };

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

  // Alertas "Otro" (nombre libre): rehidratadas de una revisita del paso, o
  // importadas de la planilla vía el diálogo de pegado.
  const [customs, setCustoms] = useState<CustomRow[]>(() =>
    (defaultItems ?? [])
      .filter((i) => i.itemType === MaintenanceAlertType.Other)
      .map((i) => ({
        title:  i.title ?? "",
        km:     i.intervalKm     != null ? String(i.intervalKm)     : "",
        months: i.intervalMonths != null ? String(i.intervalMonths) : "",
      })),
  );

  const [pasteOpen, setPasteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(type: MaintenanceAlertType, patch: Partial<RowState>) {
    setRows((prev) => ({ ...prev, [type]: { ...prev[type], ...patch } }));
    if (error) setError(null);
  }

  function updateCustom(index: number, patch: Partial<CustomRow>) {
    setCustoms((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
    if (error) setError(null);
  }

  /** Vuelca las filas pegadas: tipos conocidos activan su preset; el resto suma a "Otras". */
  function applyPasted(pasted: ParsedAlertRow[]) {
    for (const row of pasted) {
      if (row.type !== MaintenanceAlertType.Other) {
        // La planilla manda: si una columna vino vacía, queda vacía (no el default).
        update(row.type, {
          enabled: true,
          km:      row.intervalKm     != null ? String(row.intervalKm)     : "",
          months:  row.intervalMonths != null ? String(row.intervalMonths) : "",
        });
      } else {
        const title = row.title ?? "";
        const next: CustomRow = {
          title,
          km:     row.intervalKm     != null ? String(row.intervalKm)     : "",
          months: row.intervalMonths != null ? String(row.intervalMonths) : "",
        };
        setCustoms((prev) => {
          // Mismo título ya cargado → actualiza en vez de duplicar (re-pegado de la planilla)
          const idx = prev.findIndex((c) => c.title.trim().toLowerCase() === title.trim().toLowerCase());
          if (idx >= 0) return prev.map((c, i) => (i === idx ? next : c));
          return [...prev, next];
        });
      }
    }
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

    // Alertas personalizadas: título obligatorio + al menos un intervalo.
    const badCustoms = customs.filter(
      (c) =>
        c.title.trim() === "" ||
        (toPosIntOrNull(c.km) === null && toPosIntOrNull(c.months) === null),
    );
    if (badCustoms.length > 0) {
      setError(
        "Las alertas personalizadas necesitan nombre y al menos un intervalo (km o meses).",
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

    for (const c of customs) {
      items.push({
        itemType:           MaintenanceAlertType.Other,
        title:              c.title.trim(),
        intervalKm:         toPosIntOrNull(c.km),
        intervalMonths:     toPosIntOrNull(c.months),
        lastServiceMileage: null,
      });
    }

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
        <div className="flex flex-wrap items-start justify-between gap-2 -mt-1">
          <p className="text-xs text-[#44474c]/80 flex-1 min-w-[200px]">
            Elegí de qué avisar al cliente y cada cuánto: por <strong>kilómetros</strong>,
            por <strong>tiempo</strong>, o ambos (lo que llegue primero dispara la alerta).
            Podés ajustar los valores sugeridos.
          </p>
          <button
            type="button"
            onClick={() => setPasteOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c4c6cd] bg-white text-xs font-bold text-[#041627] hover:border-[#fea520] transition-colors shrink-0"
          >
            <ClipboardPaste className="w-3.5 h-3.5 text-[#fea520]" />
            Pegar desde planilla
          </button>
        </div>

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

        {/* ── Alertas personalizadas (nombre libre / importadas de la planilla) ── */}
        {customs.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#44474c]/70 pt-1">
              Alertas personalizadas
            </p>
            {customs.map((c, i) => (
              <div
                key={i}
                className="rounded-lg border border-[#fea520]/50 bg-[#fea520]/[0.04] px-3 py-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Nombre de la alerta"
                    className={inputCls}
                    value={c.title}
                    onChange={(e) => updateCustom(i, { title: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setCustoms((prev) => prev.filter((_, idx) => idx !== i))}
                    title="Quitar alerta"
                    className="p-2 text-[#44474c]/50 hover:text-red-500 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#44474c]/70">
                      Cada (km)
                    </label>
                    <input
                      type="number" min={0} inputMode="numeric" placeholder="Ej: 20000"
                      className={inputCls}
                      value={c.km}
                      onChange={(e) => updateCustom(i, { km: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#44474c]/70">
                      Cada (meses)
                    </label>
                    <input
                      type="number" min={0} inputMode="numeric" placeholder="Ej: 12"
                      className={inputCls}
                      value={c.months}
                      onChange={(e) => updateCustom(i, { months: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </Section>

      <StepNav onBack={onBack} onNext={handleNext} nextLabel="Siguiente" />

      <PasteAlertsDialog
        open={pasteOpen}
        onClose={() => setPasteOpen(false)}
        onApply={applyPasted}
      />
    </div>
  );
}
