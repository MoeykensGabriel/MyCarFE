import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { vehicleDocumentsService } from "@/services/vehicle-documents.service";
import type {
  CreateVehicleDocumentRequest,
  UpdateVehicleDocumentRequest,
} from "@/types/api.types";

export const vehicleDocumentsKeys = {
  all: ["vehicle-documents"] as const,
  byVehicle: (vehicleId: string) => [...vehicleDocumentsKeys.all, "by-vehicle", vehicleId] as const,
  upcomingForMe: (horizon: number) =>
    [...vehicleDocumentsKeys.all, "upcoming-for-me", horizon] as const,
};

export function useVehicleDocuments(vehicleId: string | undefined) {
  return useQuery({
    queryKey: vehicleDocumentsKeys.byVehicle(vehicleId ?? ""),
    queryFn:  () => vehicleDocumentsService.list(vehicleId!),
    enabled:  !!vehicleId,
  });
}

export function useUpcomingExpirationsForMe(horizonDays: number = 60) {
  return useQuery({
    queryKey: vehicleDocumentsKeys.upcomingForMe(horizonDays),
    queryFn:  () => vehicleDocumentsService.upcomingForMe(horizonDays),
    // Refresca cada vez que el cliente entra a una pantalla que lo usa
    staleTime: 60_000,
  });
}

export function useCreateVehicleDocument(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVehicleDocumentRequest) =>
      vehicleDocumentsService.create(vehicleId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: vehicleDocumentsKeys.byVehicle(vehicleId) });
      qc.invalidateQueries({ queryKey: vehicleDocumentsKeys.all });
      toast.success("Vencimiento agregado");
    },
    onError: () => toast.error("No se pudo agregar el vencimiento"),
  });
}

export function useUpdateVehicleDocument(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVehicleDocumentRequest }) =>
      vehicleDocumentsService.update(vehicleId, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: vehicleDocumentsKeys.byVehicle(vehicleId) });
      qc.invalidateQueries({ queryKey: vehicleDocumentsKeys.all });
      toast.success("Vencimiento actualizado");
    },
    onError: () => toast.error("No se pudo actualizar"),
  });
}

export function useDeleteVehicleDocument(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vehicleDocumentsService.remove(vehicleId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: vehicleDocumentsKeys.byVehicle(vehicleId) });
      qc.invalidateQueries({ queryKey: vehicleDocumentsKeys.all });
      toast.success("Vencimiento eliminado");
    },
    onError: () => toast.error("No se pudo eliminar"),
  });
}
