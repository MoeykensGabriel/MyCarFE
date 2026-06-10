"use client";

import { Plus, Trash2, Wrench, Package } from "lucide-react";
import { UseFormReturn, useFieldArray } from "react-hook-form";

import { formatCurrency } from "@/lib/format";
import { ReportFormInput, ReportFormOutput, fieldLabelCls } from "./report-form";

interface Props {
  form: UseFormReturn<ReportFormInput, unknown, ReportFormOutput>;
}

/**
 * Propuestas del mecánico cuando hay problema: N servicios sugeridos (con costo
 * de mano de obra y duración estimada) y N repuestos. El administrador después
 * elige cuáles entran al presupuesto.
 */
export function ProposalsSection({ form }: Props) {
  const { register, control, watch, formState: { errors } } = form;

  const servicesArr = useFieldArray({ control, name: "proposedServices" });
  const partsArr    = useFieldArray({ control, name: "proposedParts" });

  // Total estimado en vivo — solo informativo para el mecánico, no se envía.
  const watchedServices = watch("proposedServices");
  const servicesTotal = (watchedServices ?? []).reduce(
    (sum, s) => sum + (Number(s?.estimatedLaborCost) || 0),
    0,
  );

  return (
    <div className="space-y-5 border-t border-[#041627]/5 pt-4">
      <p className="text-[10px] text-[#44474c]/70 leading-relaxed bg-[#eefcfd]/60 border border-[#041627]/5 rounded-lg p-2.5">
        Podés sugerir <span className="font-bold text-[#041627]">varios servicios y varios repuestos</span>.
        Cargá cada uno con su precio aproximado — el administrador elige cuáles entran al presupuesto.
      </p>

      {/* ── Servicios sugeridos ─────────────────────────────────────── */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5">
          <Wrench className="w-3.5 h-3.5 text-[#fea520]" />
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627]">
            Servicios sugeridos
          </p>
          {servicesArr.fields.length > 0 && (
            <span className="text-[10px] font-bold text-[#44474c]/60">
              ({servicesArr.fields.length})
            </span>
          )}
        </div>

        {servicesArr.fields.map((field, i) => (
          <div key={field.id} className="bg-[#f4f6f8] p-3 rounded-xl space-y-2 border border-[#041627]/5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#041627]/70">
                Servicio {i + 1}
              </span>
              <button
                type="button"
                onClick={() => servicesArr.remove(i)}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-700"
                aria-label={`Eliminar servicio ${i + 1}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Quitar
              </button>
            </div>

            <div className="space-y-1">
              <label className={fieldLabelCls}>Nombre del trabajo</label>
              <input
                type="text"
                placeholder="Ej. Cambio de pastillas de freno"
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-[#041627]/10 bg-white"
                {...register(`proposedServices.${i}.name`)}
              />
              {errors.proposedServices?.[i]?.name && (
                <p className="text-[10px] text-red-500">{errors.proposedServices[i]?.name?.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className={fieldLabelCls}>Detalle (opcional)</label>
              <textarea
                rows={2}
                placeholder="Aclaraciones del trabajo a realizar"
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-[#041627]/10 bg-white resize-none"
                {...register(`proposedServices.${i}.description`)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className={fieldLabelCls}>Mano de obra aprox ($)</label>
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0"
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-[#041627]/10 bg-white"
                  {...register(`proposedServices.${i}.estimatedLaborCost`)}
                />
              </div>
              <div className="space-y-1">
                <label className={fieldLabelCls}>Duración estim.</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      placeholder="0"
                      className="w-full pl-2.5 pr-7 py-2 text-xs rounded-lg border border-[#041627]/10 bg-white"
                      {...register(`proposedServices.${i}.estimatedDays`)}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#44474c]/50">días</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={23}
                      placeholder="0"
                      className="w-full pl-2.5 pr-6 py-2 text-xs rounded-lg border border-[#041627]/10 bg-white"
                      {...register(`proposedServices.${i}.estimatedHours`)}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#44474c]/50">hs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() =>
            servicesArr.append({ name: "", description: "", estimatedLaborCost: 0, estimatedDays: undefined, estimatedHours: undefined })
          }
          className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-[#041627]/20 text-[11px] font-bold uppercase tracking-wider text-[#44474c]/70 hover:border-[#fea520] hover:text-[#fea520] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar servicio
        </button>

        {servicesTotal > 0 && (
          <p className="text-[10px] font-semibold text-[#44474c]/70 text-right">
            Mano de obra estimada:{" "}
            <span className="font-black text-[#041627]">{formatCurrency(servicesTotal)}</span>
          </p>
        )}
      </div>

      {/* ── Repuestos sugeridos ─────────────────────────────────────── */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5 text-[#fea520]" />
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627]">
            Repuestos sugeridos
          </p>
          {partsArr.fields.length > 0 && (
            <span className="text-[10px] font-bold text-[#44474c]/60">
              ({partsArr.fields.length})
            </span>
          )}
        </div>

        {partsArr.fields.map((field, i) => (
          <div key={field.id} className="bg-[#f4f6f8] p-3 rounded-xl space-y-2 border border-[#041627]/5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#041627]/70">
                Repuesto {i + 1}
              </span>
              <button
                type="button"
                onClick={() => partsArr.remove(i)}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-700"
                aria-label={`Eliminar repuesto ${i + 1}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Quitar
              </button>
            </div>

            <div className="space-y-1">
              <label className={fieldLabelCls}>Nombre del repuesto</label>
              <input
                type="text"
                placeholder="Ej. Juego de pastillas delanteras"
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-[#041627]/10 bg-white"
                {...register(`proposedParts.${i}.name`)}
              />
              {errors.proposedParts?.[i]?.name && (
                <p className="text-[10px] text-red-500">{errors.proposedParts[i]?.name?.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className={fieldLabelCls}>Cantidad</label>
              <input
                type="number"
                inputMode="numeric"
                placeholder="1"
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-[#041627]/10 bg-white"
                {...register(`proposedParts.${i}.quantity`)}
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => partsArr.append({ name: "", quantity: 1 })}
          className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-[#041627]/20 text-[11px] font-bold uppercase tracking-wider text-[#44474c]/70 hover:border-[#fea520] hover:text-[#fea520] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar repuesto
        </button>

      </div>
    </div>
  );
}
