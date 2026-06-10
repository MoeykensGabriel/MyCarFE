"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Wrench, Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";
import { AxiosError } from "axios";

import { UserRole } from "@/lib/enums";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { ProblemDetails } from "@/types/api.types";

// ─── Schema ───────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email:    z.string().min(1, "Ingresá tu email").email("Ingresá un email válido. Ej: nombre@empresa.com"),
  password: z.string().min(1, "Ingresá tu contraseña"),
});

type LoginForm = z.infer<typeof loginSchema>;

// ─── Componente ───────────────────────────────────────────────────────────────

export default function LoginPage() {
  const setSession  = useAuthStore((s) => s.setSession);
  const [serverError,   setServerError]   = useState<string | null>(null);
  const [showPassword,  setShowPassword]  = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setServerError(null);
    try {
      const response = await authService.login(data);

      setSession(response);
      localStorage.setItem("role", response.role);

      // Setear cookies para que el middleware (Edge/Node) pueda leer el rol
      // y proteger las rutas sin acceso a localStorage. `secure` evita que
      // viajen por HTTP plano (los navegadores igual las permiten en localhost).
      document.cookie = `token=${response.token}; path=/; samesite=strict; secure`;
      document.cookie = `role=${response.role}; path=/; samesite=strict; secure`;

      const target =
        response.role === "Admin"        ? "/admin/dashboard"
      : response.role === "Mechanic"     ? "/mechanic/tasks"
      : response.role === "Receptionist" ? "/reception/intake"
      : response.fleetId                 ? "/my-fleet"
      :                                    "/my-orders";

      window.location.href = target;
    } catch (err) {
      const axiosError = err as AxiosError<ProblemDetails>;
      const status     = axiosError.response?.status;

      // ── Network error (back caído, certificado HTTPS no confiado, CORS, etc.)
      if (!axiosError.response) {
        const isCertError =
          axiosError.code === "ERR_NETWORK" ||
          axiosError.message?.includes("Network");
        setServerError(
          isCertError
            ? "No se pudo conectar al servidor. Verificá que el backend esté corriendo y el certificado HTTPS confiado (`dotnet dev-certs https --trust`)."
            : "Sin conexión con el servidor. Intentá de nuevo."
        );
        return;
      }

      // ── 401: credenciales incorrectas (caso más común).
      // Mensaje fijo en español, independiente de lo que mande el back, para
      // dar feedback inmediato y consistente al usuario.
      if (status === 401) {
        setServerError("Email o contraseña incorrectos. Verificá y volvé a intentar.");
        return;
      }

      // ── 400: validación del lado back (ej: email sin formato)
      if (status === 400) {
        const detail = axiosError.response.data?.detail;
        setServerError(detail ?? "Los datos ingresados no son válidos.");
        return;
      }

      // ── 500+ u otros: error del servidor, mensaje genérico
      setServerError(
        status && status >= 500
          ? "Hay un problema en el servidor. Intentá de nuevo en unos minutos."
          : `Error al iniciar sesión (código ${status ?? "desconocido"}).`
      );
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background: "linear-gradient(135deg, #0a1f35 0%, #041627 50%, #0d2744 100%)",
      }}
    >
      {/* Fondo con círculos decorativos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/[0.02]" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-[#fea520]/[0.04]" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full bg-white/[0.015]" />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Franja superior amber */}
        <div className="h-1 w-full bg-[#fea520]" />

        <div className="px-8 py-10">

          {/* Brand */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#041627] flex items-center justify-center mb-4 shadow-md">
              <Wrench className="w-7 h-7 text-[#fea520]" />
            </div>
            <h1 className="text-2xl font-bold text-[#041627] tracking-tight">MyCarApp</h1>
            <p className="text-xs font-bold uppercase tracking-widest text-[#44474c]/60 mt-1">
              Gestión de taller
            </p>
          </div>

          {/* Título de sección */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[#041627]">Bienvenido</h2>
            <p className="text-sm text-[#44474c] mt-0.5">Ingresá con tu cuenta para continuar</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-[11px] font-bold uppercase tracking-widest text-[#041627]"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#44474c]/40" />
                <input
                  id="email"
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border bg-white text-[#041627] placeholder:text-[#44474c]/40 focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all ${
                    errors.email
                      ? "border-red-400 focus:ring-red-200 focus:border-red-400"
                      : "border-[#c4c6cd]"
                  }`}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-[11px] font-bold uppercase tracking-widest text-[#041627]"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#44474c]/40" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  className={`w-full pl-10 pr-11 py-2.5 text-sm rounded-xl border bg-white text-[#041627] placeholder:text-[#44474c]/40 focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all ${
                    errors.password
                      ? "border-red-400 focus:ring-red-200 focus:border-red-400"
                      : "border-[#c4c6cd]"
                  }`}
                  {...register("password")}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-[#44474c]/50 hover:text-[#041627] transition-colors"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />
                  }
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Error del servidor */}
            {serverError && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{serverError}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 mt-2 rounded-xl text-sm font-bold bg-[#fea520] text-[#041627] hover:bg-[#e8951d] active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Ingresando...
                </span>
              ) : (
                "Ingresar"
              )}
            </button>
          </form>
        </div>

        {/* Footer de la card */}
        <div className="px-8 py-4 bg-[#eefcfd]/60 border-t border-[#c4c6cd]/40 text-center">
          <p className="text-xs text-[#44474c]/60">
            © {new Date().getFullYear()} MyCarApp · Gestión de taller
          </p>
        </div>
      </div>
    </main>
  );
}
