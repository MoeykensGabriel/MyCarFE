"use client";

import { useEffect, useState } from "react";
import { BellRing, Plus, Trash2, RotateCcw } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MaintenanceAlertConfig,
  MaintenanceAlertItemInput,
  MaintenanceAlertSeverity,
  MaintenanceAlertType,
  MaintenanceAlertTypeLabel,
} from "@/types/api.types";
import {
  useVehicleMaintenanceAlerts,
  useSetVehicleMaintenanceAlerts,
  useResetMaintenanceAlert,
} from "@/hooks/useVehicleMaintenanceAlerts";

interface Props {
  vehicleId: string;
  currentMileage: number;
}

type EditRow = {
  id?:            string;
  itemType:       MaintenanceAlertType;
  km:             string;
  months:         string;
  severity?:      MaintenanceAlertSeverity | null;
  kmRemaining?:   number | null;
  daysRemaining?: number | null;
};

const TYPE_OPTIONS = Object.entries(MaintenanceAlertTypeLabel).map(([k, label]) => ({
  value: Number(k) as MaintenanceAlertType,
  label,
}));

function toPosIntOrNull(s: string): number | null {
  const t = s.trim();
  if (t === "") return null;
  const n = Math.round(Number(t));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function fromConfig(c: MaintenanceAlertConfig): EditRow {
  return {
    id:            c.id,
    itemType:      c.itemType,
    km:            c.intervalKm     != null ? String(c.intervalKm)     : "",
    months:        c.intervalMonths != null ? String(c.intervalMonths) : "",
    severity:      c.severity,
    kmRemaining:   c.kmRemaining,
    daysRemaining: c.daysRemaining,
  };
}

const inputCls =
  "w-full px-2.5 py-1.5 text-sm rounded-lg border border-[#c4c6cd] bg-white text-[#041627] " +
  "placeholder:text-[#44474c]/40 focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all";

/**
 * Ficha admin: ver / agregar / editar / desactivar / reiniciar las alertas de
 * mantenimiento de un vehículo. Cada alerta es por km y/o tiempo; el "set" reemplaza
 * el conjunto completo. "Reiniciar" pone la línea base en el km/fecha actuales.
 */
export function MaintenanceAlertsCard({ vehicleId, currentMileage }: Props) {
  const { data, isLoading } = useVehicleMaintenanceAlerts(vehicleId);
  const setMut   = useSetVehicleMaintenanceAlerts(vehicleId);
  const resetMut = useResetMaintenanceAlert(vehicleId);

  const [rows, setRows]   = useState<EditRow[]>([]);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sincronizamos desde el server solo si no hay ediciones sin guardar.
  useEffect(() => {
    if (data && !dirty) setRows(data.map(fromConfig));
  }, [data, dirty]);

  function update(idx: number, patch: Partial<EditRow>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
    setDirty(true);
    if (error) setError(null);
  }

  function addRow() {
    // Tipo por defecto: el primero que no esté usado, o "Otro".
    const used = new Set(rows.map((r) => r.itemType));
    const next = TYPE_OPTIONS.find((o) => !used.has(o.value))?.value ?? MaintenanceAlertType.Other;
    setRows((prev) => [...prev, { itemType: next, km: "", months: "" }]);
    setDirty(true);
  }

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
    setDirty(true);
  }

  async function save() {
    const invalid = rows.some(
      (r) => toPosIntOrNull(r.km) === null && toPosIntOrNull(r.months) === null,
    );
    if (invalid) {
      setError("Cada alerta necesita al menos un intervalo (km o meses).");
      return;
    }

    const items: MaintenanceAlertItemInput[] = rows.map((r) => ({
      id:             r.id ?? null,
      itemType:       r.itemType,
      intervalKm:     toPosIntOrNull(r.km),
      intervalMonths: toPosIntOrNull(r.months),
    }));

    try {
      await setMut.mutateAsync(items);
      setDirty(false); // permite resync desde el server
    } catch {
      /* el toast de error lo maneja el hook */
    }
  }

  const pending = setMut.isPending || resetMut.isPending;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BellRing className="w-4 h-4 text-[#fea520]" />
          Alertas de mantenimiento
        </CardTitle>
        <button
          onClick={addRow}
          disabled={pending}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#eefcfd] border border-[#c4c6cd] text-xs font-bold text-[#041627] hover:border-[#fea520] transition-colors disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar
        </button>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-xs text-[#44474c]/80">
          Avisos que verá el cliente, por km y/o tiempo. Km actual:{" "}
          <strong className="text-[#041627]">{currentMileage.toLocaleString("es-AR")} km</strong> — los
          avisos se cuentan desde la última configuración/reinicio.
        </p>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-16 bg-[#c4c6cd]/20 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-[#44474c]/70 italic py-2">
            Sin alertas configuradas. Tocá <strong>Agregar</strong> para crear la primera.
          </p>
        ) : (
          <div className="space-y-2">
            {rows.map((row, idx) => (
              <div key={row.id ?? `new-${idx}`} className="rounded-lg border border-[#c4c6cd] bg-white p-3 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <select
                    value={row.itemType}
                    onChange={(e) => update(idx, { itemType: Number(e.target.value) as MaintenanceAlertType })}
                    className={`${inputCls} font-semibold max-w-[60%]`}
                  >
                    {TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1 shrink-0">
                    {row.id && (
                      <button
                        onClick={() => resetMut.mutate(row.id!)}
                        disabled={pending || dirty}
                        title={dirty ? "Guardá los cambios primero" : "Reiniciar ciclo (se hizo el service)"}
                        className="p-1.5 rounded-md text-[#44474c]/60 hover:text-[#041627] hover:bg-[#eefcfd] transition-colors disabled:opacity-40"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => removeRow(idx)}
                      disabled={pending}
                      title="Quitar"
                      className="p-1.5 rounded-md text-[#44474c]/60 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#44474c]/70">Cada (km)</label>
                    <input
                      type="number" min={0} inputMode="numeric" placeholder="Ej: 10000"
                      className={inputCls}
                      value={row.km}
                      onChange={(e) => update(idx, { km: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#44474c]/70">Cada (meses)</label>
                    <input
                      type="number" min={0} inputMode="numeric" placeholder="Ej: 6"
                      className={inputCls}
                      value={row.months}
                      onChange={(e) => update(idx, { months: e.target.value })}
                    />
                  </div>
                </div>

                {row.id && !dirty && <StatusLine row={row} />}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {dirty && (
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setDirty(false); setError(null); }}
              disabled={pending}
            >
              Descartar
            </Button>
            <Button size="sm" onClick={save} disabled={pending}>
              {setMut.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Línea de estado (solo para alertas ya guardadas) ─────────────────────────

function StatusLine({ row }: { row: EditRow }) {
  const chip =
    row.severity === MaintenanceAlertSeverity.Critical
      ? { cls: "bg-red-50 text-red-700 border-red-200", label: "Vencido" }
      : row.severity === MaintenanceAlertSeverity.Warning
        ? { cls: "bg-[#fea520]/15 text-[#865300] border-[#fea520]/40", label: "Próximo" }
        : { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Al día" };

  const parts: string[] = [];
  if (row.kmRemaining != null)
    parts.push(row.kmRemaining > 0 ? `faltan ${row.kmRemaining.toLocaleString("es-AR")} km` : "km cumplido");
  if (row.daysRemaining != null)
    parts.push(row.daysRemaining > 0 ? `${row.daysRemaining} días` : "tiempo cumplido");

  return (
    <div className="flex items-center gap-2 flex-wrap pt-0.5">
      <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${chip.cls}`}>
        {chip.label}
      </span>
      {parts.length > 0 && (
        <span className="text-[11px] text-[#44474c]/70">{parts.join(" · ")}</span>
      )}
    </div>
  );
}
