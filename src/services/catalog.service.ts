import apiClient from "@/lib/axios";
import {
  CatalogService,
  CreateCatalogServiceRequest,
  UpdateCatalogServiceRequest,
  PagedResult,
} from "@/types/api.types";

export interface CatalogParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export const catalogService = {
  getAll: async (params: CatalogParams = {}): Promise<CatalogService[]> => {
    const response = await apiClient.get<CatalogService[] | PagedResult<CatalogService>>(
      "/api/catalog-services",
      { params: { pageSize: 100, ...params } }
    );
    const raw = response.data;
    return Array.isArray(raw) ? raw : raw.items;
  },

  create: async (data: CreateCatalogServiceRequest): Promise<CatalogService> => {
    const response = await apiClient.post<CatalogService>("/api/catalog-services", data);
    return response.data;
  },

  update: async (id: string, data: UpdateCatalogServiceRequest): Promise<CatalogService> => {
    const response = await apiClient.put<CatalogService>(`/api/catalog-services/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/catalog-services/${id}`);
  },
};
