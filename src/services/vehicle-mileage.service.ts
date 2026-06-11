import apiClient from "@/lib/axios";
import { VehicleMileageReading } from "@/types/api.types";

/**
 * Lecturas de kilometraje del vehículo: la carga periódica que hace el cliente
 * y el historial de trazabilidad. El km del ingreso al taller lo registra el
 * backend solo — acá solo viven las acciones del usuario.
 */
export const vehicleMileageService = {
  report: async (vehicleId: string, mileage: number): Promise<VehicleMileageReading> => {
    const response = await apiClient.post<VehicleMileageReading>(
      `/api/vehicles/${vehicleId}/mileage-readings`,
      { mileage },
    );
    return response.data;
  },

  getHistory: async (vehicleId: string): Promise<VehicleMileageReading[]> => {
    const response = await apiClient.get<VehicleMileageReading[]>(
      `/api/vehicles/${vehicleId}/mileage-readings`,
    );
    return response.data;
  },
};
