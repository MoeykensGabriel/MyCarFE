import apiClient from "@/lib/axios";
import { CreateVehicleRequest, PagedResult, Vehicle } from "@/types/api.types";

export interface VehiclesParams {
  customerId?: string;
  fleetId?: string;
  search?: string;  // patente, marca, modelo
  page?: number;
  pageSize?: number;
}

export const vehiclesService = {
  getAll: async (params: VehiclesParams = {}): Promise<PagedResult<Vehicle>> => {
    const response = await apiClient.get<Vehicle[] | PagedResult<Vehicle>>("/api/vehicles", {
      params: { page: 1, pageSize: 20, ...params },
    });
    const raw = response.data;
    if (Array.isArray(raw)) {
      return {
        items:           raw,
        totalCount:      raw.length,
        totalPages:      1,
        page:            1,
        pageSize:        raw.length,
        hasNextPage:     false,
        hasPreviousPage: false,
      };
    }
    return raw;
  },

  getById: async (id: string): Promise<Vehicle> => {
    const response = await apiClient.get<Vehicle>(`/api/vehicles/${id}`);
    return response.data;
  },

  create: async (data: CreateVehicleRequest): Promise<{ id: string }> => {
    const response = await apiClient.post<{ id: string } | string>("/api/vehicles", data);
    const raw = response.data;
    return typeof raw === "string" ? { id: raw } : raw;
  },
};
