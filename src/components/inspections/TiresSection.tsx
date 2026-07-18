"use client";

import { Gauge } from "lucide-react";

import { TirePositionLabel } from "@/lib/enums";
import { sanitizeDecimalInput } from "@/lib/decimal-input";
import { TireRow } from "./report-form";

interface Props {
  rows: TireRow[];
  onUpdate: (index: number, field: keyof TireRow, value: string) => void;
}

/**
 * Medición de 3 puntos por posición (solo área de cubiertas). Una posición sin
 * profundidades cargadas se considera no revisada y se omite del payload.
 */
export function TiresSection({ rows, onUpdate }: Props) {
  return (
    <div className="space-y-3 border-t border-[#041627]/5 pt-4">
      <div className="flex items-center gap-1.5">
        <Gauge className="w-3.5 h-3.5 text-[#fea520]" />
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627]">
          Control de cubiertas
        </p>
      </div>
      <p className="text-[10px] text-[#44474c]/70 leading-relaxed">
        Medí la profundidad de banda en 3 puntos (interior / centro / exterior) por posición.
        Dejá una posición vacía si no la revisaste. Marca y medida solo hacen falta si la
        cubierta todavía no está registrada.
      </p>

      {rows.map((row, i) => (
        <div key={row.position} className="bg-[#f4f6f8] p-2.5 rounded-lg space-y-2">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#041627]">
            {TirePositionLabel[row.position]}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {/* type="text" + inputMode="decimal": iOS Safari no deja tipear punto/coma
                con type="number" (ver lib/decimal-input.ts) */}
            <input
              type="text"
              inputMode="decimal"
              placeholder="Interior (mm)"
              className="px-2 py-1.5 text-xs rounded border border-[#041627]/10 bg-white"
              value={row.inner}
              onChange={(e) => {
                const v = sanitizeDecimalInput(e.target.value);
                if (v !== null) onUpdate(i, "inner", v);
              }}
            />
            <input
              type="text"
              inputMode="decimal"
              placeholder="Centro (mm)"
              className="px-2 py-1.5 text-xs rounded border border-[#041627]/10 bg-white"
              value={row.center}
              onChange={(e) => {
                const v = sanitizeDecimalInput(e.target.value);
                if (v !== null) onUpdate(i, "center", v);
              }}
            />
            <input
              type="text"
              inputMode="decimal"
              placeholder="Exterior (mm)"
              className="px-2 py-1.5 text-xs rounded border border-[#041627]/10 bg-white"
              value={row.outer}
              onChange={(e) => {
                const v = sanitizeDecimalInput(e.target.value);
                if (v !== null) onUpdate(i, "outer", v);
              }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Marca"
              className="px-2 py-1.5 text-xs rounded border border-[#041627]/10 bg-white"
              value={row.brand}
              onChange={(e) => onUpdate(i, "brand", e.target.value)}
            />
            <input
              type="text"
              placeholder="Modelo"
              className="px-2 py-1.5 text-xs rounded border border-[#041627]/10 bg-white"
              value={row.model}
              onChange={(e) => onUpdate(i, "model", e.target.value)}
            />
            <input
              type="text"
              placeholder='Medida (ej. 185/65 R15)'
              className="px-2 py-1.5 text-xs rounded border border-[#041627]/10 bg-white"
              value={row.sizeSpec}
              onChange={(e) => onUpdate(i, "sizeSpec", e.target.value)}
            />
          </div>
          <input
            type="text"
            placeholder="Observaciones (opcional)"
            className="w-full px-2 py-1.5 text-xs rounded border border-[#041627]/10 bg-white"
            value={row.notes}
            onChange={(e) => onUpdate(i, "notes", e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}
