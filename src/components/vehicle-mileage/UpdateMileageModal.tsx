"use client";

import { useState } from "react";
import { X, Gauge, AlertCircle } from "lucide-react";
import { AxiosError } from "axios";

import { useReportVehicleMileage } from "@/hooks/useVehicleMileage";
import { PlateBadge } from "@/components/shared/PlateBadge";
import { ProblemDetails, Vehicle } from "@/types/api.types";

interface Props {
  vehicle: Vehicle;
  onClose: () => void;
}

/**
 * Carga rápida del kilometraje actual: muestra la última lectura conocida como
 * referencia y pide solo el número nuevo. La validación fina (monotonía, salto
 * absurdo) la hace el backend — acá solo lo obvio, y se muestran sus mensajes.
 */
export function UpdateMileageModal({ vehicle, onClose }: Props) {
  const report = useReportVehicleMileage(vehicle.id);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const parsed = Math.round(Number(value));
  const isValidNumber = value.trim() !== "" && Number.isFinite(parsed) && parsed >= 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValidNumber) {
      setError("Ingresá el kilometraje tal como lo ves en el tablero.");
      return;
    }
    if (parsed < vehicle.currentMileage) {
      setError(
        `El kilometraje no puede ser menor a la última lectura (${vehicle.currentMileage.toLocaleString("es-AR")} km).`,
      );
      return;
    }

    report.mutate(parsed, {
      onSuccess: () => onClose(),
      onError: (err) => {
        const axiosErr = err as AxiosError<ProblemDetails>;
        setError(
          axiosErr.response?.data?.detail
            ?? axiosErr.response?.data?.title
            ?? "No pudimos guardar el kilometraje. Intentá de nuevo.",
        );
      },
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-[fadeIn_0.2s_ease-out]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden relative"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#fea520] to-[#fec15d]" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#041627]/5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#fea520]/10 flex items-center justify-center shrink-0">
              <Gauge className="w-4.5 h-4.5 text-[#fea520]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#fea520] leading-none">
                Actualizar kilometraje
              </p>
              <p className="text-xs font-bold text-[#44474c] truncate mt-1">
                {vehicle.brand} {vehicle.model}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#44474c] hover:bg-[#f4f6f8] transition-colors shrink-0"
            aria-label="Cerrar"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4" noValidate>
          <div className="flex items-center justify-between gap-3">
            <PlateBadge plate={vehicle.licensePlate} size="sm" />
            <p className="text-[11px] font-semibold text-[#44474c]/70 text-right">
              Última lectura:{" "}
              <span className="font-extrabold text-[#041627]">
                {vehicle.currentMileage.toLocaleString("es-AR")} km
              </span>
              {vehicle.daysSinceMileageUpdate != null && (
                <span> · hace {vehicle.daysSinceMileageUpdate} día{vehicle.daysSinceMileageUpdate === 1 ? "" : "s"}</span>
              )}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627]">
              Kilometraje actual del tablero
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                min={vehicle.currentMileage}
                autoFocus
                placeholder={vehicle.currentMileage.toLocaleString("es-AR")}
                className="w-full pr-12 pl-4 py-3 text-lg font-black tabular-nums rounded-xl border border-[#041627]/10 bg-white text-[#041627] placeholder:text-[#44474c]/30 focus:outline-none focus:ring-2 focus:ring-[#fea520]/20 focus:border-[#fea520] transition-all"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#44474c]/50">
                km
              </span>
            </div>
            <p className="text-[10px] text-[#44474c]/60 leading-relaxed">
              Este dato mantiene al día el aviso del próximo cambio de aceite y el control
              de desgaste de tu vehículo.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={report.isPending}
              className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider border border-[#041627]/10 text-[#041627] hover:bg-[#f4f6f8] active:scale-[0.98] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={report.isPending || !isValidNumber}
              className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#fea520] to-[#fec15d] text-[#041627] hover:shadow-md active:scale-[0.98] transition-all shadow-md shadow-[#fea520]/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {report.isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
