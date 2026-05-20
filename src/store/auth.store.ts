import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserRole } from "@/lib/enums";

interface AuthState {
  token: string | null;
  role: UserRole | null;
  userId: string | null;
  fullName: string | null;
  customerId: string | null;
  fleetId: string | null;
  mechanicId: string | null;
  isAuthenticated: boolean;

  // Acciones
  setSession: (data: {
    token: string;
    role: string;
    userId: string;
    fullName?: string;
    customerId?: string;
    fleetId?: string;
    mechanicId?: string;
  }) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      userId: null,
      fullName: null,
      customerId: null,
      fleetId: null,
      mechanicId: null,
      isAuthenticated: false,

      setSession: ({ token, role, userId, fullName, customerId, fleetId, mechanicId }) => {
        // También guardamos el token en localStorage para que el interceptor
        // de Axios lo lea desde fuera del store
        if (typeof window !== "undefined") {
          localStorage.setItem("token", token);
        }
        set({
          token,
          role: role as UserRole,
          userId,
          fullName: fullName ?? null,
          customerId: customerId ?? null,
          fleetId: fleetId ?? null,
          mechanicId: mechanicId ?? null,
          isAuthenticated: true,
        });
      },

      clearSession: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
        }
        set({
          token: null,
          role: null,
          userId: null,
          fullName: null,
          customerId: null,
          fleetId: null,
          mechanicId: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "auth-storage", // clave en localStorage — debe coincidir con la del interceptor
      // Solo persistimos lo necesario, no persistimos isAuthenticated
      // (lo derivamos de token en el hidration)
      partialize: (state) => ({
        token: state.token,
        role: state.role,
        userId: state.userId,
        fullName: state.fullName,
        customerId: state.customerId,
        fleetId: state.fleetId,
        mechanicId: state.mechanicId,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ─── Selector helpers ─────────────────────────────────────────────────────────
export const selectIsAdmin = (s: AuthState) => s.role === UserRole.Admin;
export const selectIsCustomer = (s: AuthState) =>
  s.role === UserRole.Customer;
export const selectIsMechanic = (s: AuthState) =>
  s.role === UserRole.Mechanic;
