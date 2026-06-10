"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useAuthStore } from "@/store/auth.store";

/**
 * Hook central de autenticación.
 * Expone el estado del store + acciones con side-effects (router, cookies).
 * Usar este hook en componentes — no acceder al store directamente para logout.
 */
export function useAuth() {
  const store = useAuthStore();
  const router = useRouter();

  const logout = useCallback(() => {
    store.clearSession();
    // Limpiar cookies que usa el proxy (Edge runtime). `secure` para que el
    // navegador acepte pisar las cookies Secure que setea el login.
    document.cookie = "token=; path=/; max-age=0; samesite=strict; secure";
    document.cookie = "role=; path=/; max-age=0; samesite=strict; secure";
    router.push("/login");
  }, [store, router]);

  return {
    token: store.token,
    role: store.role,
    userId: store.userId,
    fullName: store.fullName,
    customerId: store.customerId,
    fleetId: store.fleetId,
    mechanicId: store.mechanicId,
    isAuthenticated: store.isAuthenticated,
    logout,
  };
}
