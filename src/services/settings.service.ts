import apiClient from "@/lib/axios";
import { WorkshopSettings, UpdateWorkshopSettingsRequest } from "@/types/api.types";

export const settingsService = {
  /** Lee la configuración del taller. Solo Admin. */
  getWorkshop: async (): Promise<WorkshopSettings> => {
    const response = await apiClient.get<WorkshopSettings>("/api/settings/workshop");
    return response.data;
  },

  /** Actualiza la configuración del taller. Solo Admin. */
  updateWorkshop: async (data: UpdateWorkshopSettingsRequest): Promise<WorkshopSettings> => {
    const response = await apiClient.put<WorkshopSettings>("/api/settings/workshop", data);
    return response.data;
  },
};
