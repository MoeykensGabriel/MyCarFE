import apiClient from "@/lib/axios";
import { DashboardStats } from "@/types/api.types";

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>("/api/dashboard");
    return response.data;
  },
};
