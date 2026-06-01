"use client";

import { useState } from "react";
import { X } from "lucide-react";

import {
  useAddTireMeasurement,
  useCreateVehicleTire,
  useReplaceTire,
} from "@/hooks/useVehicleTires";
import { TirePosition, TirePositionLabel } from "@/lib/enums";
import type { VehicleTire } from "@/types/api.types";

type Props = {
  vehicleId: string;
  defaultMileage: number;
  onClose: () => void;
} & (
  | { mode: "create"; position: TirePosition; tire?: undefined }
  | { mode: "measure"; tire: VehicleTire; position?: undefined }
  | { mode: "replace"; tire: VehicleTire; position?: undefined }
);

const inputCls =
  "w-full px-3 py-2.5 rounded-xl border border-[#041627]/10 text-sm bg-white";
const labelCls =
  "text-[10px] font-extrabold uppercase tracking-widest text-[#041627] block mb-1.5";

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}
function nowDateTimeLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

/**
 * Modal único para las 3 acciones sobre cubiertas: crear, medir y reemplazar.
 * Sin librería de form — useState directo, validación mínima en cliente
 * (el backend valida en serio). UI funcional para iterar después.
 */
export function TireFormModal(props: Props) {
  const { vehicleId, defaultMileage, onClose, mode } = props;

  const create  = useCreateVehicleTire(vehicleId);
  const measure = useAddTireMeasurement(vehicleId);
  const replace = useReplaceTire(vehicleId);
  const pending = create.isPending || measure.isPending || replace.isPending;

  // ── Estado compartido de cubierta (create / replace) ──
  const [brand, setBrand]       = useState(mode === "replace" ? props.tire.brand : "");
  const [model, setModel]       = useState(mode === "replace" ? props.tire.model : "");
  const [sizeSpec, setSizeSpec] = useState(mode === "replace" ? props.tire.sizeSpec : "");
  const [initialDepth, setInitialDepth] = useState("8");
  const [expectedLife, setExpectedLife] = useState("50000");
  const [onDate, setOnDate] = useState(todayDate()); // installedOn / replacedOn
  const [atKm, setAtKm]     = useState(String(defaultMileage || 0));

  // ── Estado de medición ──
  const [measuredOn, setMeasuredOn] = useState(nowDateTimeLocal());
  const [inner, setInner]   = useState("");
  const [center, setCenter] = useState("");
  const [outer, setOuter]   = useState("");
  const [notes, setNotes]   = useState("");

  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const onDone = { onSuccess: () => onClose() };

    if (mode === "create") {
      if (!brand.trim() || !model.trim() || !sizeSpec.trim()) {
        setError("Completá marca, modelo y medida.");
        return;
      }
      create.mutate(
        {
          position:            props.position,
          brand:               brand.trim(),
          model:               model.trim(),
          sizeSpec:            sizeSpec.trim(),
          installedOn:         onDate,
          installedAtKm:       Number(atKm) || 0,
          initialTreadDepthMm: Number(initialDepth) || 8,
          expectedLifeKm:      Number(expectedLife) || 0,
        },
        onDone,
      );
      return;
    }

    if (mode === "measure") {
      if (inner === "" || center === "" || outer === "") {
        setError("Cargá las 3 mediciones (interior, centro, exterior).");
        return;
      }
      measure.mutate(
        {
          tireId: props.tire.id,
          data: {
            measuredOn:                  new Date(measuredOn).toISOString(),
            vehicleMileageAtMeasurement: Number(atKm) || 0,
            innerDepthMm:                Number(inner),
            centerDepthMm:               Number(center),
            outerDepthMm:                Number(outer),
            notes:                       notes.trim() || undefined,
          },
        },
        onDone,
      );
      return;
    }

    // replace
    if (!brand.trim() || !model.trim() || !sizeSpec.trim()) {
      setError("Completá marca, modelo y medida de la nueva cubierta.");
      return;
    }
    replace.mutate(
      {
        tireId: props.tire.id,
        data: {
          replacedOn:             onDate,
          replacedAtKm:           Number(atKm) || 0,
          newBrand:               brand.trim(),
          newModel:               model.trim(),
          newSizeSpec:            sizeSpec.trim(),
          newInitialTreadDepthMm: Number(initialDepth) || 8,
          newExpectedLifeKm:      Number(expectedLife) || 0,
        },
      },
      onDone,
    );
  };

  const title =
    mode === "create"  ? "Nueva cubierta" :
    mode === "measure" ? "Registrar medición" :
                         "Reemplazar cubierta";

  const subtitle =
    mode === "create"
      ? TirePositionLabel[props.position]
      : TirePositionLabel[props.tire.position];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#041627]/5">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#fea520] leading-none">
              {title}
            </p>
            <h2 className="text-sm font-black text-[#041627] mt-1">{subtitle}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-[#44474c] hover:bg-[#f4f6f8]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="px-5 py-5 space-y-4 overflow-y-auto">
          {/* ── Crear / Reemplazar: datos de la cubierta ── */}
          {(mode === "create" || mode === "replace") && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Marca *</label>
                  <input className={inputCls} value={brand} onChange={(e) => setBrand(e.target.value)}
                    placeholder="Pirelli" maxLength={100} disabled={pending} />
                </div>
                <div>
                  <label className={labelCls}>Modelo *</label>
                  <input className={inputCls} value={model} onChange={(e) => setModel(e.target.value)}
                    placeholder="P7" maxLength={100} disabled={pending} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Medida *</label>
                <input className={inputCls} value={sizeSpec} onChange={(e) => setSizeSpec(e.target.value)}
                  placeholder="185/65 R15" maxLength={50} disabled={pending} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Profundidad inicial (mm)</label>
                  <input className={inputCls} type="number" step="0.1" min="1.6" max="25"
                    value={initialDepth} onChange={(e) => setInitialDepth(e.target.value)} disabled={pending} />
                </div>
                <div>
                  <label className={labelCls}>Vida útil (km)</label>
                  <input className={inputCls} type="number" min="0"
                    value={expectedLife} onChange={(e) => setExpectedLife(e.target.value)} disabled={pending} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>{mode === "create" ? "Instalada el" : "Reemplazada el"}</label>
                  <input className={inputCls} type="date" value={onDate}
                    onChange={(e) => setOnDate(e.target.value)} disabled={pending} />
                </div>
                <div>
                  <label className={labelCls}>Km del vehículo</label>
                  <input className={inputCls} type="number" min="0" value={atKm}
                    onChange={(e) => setAtKm(e.target.value)} disabled={pending} />
                </div>
              </div>
            </>
          )}

          {/* ── Medición ── */}
          {mode === "measure" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Fecha de medición</label>
                  <input className={inputCls} type="datetime-local" value={measuredOn}
                    onChange={(e) => setMeasuredOn(e.target.value)} disabled={pending} />
                </div>
                <div>
                  <label className={labelCls}>Km del vehículo</label>
                  <input className={inputCls} type="number" min="0" value={atKm}
                    onChange={(e) => setAtKm(e.target.value)} disabled={pending} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Profundidad por punto (mm) *</label>
                <div className="grid grid-cols-3 gap-2">
                  <input className={inputCls} type="number" step="0.1" min="0" max="25" placeholder="Interior"
                    value={inner} onChange={(e) => setInner(e.target.value)} disabled={pending} />
                  <input className={inputCls} type="number" step="0.1" min="0" max="25" placeholder="Centro"
                    value={center} onChange={(e) => setCenter(e.target.value)} disabled={pending} />
                  <input className={inputCls} type="number" step="0.1" min="0" max="25" placeholder="Exterior"
                    value={outer} onChange={(e) => setOuter(e.target.value)} disabled={pending} />
                </div>
                <p className="text-[10px] text-[#44474c]/60 mt-1">
                  Medí en 3 puntos para detectar desgaste irregular.
                </p>
              </div>
              <div>
                <label className={labelCls}>Notas</label>
                <textarea className={`${inputCls} resize-none`} rows={2} maxLength={1000}
                  value={notes} onChange={(e) => setNotes(e.target.value)} disabled={pending}
                  placeholder="Observaciones..." />
              </div>
            </>
          )}

          {error && (
            <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-2 border-t border-[#041627]/5">
            <button type="button" onClick={onClose} disabled={pending}
              className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider border border-[#041627]/10 text-[#041627] hover:bg-[#f4f6f8]">
              Cancelar
            </button>
            <button type="submit" disabled={pending}
              className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#fea520] to-[#fec15d] text-[#041627] hover:shadow-md disabled:opacity-50">
              {pending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
