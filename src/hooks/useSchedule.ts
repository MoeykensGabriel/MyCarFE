import { useQuery } from "@tanstack/react-query";
import { scheduleService } from "@/services/schedule.service";

export const scheduleKeys = {
  all: ["schedule"] as const,
  range: (from: string, to: string) => [...scheduleKeys.all, from, to] as const,
};

export function useSchedule(from: string, to: string) {
  return useQuery({
    queryKey: scheduleKeys.range(from, to),
    queryFn: () => scheduleService.getSchedule({ from, to }),
    enabled: !!from && !!to,
  });
}

export function useOccupancy(from: string, to: string) {
  return useQuery({
    queryKey: [...scheduleKeys.all, "occupancy", from, to] as const,
    queryFn: () => scheduleService.getOccupancy({ from, to }),
    enabled: !!from && !!to,
  });
}
