"use client";

import { BatteryCharging } from "lucide-react";

import { BatteryStatusLabel, BatteryTerminalSideLabel } from "@/lib/enums";
import { sanitizeDecimalInput } from "@/lib/decimal-input";
import { BatteryFormState, fieldInputCls, fieldLabelCls } from "./report-form";

interface Props {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  battery: BatteryFormState;
  onUpdate: (field: keyof BatteryFormState, value: string) => void;
}

/**
 * Chequeo de batería (solo área de batería): estado + specs del repuesto para
 * saber qué batería comprar si hay que reemplazarla.
 */
export function BatterySection({ enabled, onEnabledChange, battery, onUpdate }: Props) {
  // Con remanencia cargada, el estado se deriva del % y el select queda bloqueado.
  const derivedFromPct = battery.remainingPercentage.trim() !== "";

  return (
    <div className="space-y-3 border-t border-[#041627]/5 pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <BatteryCharging className="w-3.5 h-3.5 text-[#fea520]" />
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627]">
            Control de batería
          </p>
        </div>
        <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#44474c] cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
            className="accent-[#fea520]"
          />
          Revisé la batería
        </label>
      </div>

      {enabled && (
        <div className="bg-[#f4f6f8] p-2.5 rounded-lg space-y-2">
          <div>
            <label className={fieldLabelCls}>Estado</label>
            <select
              className={`${fieldInputCls}${derivedFromPct ? " opacity-60 cursor-not-allowed" : ""}`}
              value={battery.status}
              onChange={(e) => onUpdate("status", e.target.value)}
              disabled={derivedFromPct}
            >
              {Object.entries(BatteryStatusLabel).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {derivedFromPct && (
              <p className="text-[9px] text-[#44474c]/60 mt-0.5">
                Se ajusta automáticamente según la remanencia.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={fieldLabelCls}>Voltaje (V)</label>
              {/* type="text": iOS Safari no deja tipear punto/coma con type="number" */}
              <input
                type="text"
                inputMode="decimal"
                placeholder="12.6"
                className={fieldInputCls}
                value={battery.voltage}
                onChange={(e) => {
                  const v = sanitizeDecimalInput(e.target.value);
                  if (v !== null) onUpdate("voltage", v);
                }}
              />
            </div>
            <div>
              <label className={fieldLabelCls}>Marca</label>
              <input
                type="text"
                placeholder="Bosch, Moura..."
                className={fieldInputCls}
                value={battery.brand}
                onChange={(e) => onUpdate("brand", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className={fieldLabelCls}>Remanencia (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              inputMode="numeric"
              placeholder="0 a 100"
              className={fieldInputCls}
              value={battery.remainingPercentage}
              onChange={(e) => onUpdate("remainingPercentage", e.target.value)}
            />
          </div>
          <div>
            <label className={fieldLabelCls}>Fecha de instalación (opcional)</label>
            <input
              type="date"
              className={fieldInputCls}
              value={battery.installedOn}
              onChange={(e) => onUpdate("installedOn", e.target.value)}
            />
          </div>
          {/* ── Specs del repuesto (para saber qué batería comprar) ── */}
          <div className="border-t border-[#041627]/5 pt-2 space-y-2">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#44474c]/50">
              Specs del repuesto (opcional)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={fieldLabelCls}>Capacidad (Ah)</label>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="ej. 75"
                  className={fieldInputCls}
                  value={battery.capacityAh}
                  onChange={(e) => onUpdate("capacityAh", e.target.value)}
                />
              </div>
              <div>
                <label className={fieldLabelCls}>Borne + (de frente)</label>
                <select
                  className={fieldInputCls}
                  value={battery.positiveTerminalSide}
                  onChange={(e) => onUpdate("positiveTerminalSide", e.target.value)}
                >
                  <option value="">—</option>
                  {Object.entries(BatteryTerminalSideLabel).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={fieldLabelCls}>Caja: ancho × largo × alto (cm)</label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text" inputMode="decimal" placeholder="ancho"
                  className={fieldInputCls}
                  value={battery.boxWidthCm}
                  onChange={(e) => {
                    const v = sanitizeDecimalInput(e.target.value);
                    if (v !== null) onUpdate("boxWidthCm", v);
                  }}
                />
                <input
                  type="text" inputMode="decimal" placeholder="largo"
                  className={fieldInputCls}
                  value={battery.boxLengthCm}
                  onChange={(e) => {
                    const v = sanitizeDecimalInput(e.target.value);
                    if (v !== null) onUpdate("boxLengthCm", v);
                  }}
                />
                <input
                  type="text" inputMode="decimal" placeholder="alto"
                  className={fieldInputCls}
                  value={battery.boxHeightCm}
                  onChange={(e) => {
                    const v = sanitizeDecimalInput(e.target.value);
                    if (v !== null) onUpdate("boxHeightCm", v);
                  }}
                />
              </div>
            </div>
          </div>

          <input
            type="text"
            placeholder="Observaciones (bornes sulfatados, etc.)"
            className={fieldInputCls}
            value={battery.notes}
            onChange={(e) => onUpdate("notes", e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
