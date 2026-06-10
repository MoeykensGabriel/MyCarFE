import apiClient from "@/lib/axios";
import type { VehicleOilService } from "@/types/api.types";

export const vehicleOilService = {
  /** Estado del aceite del vehículo (último cambio + próximo service), o null si no hay (204). */
  get: async (vehicleId: string): Promise<VehicleOilService | null> => {
    const r = await apiClient.get<VehicleOilService | "">(`/api/vehicles/${vehicleId}/oil-service`);
    // 204 No Content → axios entrega string vacío; lo normalizamos a null.
    return r.status === 204 || !r.data ? null : (r.data as VehicleOilService);
  },
};
