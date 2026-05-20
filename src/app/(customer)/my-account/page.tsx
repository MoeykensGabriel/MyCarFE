"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, KeyRound } from "lucide-react";

import { authService } from "@/services/auth.service";
import { ProblemDetails } from "@/types/api.types";
import { passwordSchema } from "@/lib/form-validation";
import { M } from "@/lib/form-messages";
import { ContactWorkshopCard } from "@/components/shared/ContactWorkshopCard";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z
  .object({
    currentPassword: z.string().min(1, M.currentPasswordRequired),
    newPassword:     passwordSchema,
    confirmPassword: z.string().min(1, "Confirmá la nueva contraseña"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: M.passwordsDoNotMatch,
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

// ─── Campo con show/hide ───────────────────────────────────────────────────────

function PasswordField({
  id,
  label,
  placeholder,
  error,
  registration,
}: {
  id: string;
  label: string;
  placeholder?: string;
  error?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registration: any;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="text-[11px] font-bold uppercase tracking-widest text-[#041627]"
      >
        {label}
      </label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#44474c]/40 pointer-events-none" />
        <input
          id={id}
          type={show ? "text" : "password"}
          placeholder={placeholder ?? "••••••••"}
          autoComplete="off"
          className={`w-full pl-10 pr-11 py-2.5 text-sm rounded-xl border bg-white text-[#041627] placeholder:text-[#44474c]/40 focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all ${
            error
              ? "border-red-400 focus:ring-red-200 focus:border-red-400"
              : "border-[#c4c6cd]"
          }`}
          {...registration}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-[#44474c]/50 hover:text-[#041627] transition-colors"
          aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function MyAccountPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess]         = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    setServerError(null);
    setSuccess(false);
    try {
      await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword:     data.newPassword,
      });
      setSuccess(true);
      reset();
    } catch (err) {
      const axiosErr = err as AxiosError<ProblemDetails>;
      const detail   = axiosErr.response?.data?.detail;
      const title    = axiosErr.response?.data?.title;
      const status   = axiosErr.response?.status;
      setServerError(
        detail ?? title ?? `Error ${status ?? ""} al cambiar la contraseña`
      );
    }
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#041627]">Mi cuenta</h1>
        <p className="text-sm text-[#44474c] mt-0.5">
          Administrá la seguridad de tu cuenta
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-[#c4c6cd] shadow-sm overflow-hidden">

        {/* Card header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#c4c6cd]/60 bg-[#eefcfd]/60">
          <div className="w-9 h-9 rounded-xl bg-[#041627] flex items-center justify-center shrink-0">
            <KeyRound className="w-4 h-4 text-[#fea520]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#041627]">Cambiar contraseña</p>
            <p className="text-xs text-[#44474c]/70">
              Usá una contraseña segura que no uses en otros sitios
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-5 space-y-4" noValidate>

          <PasswordField
            id="currentPassword"
            label="Contraseña actual"
            placeholder="Tu contraseña actual"
            error={errors.currentPassword?.message}
            registration={register("currentPassword")}
          />

          <PasswordField
            id="newPassword"
            label="Nueva contraseña"
            placeholder="8+ caracteres, 1 mayúscula y 1 número"
            error={errors.newPassword?.message}
            registration={register("newPassword")}
          />

          <PasswordField
            id="confirmPassword"
            label="Confirmar nueva contraseña"
            error={errors.confirmPassword?.message}
            registration={register("confirmPassword")}
          />

          {/* Error servidor */}
          {serverError && (
            <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{serverError}</p>
            </div>
          )}

          {/* Éxito */}
          {success && (
            <div className="flex items-start gap-2.5 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm text-green-700 font-medium">
                ¡Contraseña actualizada correctamente!
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl text-sm font-bold bg-[#fea520] text-[#041627] hover:bg-[#e8951d] active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Guardando...
              </span>
            ) : (
              "Actualizar contraseña"
            )}
          </button>
        </form>
      </div>

      {/* ── Contacto con el taller ──────────────────────────────────────────── */}
      <ContactWorkshopCard
        title="¿Necesitás ayuda?"
        subtitle="Estamos disponibles para cualquier consulta."
      />
    </div>
  );
}
