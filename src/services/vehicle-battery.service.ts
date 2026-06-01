import apiClient from "@/lib/axios";
import type { VehicleBattery } from "@/types/api.types";

export const vehicleBatteryService = {
  /** Batería activa del vehículo con su historial de chequeos, o null si no hay (204). */
  get: async (vehicleId: string, includeReplaced = false): Promise<VehicleBattery | null> => {
    const r = await apiClient.get<VehicleBattery | "">(`/api/vehicles/${vehicleId}/battery`, {
      params: { includeReplaced },
    });
    // 204 No Content → axios entrega string vacío; lo normalizamos a null.
    return r.status === 204 || !r.data ? null : (r.data as VehicleBattery);
  },
};
