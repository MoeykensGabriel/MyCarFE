import apiClient from "@/lib/axios";
import {
  Area,
  CreateAreaRequest,
  UpdateAreaRequest,
} from "@/types/api.types";

export const areasService = {
  /**
   * Lista áreas. Admin puede pedir includeInactive=true (el BE lo ignora si no es Admin).
   */
  getAll: async (includeInactive = false): Promise<Area[]> => {
    const response = await apiClient.get<Area[]>("/api/areas", {
      params: { includeInactive },
    });
    return response.data;
  },

  getById: async (id: string): Promise<Area> => {
    const response = await apiClient.get<Area>(`/api/areas/${id}`);
    return response.data;
  },

  create: async (data: CreateAreaRequest): Promise<Area> => {
    const response = await apiClient.post<Area>("/api/areas", data);
    return response.data;
  },

  update: async (id: string, data: UpdateAreaRequest): Promise<Area> => {
    const response = await apiClient.patch<Area>(`/api/areas/${id}`, data);
    return response.data;
  },

  /** Soft-delete + IsActive=false */
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/areas/${id}`);
  },
};
