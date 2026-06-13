import { useQuery } from "@tanstack/react-query";

import { maintenanceService } from "@/services/maintenance.service";

export const maintenanceKeys = {
  summary: ["maintenance-summary"] as const,
};

/** Alertas de mantenimiento de los vehículos del cliente, para el tablero de Inicio. */
export function useMaintenanceSummary() {
  return useQuery({
    queryKey: maintenanceKeys.summary,
    queryFn: () => maintenanceService.getSummary(),
  });
}
