import { useQuery } from "@tanstack/react-query";
import { vehicleBatteryService } from "@/services/vehicle-battery.service";

export const vehicleBatteryKeys = {
  all: ["vehicle-battery"] as const,
  byVehicle: (vehicleId: string, includeReplaced: boolean) =>
    [...vehicleBatteryKeys.all, "by-vehicle", vehicleId, includeReplaced] as const,
};

export function useVehicleBattery(vehicleId: string | undefined, includeReplaced = false) {
  return useQuery({
    queryKey: vehicleBatteryKeys.byVehicle(vehicleId ?? "", includeReplaced),
    queryFn:  () => vehicleBatteryService.get(vehicleId!, includeReplaced),
    enabled:  !!vehicleId,
  });
}
