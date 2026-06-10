"use client";

import { useState } from "react";
import { X, Check, Wrench, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";

import { AreaMultiSelectField } from "@/components/shared/AreaMultiSelectField";
import { useAssignMechanicAreas, useCreateMechanic } from "@/hooks/useAdminMechanics";
import { ProblemDetails } from "@/types/api.types";

import { mechanicSchema, MechanicForm } from "./mechanic-form";

interface Props {
  onClose: () => void;
}

/**
 * Alta de mecánico. Al crearlo muestra la contraseña temporal para compartir.
 * Las áreas seleccionadas se asignan en una segunda llamada tras la creación.
 */
export function CreateMechanicModal({ onClose }: Props) {
  const createMechanic = useCreateMechanic();
  const assignAreas    = useAssignMechanicAreas();
  const [serverError, setServerError]       = useState<string | null>(null);
  const [tempPassword, setTempPassword]     = useState<string | null>(null);
  const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MechanicForm>({ resolver: zodResolver(mechanicSchema) });

  const onSubmit = async (data: MechanicForm) => {
    setServerError(null);
    createMechanic.mutate(data, {
      onSuccess: async (res) => {
        // Si el admin seleccionó áreas, las asignamos en una segunda llamada.
        // Si falla, la creación ya sucedió — el admin puede reintentar desde el detalle.
        if (selectedAreaIds.length > 0) {
          try {
            await assignAreas.mutateAsync({ id: res.mechanic.id, areaIds: selectedAreaIds });
          } catch {
            // Toast del hook ya cubre el error; el mecánico queda creado sin áreas
          }
        }
        setTempPassword(res.tempPassword);
      },
      onError: (err) => {
        const axiosErr = err as AxiosError<ProblemDetails>;
        const detail = axiosErr.response?.data?.detail;
        const title = axiosErr.response?.data?.title;
        setServerError(detail ?? title ?? "Error al crear el mecánico");
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#c4c6cd]/60">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[#fea520]" />
            <h2 className="text-base font-bold text-[#041627]">Nuevo mecánico</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#44474c] hover:bg-[#eefcfd] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {tempPassword ? (
            /* ── Éxito: mostrar contraseña temporal ── */
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                <p className="text-sm font-semibold">Mecánico creado exitosamente</p>
              </div>
              <div className="rounded-xl border border-[#c4c6cd] bg-[#eefcfd] px-4 py-3 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">
                  Contraseña temporal
                </p>
                <p className="text-lg font-mono font-bold text-[#041627] tracking-widest">
                  {tempPassword}
                </p>
                <p className="text-xs text-[#44474c]/70">
                  Compartila con el mecánico. Deberá cambiarla en su primer acceso.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-sm font-bold bg-[#fea520] text-[#041627] hover:bg-[#e8951d] transition-all"
              >
                Cerrar
              </button>
            </div>
          ) : (
            /* ── Formulario ── */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* Nombre + Apellido */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-[#041627]">
                    Nombre
                  </label>
                  <input
                    type="text"
                    placeholder="Juan"
                    className={`w-full px-3 py-2.5 text-sm rounded-xl border bg-white text-[#041627] placeholder:text-[#44474c]/40 focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all ${
                      errors.firstName
                        ? "border-red-400 focus:ring-red-200"
                        : "border-[#c4c6cd]"
                    }`}
                    {...register("firstName")}
                  />
                  {errors.firstName && (
                    <p className="text-xs text-red-500">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-[#041627]">
                    Apellido
                  </label>
                  <input
                    type="text"
                    placeholder="Pérez"
                    className={`w-full px-3 py-2.5 text-sm rounded-xl border bg-white text-[#041627] placeholder:text-[#44474c]/40 focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all ${
                      errors.lastName
                        ? "border-red-400 focus:ring-red-200"
                        : "border-[#c4c6cd]"
                    }`}
                    {...register("lastName")}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-red-500">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[#041627]">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="mecanico@taller.com"
                  className={`w-full px-3 py-2.5 text-sm rounded-xl border bg-white text-[#041627] placeholder:text-[#44474c]/40 focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all ${
                    errors.email
                      ? "border-red-400 focus:ring-red-200"
                      : "border-[#c4c6cd]"
                  }`}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Teléfono */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[#041627]">
                  Teléfono <span className="font-normal text-[#44474c]/50">(opcional)</span>
                </label>
                <input
                  type="tel"
                  placeholder="+54 11 1234-5678"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#c4c6cd] bg-white text-[#041627] placeholder:text-[#44474c]/40 focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all"
                  {...register("phone")}
                />
              </div>

              {/* Especialidad (texto libre — legado) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[#041627]">
                  Especialidad <span className="font-normal text-[#44474c]/50">(opcional, texto libre)</span>
                </label>
                <input
                  type="text"
                  placeholder="Motor, frenos, electricidad..."
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#c4c6cd] bg-white text-[#041627] placeholder:text-[#44474c]/40 focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all"
                  {...register("specialty")}
                />
              </div>

              {/* Áreas (M-a-N — para inspecciones) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[#041627]">
                  Áreas asignadas <span className="font-normal text-[#44474c]/50">(opcional)</span>
                </label>
                <AreaMultiSelectField
                  value={selectedAreaIds}
                  onChange={setSelectedAreaIds}
                />
                <p className="text-[10px] text-[#44474c]/60 mt-1">
                  El mecánico podrá reportar en las áreas que selecciones durante la fase de inspección.
                </p>
              </div>

              {/* Generalista */}
              <label className="flex items-start gap-2.5 rounded-xl border border-[#c4c6cd] bg-[#eefcfd]/40 px-3.5 py-3 cursor-pointer hover:border-[#fea520]/50 transition-colors">
                <input
                  type="checkbox"
                  className="mt-0.5 accent-[#fea520] w-4 h-4"
                  {...register("isGeneralist")}
                />
                <span>
                  <span className="block text-xs font-bold text-[#041627]">Mecánico generalista</span>
                  <span className="block text-[10px] text-[#44474c]/70 mt-0.5">
                    Puede reportar y trabajar en <strong>todas las áreas</strong> activas durante la inspección,
                    sin necesidad de asignárselas una por una.
                  </span>
                </span>
              </label>

              {/* Error servidor */}
              {serverError && (
                <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{serverError}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || createMechanic.isPending}
                className="w-full py-3 rounded-xl text-sm font-bold bg-[#fea520] text-[#041627] hover:bg-[#e8951d] active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMechanic.isPending ? "Creando..." : "Crear mecánico"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
