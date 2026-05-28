import apiClient from "@/lib/axios";
import type {
  CreateVehicleDocumentRequest,
  UpcomingExpiration,
  UpdateVehicleDocumentRequest,
  VehicleDocument,
} from "@/types/api.types";

export const vehicleDocumentsService = {
  list: async (vehicleId: string): Promise<VehicleDocument[]> => {
    const r = await apiClient.get<VehicleDocument[]>(`/api/vehicles/${vehicleId}/documents`);
    return r.data;
  },

  create: async (vehicleId: string, data: CreateVehicleDocumentRequest): Promise<VehicleDocument> => {
    const r = await apiClient.post<VehicleDocument>(`/api/vehicles/${vehicleId}/documents`, data);
    return r.data;
  },

  update: async (
    vehicleId: string,
    id: string,
    data: UpdateVehicleDocumentRequest,
  ): Promise<VehicleDocument> => {
    const r = await apiClient.patch<VehicleDocument>(
      `/api/vehicles/${vehicleId}/documents/${id}`,
      data,
    );
    return r.data;
  },

  remove: async (vehicleId: string, id: string): Promise<void> => {
    await apiClient.delete(`/api/vehicles/${vehicleId}/documents/${id}`);
  },

  upcomingForMe: async (horizonDays: number = 60): Promise<UpcomingExpiration[]> => {
    const r = await apiClient.get<UpcomingExpiration[]>(
      `/api/customers/me/upcoming-expirations`,
      { params: { horizon: horizonDays } },
    );
    return r.data;
  },
};
