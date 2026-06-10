import apiClient from "@/lib/axios";
import {
  Mechanic,
  CreateMechanicRequest,
  UpdateMechanicRequest,
  PagedResult,
} from "@/types/api.types";

export interface AdminMechanicsParams {
  search?: string;
  page?: number;
  pageSize?: number;
  isActive?: boolean;
}

export interface CreateMechanicResponse {
  mechanic: Mechanic;
  tempPassword: string;
}

export const adminMechanicsService = {
  getAll: async (
    params: AdminMechanicsParams = {}
  ): Promise<PagedResult<Mechanic>> => {
    const response = await apiClient.get<PagedResult<Mechanic>>(
      "/api/mechanics",
      { params: { page: 1, pageSize: 20, ...params } }
    );
    return response.data;
  },

  getById: async (id: string): Promise<Mechanic> => {
    const response = await apiClient.get<Mechanic>(`/api/mechanics/${id}`);
    return response.data;
  },

  create: async (
    data: CreateMechanicRequest
  ): Promise<CreateMechanicResponse> => {
    const response = await apiClient.post<CreateMechanicResponse>(
      "/api/mechanics",
      data
    );
    return response.data;
  },

  update: async (id: string, data: UpdateMechanicRequest): Promise<Mechanic> => {
    // El controller expone PATCH para actualizar el mecánico.
    const response = await apiClient.patch<Mechanic>(`/api/mechanics/${id}`, { id, ...data });
    return response.data;
  },

  deactivate: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/mechanics/${id}`);
  },

  /**
   * Sincroniza las áreas de un mecánico (PUT semantics: reemplazo total).
   * Pasar lista vacía deja al mecánico sin áreas asignadas.
   */
  assignAreas: async (id: string, areaIds: string[]): Promise<Mechanic> => {
    const response = await apiClient.put<Mechanic>(`/api/mechanics/${id}/areas`, { areaIds });
    return response.data;
  },
};
