"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.replace("/login");
      return;
    }

    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-sm text-muted-foreground">Cargando...</span>
      </div>
    );
  }

  return <>{children}</>;
}
