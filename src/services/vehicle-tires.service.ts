import apiClient from "@/lib/axios";
import type {
  AddTireMeasurementRequest,
  CreateVehicleTireRequest,
  ReplaceTireRequest,
  VehicleTire,
} from "@/types/api.types";

export const vehicleTiresService = {
  list: async (vehicleId: string, includeReplaced = false): Promise<VehicleTire[]> => {
    const r = await apiClient.get<VehicleTire[]>(`/api/vehicles/${vehicleId}/tires`, {
      params: { includeReplaced },
    });
    return r.data;
  },

  create: async (vehicleId: string, data: CreateVehicleTireRequest): Promise<VehicleTire> => {
    const r = await apiClient.post<VehicleTire>(`/api/vehicles/${vehicleId}/tires`, data);
    return r.data;
  },

  addMeasurement: async (tireId: string, data: AddTireMeasurementRequest): Promise<VehicleTire> => {
    const r = await apiClient.post<VehicleTire>(`/api/tires/${tireId}/measurements`, data);
    return r.data;
  },

  replace: async (tireId: string, data: ReplaceTireRequest): Promise<VehicleTire> => {
    const r = await apiClient.post<VehicleTire>(`/api/tires/${tireId}/replace`, data);
    return r.data;
  },
};
