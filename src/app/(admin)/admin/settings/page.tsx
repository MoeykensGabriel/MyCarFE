"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Car, Gauge, Save, Settings as SettingsIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { useWorkshopSettings, useUpdateWorkshopSettings } from "@/hooks/useSettings";
import { M } from "@/lib/form-messages";

// ─── Schema ───────────────────────────────────────────────────────────────────

const workshopSchema = z.object({
  physicalCapacity: z
    .number({ message: M.notNumber })
    .int("Tiene que ser un número entero")
    .min(1, "La capacidad mínima es 1")
    .max(50, "La capacidad máxima es 50"),
  mileageReminderDays: z
    .number({ message: M.notNumber })
    .int("Tiene que ser un número entero")
    .min(1, "El mínimo es 1 día")
    .max(365, "El máximo es 365 días"),
});

type WorkshopFormValues = z.infer<typeof workshopSchema>;

// ─── Página ───────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: settings, isLoading, isError } = useWorkshopSettings();
  const updateMutation = useUpdateWorkshopSettings();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<WorkshopFormValues>({
    resolver: zodResolver(workshopSchema),
    defaultValues: { physicalCapacity: 6, mileageReminderDays: 14 },
  });

  // Cuando llegan los settings del back, reseteamos el form con esos valores.
  useEffect(() => {
    if (settings) reset({
      physicalCapacity:    settings.physicalCapacity,
      mileageReminderDays: settings.mileageReminderDays,
    });
  }, [settings, reset]);

  const onSubmit = (values: WorkshopFormValues) => {
    updateMutation.mutate(values, {
      onSuccess: (data) => reset({
        physicalCapacity:    data.physicalCapacity,
        mileageReminderDays: data.mileageReminderDays,
      }),
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <PageHeader
        title="Configuración"
        subtitle="Ajustes globales del taller. Los cambios afectan al instante."
        Icon={SettingsIcon}
      />

      {/* Card: Taller */}
      <section className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden">
        <div className="flex items-start gap-3 px-5 py-4 border-b border-[#c4c6cd]/60 bg-[#eefcfd]">
          <div className="w-9 h-9 rounded-lg bg-[#041627] text-[#fea520] flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#041627]">Taller</h2>
            <p className="text-[11px] text-[#44474c] leading-tight mt-0.5">
              Datos físicos y operativos del taller.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3 animate-pulse">
            <div className="h-3 w-32 bg-[#c4c6cd]/40 rounded" />
            <div className="h-10 w-full bg-[#c4c6cd]/30 rounded" />
            <div className="h-3 w-48 bg-[#c4c6cd]/30 rounded" />
          </div>
        ) : isError || !settings ? (
          <div className="p-5">
            <p className="text-sm text-red-600">No pudimos cargar la configuración.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
            {/* Capacidad física */}
            <div className="space-y-1.5">
              <label
                htmlFor="physicalCapacity"
                className="text-[11px] font-bold uppercase tracking-widest text-[#041627] flex items-center gap-1.5"
              >
                <Car className="w-3.5 h-3.5 text-[#44474c]/60" />
                Capacidad física
              </label>
              <input
                id="physicalCapacity"
                type="number"
                min={1}
                max={50}
                className="w-32 px-3 py-2.5 text-sm rounded-xl border border-[#c4c6cd] bg-white text-[#041627] focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all"
                {...register("physicalCapacity", { valueAsNumber: true })}
              />
              {errors.physicalCapacity && (
                <p className="text-xs text-red-500">{errors.physicalCapacity.message}</p>
              )}
              <p className="text-[11px] text-[#44474c]/70">
                Cantidad de vehículos que el taller puede albergar simultáneamente.
                Se usa en el dashboard para mostrar la ocupación.
              </p>
            </div>

            {/* Recordatorio de kilometraje */}
            <div className="space-y-1.5">
              <label
                htmlFor="mileageReminderDays"
                className="text-[11px] font-bold uppercase tracking-widest text-[#041627] flex items-center gap-1.5"
              >
                <Gauge className="w-3.5 h-3.5 text-[#44474c]/60" />
                Recordatorio de kilometraje (días)
              </label>
              <input
                id="mileageReminderDays"
                type="number"
                min={1}
                max={365}
                className="w-32 px-3 py-2.5 text-sm rounded-xl border border-[#c4c6cd] bg-white text-[#041627] focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all"
                {...register("mileageReminderDays", { valueAsNumber: true })}
              />
              {errors.mileageReminderDays && (
                <p className="text-xs text-red-500">{errors.mileageReminderDays.message}</p>
              )}
              <p className="text-[11px] text-[#44474c]/70">
                Cada cuántos días se le pide al cliente que actualice el kilometraje de sus
                vehículos. El aviso se apaga solo cuando hay una lectura reciente
                (incluido el ingreso al taller).
              </p>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-3 pt-1 border-t border-[#c4c6cd]/40 pt-4">
              <button
                type="submit"
                disabled={!isDirty || updateMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#fea520] text-[#041627] text-sm font-bold hover:bg-[#e8951d] active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                <Save className="w-4 h-4" />
                {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
              </button>
              {!isDirty && !updateMutation.isPending && (
                <p className="text-xs text-[#44474c]/60">Sin cambios sin guardar.</p>
              )}
            </div>
          </form>
        )}
      </section>

      {/* Espacio para futuras secciones — placeholder con ejemplos */}
      <section className="bg-white rounded-xl border border-dashed border-[#c4c6cd]/70 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#eefcfd] text-[#44474c]/60 flex items-center justify-center shrink-0">
            <SettingsIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#041627]">Próximamente</p>
            <p className="text-[11px] text-[#44474c] leading-tight mt-0.5">
              Horarios del taller, datos de contacto, branding, y más opciones de configuración global.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
