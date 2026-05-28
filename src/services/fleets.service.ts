import apiClient from "@/lib/axios";
import {
  CreateFleetRequest,
  Fleet,
  FleetDetail,
  PagedResult,
  UpdateFleetRequest,
} from "@/types/api.types";

export interface FleetsParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export const fleetsService = {
  getAll: async (params: FleetsParams = {}): Promise<PagedResult<Fleet>> => {
    const response = await apiClient.get<Fleet[] | PagedResult<Fleet>>("/api/fleets", {
      params: { page: 1, pageSize: 20, ...params },
    });
    const raw = response.data;
    if (Array.isArray(raw)) {
      return {
        items: raw,
        totalCount: raw.length,
        totalPages: 1,
        page: 1,
        pageSize: raw.length,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    }
    return raw;
  },

  getById: async (id: string): Promise<FleetDetail> => {
    const response = await apiClient.get<FleetDetail>(`/api/fleets/${id}`);
    return response.data;
  },

  create: async (data: CreateFleetRequest, config?: any): Promise<string> => {
    const response = await apiClient.post<string | { id: string }>("/api/fleets", data, config);
    const raw = response.data;
    return typeof raw === "string" ? raw : raw.id;
  },

  update: async (id: string, data: UpdateFleetRequest): Promise<Fleet> => {
    const response = await apiClient.put<Fleet>(`/api/fleets/${id}`, data);
    return response.data;
  },

  getMine: async (): Promise<FleetDetail> => {
    const response = await apiClient.get<FleetDetail>("/api/fleets/mine");
    return response.data;
  },
};
