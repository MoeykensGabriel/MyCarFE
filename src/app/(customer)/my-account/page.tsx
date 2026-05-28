"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, KeyRound, ShieldCheck } from "lucide-react";

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
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627]/80"
      >
        {label}
      </label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#44474c]/45 pointer-events-none" />
        <input
          id={id}
          type={show ? "text" : "password"}
          placeholder={placeholder ?? "••••••••"}
          autoComplete="off"
          className={`w-full pl-10 pr-11 py-3 text-sm rounded-xl border bg-white text-[#041627] placeholder:text-[#44474c]/40 focus:outline-none focus:ring-2 focus:ring-[#fea520]/20 focus:border-[#fea520] transition-all ${
            error
              ? "border-red-400 focus:ring-red-100 focus:border-red-400"
              : "border-[#041627]/10"
          }`}
          {...registration}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#44474c]/50 hover:text-[#041627] transition-colors"
          aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && (
        <p className="text-xs font-semibold text-red-500 flex items-center gap-1 mt-1 animate-[fadeIn_0.15s_ease-out]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
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
    <div className="space-y-5 pb-12">

      {/* ── Título y Header Premium ─────────────────────────────────────────── */}
      <div className="bg-[#041627] text-white rounded-2xl p-5 shadow-md shadow-[#041627]/10 relative overflow-hidden">
        {/* Decoración circular de fondo */}
        <div className="absolute -right-10 -bottom-10 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-[#fea520]" />
            <h1 className="text-lg font-extrabold tracking-wide">Mi Cuenta</h1>
          </div>
          <p className="text-xs font-semibold text-white/60 mt-1">
            Gestioná la seguridad y accesos de tu cuenta
          </p>
        </div>
      </div>

      {/* ── Card Principal de Formulario ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#041627]/10 shadow-md overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#fea520]" />

        {/* Card header */}
        <div className="flex items-start gap-3.5 px-5 py-4.5 border-b border-[#041627]/5 bg-gradient-to-r from-[#eefcfd] to-white">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#041627] to-[#0a2540] flex items-center justify-center shrink-0 border border-[#fea520]/20 shadow">
            <ShieldCheck className="w-5 h-5 text-[#fea520]" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-[#041627] uppercase tracking-wider">Cambiar Contraseña</p>
            <p className="text-[11px] text-[#44474c]/80 font-semibold mt-0.5 leading-snug">
              Usá una clave robusta para mantener resguardado tu historial vehicular
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4" noValidate>

          <PasswordField
            id="currentPassword"
            label="Contraseña actual"
            placeholder="Ingresá tu contraseña actual"
            error={errors.currentPassword?.message}
            registration={register("currentPassword")}
          />

          <PasswordField
            id="newPassword"
            label="Nueva contraseña"
            placeholder="Mínimo 8 caracteres (1 mayúscula y 1 número)"
            error={errors.newPassword?.message}
            registration={register("newPassword")}
          />

          <PasswordField
            id="confirmPassword"
            label="Confirmar nueva contraseña"
            placeholder="Repetí tu nueva contraseña"
            error={errors.confirmPassword?.message}
            registration={register("confirmPassword")}
          />

          {/* Error servidor */}
          {serverError && (
            <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4 animate-[fadeIn_0.2s_ease-out]">
              <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4.5 h-4.5 text-red-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-red-800 uppercase tracking-wider">No se pudo actualizar</p>
                <p className="text-xs font-semibold text-red-700 leading-normal mt-0.5">{serverError}</p>
              </div>
            </div>
          )}

          {/* Éxito */}
          {success && (
            <div className="flex items-start gap-3 rounded-xl bg-green-50 border border-green-200 p-4 animate-[fadeIn_0.2s_ease-out]">
              <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4.5 h-4.5 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-green-800 uppercase tracking-wider">¡Éxito!</p>
                <p className="text-xs font-bold text-green-700 leading-normal mt-0.5">
                  Tu contraseña fue cambiada exitosamente.
                </p>
              </div>
            </div>
          )}

          {/* Botón de envío táctil premium */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-widest bg-gradient-to-r from-[#fea520] to-[#fec15d] text-[#041627] hover:shadow-md hover:shadow-[#fea520]/10 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 mt-2 shadow shadow-[#fea520]/15"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin text-[#041627]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Guardando clave...
              </span>
            ) : (
              "Actualizar contraseña"
            )}
          </button>
        </form>
      </div>

      {/* ── Contacto con el taller ──────────────────────────────────────────── */}
      <ContactWorkshopCard
        title="¿Problemas de seguridad?"
        subtitle="Si sospechás que tu cuenta corre riesgos o tenés dudas de accesos, contactanos de inmediato."
      />
    </div>
  );
}
