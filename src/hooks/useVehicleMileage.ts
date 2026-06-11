import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { vehicleMileageService } from "@/services/vehicle-mileage.service";
import { vehicleKeys } from "@/hooks/useVehicles";
import { vehicleOilKeys } from "@/hooks/useVehicleOil";

export const mileageKeys = {
  history: (vehicleId: string) => ["vehicle-mileage", vehicleId] as const,
};

export function useVehicleMileageHistory(vehicleId: string) {
  return useQuery({
    queryKey: mileageKeys.history(vehicleId),
    queryFn: () => vehicleMileageService.getHistory(vehicleId),
    enabled: !!vehicleId,
  });
}

/**
 * Registra una lectura nueva de km. Invalida todo lo que muestra kilometraje:
 * listados y detalle de vehículos (chips de "actualizá el km") y la card de
 * aceite (su barra de progreso usa el km actual del vehículo).
 */
export function useReportVehicleMileage(vehicleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mileage: number) => vehicleMileageService.report(vehicleId, mileage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.all });
      queryClient.invalidateQueries({ queryKey: mileageKeys.history(vehicleId) });
      queryClient.invalidateQueries({ queryKey: vehicleOilKeys.byVehicle(vehicleId) });
      toast.success("Kilometraje actualizado. ¡Gracias por mantenerlo al día!");
    },
    // El mensaje de error específico (monotonía / salto absurdo) lo muestra el modal.
  });
}
