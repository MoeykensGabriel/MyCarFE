"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { customersService } from "@/services/customers.service";
import { useAuthStore } from "@/store/auth.store";

/**
 * Sincroniza la sesión con el backend cuando entra al portal.
 *
 * Cubre el caso en que el JWT/login no expone `fleetId` aunque el customer
 * sí tenga flota asociada en la DB. Sin esto, las pantallas que filtran
 * por `fleetId` (Mis vehículos, Mis órdenes) caen al filtro de `customerId`
 * y muestran datos inconsistentes con `Mi empresa`.
 */
export function useSessionSync() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role            = useAuthStore((s) => s.role);
  const customerId      = useAuthStore((s) => s.customerId);
  const fleetId         = useAuthStore((s) => s.fleetId);

  const { data: me } = useQuery({
    queryKey:  ["session", "me"],
    queryFn:   () => customersService.getMe(),
    // Solo Customers tienen endpoint /customers/me. Mechanics y Admins no.
    enabled:   isAuthenticated && role === "Customer",
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!me) return;

    const next: Partial<{ customerId: string; fleetId: string }> = {};
    if (me.id && me.id !== customerId)         next.customerId = me.id;
    if (me.fleetId && me.fleetId !== fleetId)  next.fleetId    = me.fleetId;

    if (Object.keys(next).length > 0) {
      useAuthStore.setState(next);
    }
  }, [me, customerId, fleetId]);
}
