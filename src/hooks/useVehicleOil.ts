import { useQuery } from "@tanstack/react-query";
import { vehicleOilService } from "@/services/vehicle-oil.service";

export const vehicleOilKeys = {
  all: ["vehicle-oil"] as const,
  byVehicle: (vehicleId: string) =>
    [...vehicleOilKeys.all, "by-vehicle", vehicleId] as const,
};

export function useVehicleOil(vehicleId: string | undefined) {
  return useQuery({
    queryKey: vehicleOilKeys.byVehicle(vehicleId ?? ""),
    queryFn:  () => vehicleOilService.get(vehicleId!),
    enabled:  !!vehicleId,
  });
}
