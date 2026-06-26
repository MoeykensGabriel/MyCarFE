import apiClient from "@/lib/axios";
import { PagedResult } from "@/types/api.types";
import { Sale, CreateSalePayload, SalesParams } from "@/types/sales.types";

export const salesService = {
  getAll: async (params: SalesParams = {}): Promise<PagedResult<Sale>> => {
    const response = await apiClient.get<PagedResult<Sale>>("/api/sales", {
      params: { page: 1, pageSize: 20, ...params },
    });
    return response.data;
  },

  getById: async (id: string): Promise<Sale> => {
    const response = await apiClient.get<Sale>(`/api/sales/${id}`);
    return response.data;
  },

  create: async (payload: CreateSalePayload): Promise<Sale> => {
    const response = await apiClient.post<Sale>("/api/sales", payload);
    return response.data;
  },
};
