import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { maintenanceAlertsService } from "@/services/maintenance-alerts.service";
import { MaintenanceAlertItemInput } from "@/types/api.types";

export const maintenanceAlertKeys = {
  all: ["maintenance-alerts"] as const,
  byVehicle: (vehicleId: string) => [...maintenanceAlertKeys.all, vehicleId] as const,
};

/** Alertas de mantenimiento configuradas de un vehículo (ficha admin). */
export function useVehicleMaintenanceAlerts(vehicleId: string) {
  return useQuery({
    queryKey: maintenanceAlertKeys.byVehicle(vehicleId),
    queryFn: () => maintenanceAlertsService.getByVehicle(vehicleId),
    enabled: !!vehicleId,
  });
}

export function useSetVehicleMaintenanceAlerts(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: MaintenanceAlertItemInput[]) =>
      maintenanceAlertsService.set(vehicleId, items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: maintenanceAlertKeys.byVehicle(vehicleId) });
      // El resumen del customer depende de estas alertas.
      qc.invalidateQueries({ queryKey: ["maintenance-summary"] });
      toast.success("Alertas de mantenimiento guardadas");
    },
    onError: () => toast.error("No se pudieron guardar las alertas"),
  });
}

export function useResetMaintenanceAlert(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) => maintenanceAlertsService.reset(vehicleId, alertId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: maintenanceAlertKeys.byVehicle(vehicleId) });
      qc.invalidateQueries({ queryKey: ["maintenance-summary"] });
      toast.success("Alerta reiniciada");
    },
    onError: () => toast.error("No se pudo reiniciar la alerta"),
  });
}
