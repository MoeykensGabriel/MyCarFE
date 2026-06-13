import apiClient from "@/lib/axios";
import { MaintenanceAlert } from "@/types/api.types";

/**
 * Resumen de mantenimiento del cliente: las alertas de todos sus vehículos en
 * una sola respuesta (hoy cubiertas; aceite y batería se suman después). El
 * backend resuelve el dueño desde el JWT — no se pasan ids.
 */
export const maintenanceService = {
  getSummary: async (): Promise<MaintenanceAlert[]> => {
    const response = await apiClient.get<MaintenanceAlert[]>("/api/maintenance/summary");
    return response.data;
  },
};
