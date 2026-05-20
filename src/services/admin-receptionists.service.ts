import apiClient from "@/lib/axios";
import {
  Receptionist,
  CreateReceptionistRequest,
  UpdateReceptionistRequest,
  PagedResult,
} from "@/types/api.types";

export interface AdminReceptionistsParams {
  search?: string;
  page?: number;
  pageSize?: number;
  includeInactive?: boolean;
}

export interface CreateReceptionistResponse {
  receptionist: Receptionist;
  tempPassword: string;
}

export const adminReceptionistsService = {
  getAll: async (
    params: AdminReceptionistsParams = {}
  ): Promise<PagedResult<Receptionist>> => {
    const response = await apiClient.get<PagedResult<Receptionist>>(
      "/api/receptionists",
      { params: { page: 1, pageSize: 20, ...params } }
    );
    return response.data;
  },

  getById: async (id: string): Promise<Receptionist> => {
    const response = await apiClient.get<Receptionist>(`/api/receptionists/${id}`);
    return response.data;
  },

  create: async (
    data: CreateReceptionistRequest
  ): Promise<CreateReceptionistResponse> => {
    const response = await apiClient.post<CreateReceptionistResponse>(
      "/api/receptionists",
      data
    );
    return response.data;
  },

  update: async (id: string, data: UpdateReceptionistRequest): Promise<Receptionist> => {
    const response = await apiClient.patch<Receptionist>(`/api/receptionists/${id}`, data);
    return response.data;
  },

  deactivate: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/receptionists/${id}`);
  },
};
