import apiClient from "@/lib/axios";
import { MaintenanceAlertConfig, MaintenanceAlertItemInput } from "@/types/api.types";

/**
 * Alertas de mantenimiento configurables por vehículo (las define el recepcionista en
 * el ingreso y las edita el admin desde la ficha). El customer las ve, cuando vencen,
 * en /api/maintenance/summary.
 */
export const maintenanceAlertsService = {
  getByVehicle: async (vehicleId: string): Promise<MaintenanceAlertConfig[]> => {
    const res = await apiClient.get<MaintenanceAlertConfig[]>(
      `/api/vehicles/${vehicleId}/maintenance-alerts`,
    );
    return res.data;
  },

  /** Set "replace": reemplaza el set completo de alertas del vehículo. */
  set: async (
    vehicleId: string,
    items: MaintenanceAlertItemInput[],
    config?: object,
  ): Promise<MaintenanceAlertConfig[]> => {
    const res = await apiClient.put<MaintenanceAlertConfig[]>(
      `/api/vehicles/${vehicleId}/maintenance-alerts`,
      { items },
      config,
    );
    return res.data;
  },

  reset: async (vehicleId: string, alertId: string): Promise<MaintenanceAlertConfig> => {
    const res = await apiClient.post<MaintenanceAlertConfig>(
      `/api/vehicles/${vehicleId}/maintenance-alerts/${alertId}/reset`,
    );
    return res.data;
  },
};
