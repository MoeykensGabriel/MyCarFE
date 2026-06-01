import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { vehicleTiresService } from "@/services/vehicle-tires.service";
import type {
  AddTireMeasurementRequest,
  CreateVehicleTireRequest,
  ReplaceTireRequest,
} from "@/types/api.types";

export const vehicleTiresKeys = {
  all: ["vehicle-tires"] as const,
  byVehicle: (vehicleId: string, includeReplaced: boolean) =>
    [...vehicleTiresKeys.all, "by-vehicle", vehicleId, includeReplaced] as const,
};

export function useVehicleTires(vehicleId: string | undefined, includeReplaced = false) {
  return useQuery({
    queryKey: vehicleTiresKeys.byVehicle(vehicleId ?? "", includeReplaced),
    queryFn:  () => vehicleTiresService.list(vehicleId!, includeReplaced),
    enabled:  !!vehicleId,
  });
}

/** Invalida todas las queries de cubiertas del vehículo (con/sin reemplazadas). */
function invalidateVehicle(qc: ReturnType<typeof useQueryClient>, vehicleId: string) {
  qc.invalidateQueries({ queryKey: [...vehicleTiresKeys.all, "by-vehicle", vehicleId] });
}

export function useCreateVehicleTire(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVehicleTireRequest) => vehicleTiresService.create(vehicleId, data),
    onSuccess: () => {
      invalidateVehicle(qc, vehicleId);
      toast.success("Cubierta agregada");
    },
    onError: () => toast.error("No se pudo agregar la cubierta"),
  });
}

export function useAddTireMeasurement(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tireId, data }: { tireId: string; data: AddTireMeasurementRequest }) =>
      vehicleTiresService.addMeasurement(tireId, data),
    onSuccess: () => {
      invalidateVehicle(qc, vehicleId);
      toast.success("Medición registrada");
    },
    onError: () => toast.error("No se pudo registrar la medición"),
  });
}

export function useReplaceTire(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tireId, data }: { tireId: string; data: ReplaceTireRequest }) =>
      vehicleTiresService.replace(tireId, data),
    onSuccess: () => {
      invalidateVehicle(qc, vehicleId);
      toast.success("Cubierta reemplazada");
    },
    onError: () => toast.error("No se pudo reemplazar la cubierta"),
  });
}
