import apiClient from "@/lib/axios";
import type { ScheduleSlot, Occupancy } from "@/types/api.types";

export const scheduleService = {
  /**
   * Trae los slots de calendario que intersectan [from, to].
   * Si se omiten, el BE devuelve la semana actual (lun-dom).
   */
  getSchedule: async (params?: { from?: string; to?: string }): Promise<ScheduleSlot[]> => {
    const response = await apiClient.get<ScheduleSlot[]>("/api/schedule", { params });
    return response.data;
  },

  /**
   * Ocupación física del taller en [from, to]: vehículos agendados (post-aprobación)
   * que ocupan bahía + capacidad configurable.
   */
  getOccupancy: async (params?: { from?: string; to?: string }): Promise<Occupancy> => {
    const response = await apiClient.get<Occupancy>("/api/schedule/occupancy", { params });
    return response.data;
  },
};
