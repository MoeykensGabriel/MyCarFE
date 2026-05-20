import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: dashboardService.getStats,
    staleTime: 60_000, // 1 min — datos del día, no necesita refresco agresivo
  });
}
