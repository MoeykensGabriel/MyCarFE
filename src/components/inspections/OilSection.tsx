"use client";

import { Droplet } from "lucide-react";

import { OilFormState, fieldInputCls, fieldLabelCls } from "./report-form";

interface Props {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  oil: OilFormState;
  onUpdate: (field: keyof OilFormState, value: string | boolean) => void;
  /** Km del vehículo registrado al ingreso de la orden (lo cargó admin/oficina). */
  mileageAtEntry: number;
}

/**
 * Registro del cambio de aceite (solo área de aceite). El mecánico solo carga
 * el intervalo: el km base sale del ingreso de la orden y el sistema calcula
 * el próximo service (km base + intervalo), que se previsualiza en vivo.
 */
export function OilSection({ enabled, onEnabledChange, oil, onUpdate, mileageAtEntry }: Props) {
  const intervalKm     = Math.round(Number(oil.intervalKm)) || 10000;
  const intervalMonths = Math.round(Number(oil.intervalMonths)) || 6;

  return (
    <div className="space-y-3 border-t border-[#041627]/5 pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Droplet className="w-3.5 h-3.5 text-[#fea520]" />
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627]">
            Control de aceite / service
          </p>
        </div>
        <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#44474c] cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
            className="accent-[#fea520]"
          />
          Hice el cambio de aceite
        </label>
      </div>

      {enabled && (
        <div className="bg-[#f4f6f8] p-2.5 rounded-lg space-y-2">
          <p className="text-[10px] text-[#44474c]/70 leading-relaxed">
            El km del cambio se toma del ingreso de la orden. Si dejás la fecha en blanco,
            usa la del ingreso. El próximo service se avisa por kilometraje o por tiempo,
            lo que llegue primero.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={fieldLabelCls}>Km</label>
              <input
                type="text"
                readOnly
                disabled
                className="w-full px-2 py-1.5 text-xs rounded border border-[#041627]/10 bg-[#041627]/5 text-[#44474c] cursor-not-allowed"
                value={`${mileageAtEntry.toLocaleString("es-AR")} km`}
              />
            </div>
            <div>
              <label className={fieldLabelCls}>Fecha del cambio</label>
              <input
                type="date"
                className={fieldInputCls}
                value={oil.changedOn}
                onChange={(e) => onUpdate("changedOn", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={fieldLabelCls}>Intervalo (km)</label>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="10000"
                className={fieldInputCls}
                value={oil.intervalKm}
                onChange={(e) => onUpdate("intervalKm", e.target.value)}
              />
            </div>
            <div>
              <label className={fieldLabelCls}>Intervalo (meses)</label>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="6"
                className={fieldInputCls}
                value={oil.intervalMonths}
                onChange={(e) => onUpdate("intervalMonths", e.target.value)}
              />
            </div>
          </div>

          {/* Próximo service estimado: km del ingreso + intervalo. Solo informativo,
              el cálculo real lo hace el backend con los mismos datos. */}
          <div className="rounded-lg border border-[#fea520]/40 bg-[#fea520]/10 px-3 py-2">
            <p className={fieldLabelCls}>Próximo service estimado</p>
            <p className="text-xs font-black text-[#041627]">
              {(mileageAtEntry + intervalKm).toLocaleString("es-AR")}{" "}
              km
              <span className="font-semibold text-[#44474c]">
                {" "}({mileageAtEntry.toLocaleString("es-AR")} km del ingreso +{" "}
                {intervalKm.toLocaleString("es-AR")} km)
                {" "}· o a los {intervalMonths} meses, lo que llegue primero
              </span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={fieldLabelCls}>Tipo de aceite</label>
              <input
                type="text"
                placeholder="5W30 sintético"
                className={fieldInputCls}
                value={oil.oilType}
                onChange={(e) => onUpdate("oilType", e.target.value)}
              />
            </div>
            <div>
              <label className={fieldLabelCls}>Marca</label>
              <input
                type="text"
                placeholder="Shell, Castrol..."
                className={fieldInputCls}
                value={oil.oilBrand}
                onChange={(e) => onUpdate("oilBrand", e.target.value)}
              />
            </div>
          </div>

          <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#44474c] cursor-pointer">
            <input
              type="checkbox"
              checked={oil.filterChanged}
              onChange={(e) => onUpdate("filterChanged", e.target.checked)}
              className="accent-[#fea520]"
            />
            También cambié el filtro de aceite
          </label>

          <input
            type="text"
            placeholder="Observaciones (opcional)"
            className={fieldInputCls}
            value={oil.notes}
            onChange={(e) => onUpdate("notes", e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
