"use client";

import { useEffect, useRef, useState } from "react";

import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { UserRole } from "@/lib/enums";

interface SessionGuardProps {
  children: React.ReactNode;
}

/**
 * Verifica que exista un token en localStorage antes de renderizar la zona
 * protegida.
 *
 * ¿Por qué no llamamos a /api/auth/me aquí?
 * - El interceptor de Axios (src/lib/axios.ts) ya maneja los 401 globalmente:
 *   si cualquier llamada a la API devuelve 401, limpia localStorage y redirige
 *   a /login. No necesitamos duplicar esa lógica acá.
 * - Llamar a me() en el mount introduce un punto de fallo de red que puede
 *   expulsar al usuario aunque el token sea válido (error de red, BE caído,
 *   CORS, etc.).
 *
 * Flujo simplificado:
 * 1. Lee el token desde localStorage (no desde Zustand — Zustand persist es
 *    async y en el primer render puede verse como null aunque el token exista).
 * 2. Sin token → redirige a /login (hard redirect para evitar race conditions
 *    con el router de Next.js).
 * 3. Con token → renderiza children. Si el token expiró, la primera llamada
 *    API devolverá 401 y el interceptor de Axios redirigirá.
 */
export function SessionGuard({ children }: SessionGuardProps) {
  const [ready, setReady] = useState(false);

  const role       = useAuthStore((s) => s.role);
  const mechanicId = useAuthStore((s) => s.mechanicId);
  const setSession = useAuthStore((s) => s.setSession);
  const refreshed  = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.replace("/login");
      return;
    }

    setReady(true);
  }, []);

  // El perfil de ejecutante del admin se crea en el login, así que un token emitido antes
  // no trae el claim mechanicId y los botones de tomar/hacer trabajos no aparecerían hasta
  // que cierre sesión. Lo resolvemos reemitiendo la sesión una sola vez.
  //
  // Si falla lo dejamos pasar en silencio: es una mejora de la sesión, no una condición para
  // entrar — y un 401 ya lo maneja el interceptor de Axios.
  useEffect(() => {
    if (!ready || refreshed.current) return;
    if (role !== UserRole.Admin || mechanicId) return;

    refreshed.current = true;

    authService
      .refreshSession()
      .then((session) => {
        if (!session.mechanicId) return;

        setSession(session);
        localStorage.setItem("role", session.role);
        document.cookie = `token=${session.token}; path=/; samesite=strict; secure`;
        document.cookie = `role=${session.role}; path=/; samesite=strict; secure`;
      })
      .catch(() => {});
  }, [ready, role, mechanicId, setSession]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-sm text-muted-foreground">Cargando...</span>
      </div>
    );
  }

  return <>{children}</>;
}
