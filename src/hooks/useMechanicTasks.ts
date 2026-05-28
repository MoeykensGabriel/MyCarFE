import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AxiosError } from "axios";

import { mechanicService } from "@/services/mechanic.service";
import { WorkOrderServiceAssignmentStatus } from "@/lib/enums";
import { CompleteServiceRequest, ProblemDetails } from "@/types/api.types";

export const mechanicKeys = {
  all:                ["mechanic"] as const,
  tasks:              (status?: WorkOrderServiceAssignmentStatus) =>
    [...mechanicKeys.all, "tasks", status ?? "active"] as const,
  availableServices:  () => [...mechanicKeys.all, "available-services"] as const,
};

/** Servicios asignados al mecánico actual (default: activos = Pending + Accepted). */
export function useMechanicTasks(status?: WorkOrderServiceAssignmentStatus) {
  return useQuery({
    queryKey: mechanicKeys.tasks(status),
    queryFn:  () => mechanicService.getMyTasks(status),
    refetchInterval: 30_000, // re-pollea cada 30s para que el admin no tenga que avisar
  });
}

export function useAcceptService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workOrderServiceId: string) =>
      mechanicService.acceptService(workOrderServiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mechanicKeys.all });
      toast.success("Trabajo aceptado");
    },
    onError: (err) => {
      const axiosError = err as AxiosError<ProblemDetails>;
      const detail = axiosError.response?.data?.detail;
      toast.error(detail ?? "No se pudo aceptar el trabajo");
    },
  });
}

export function useCompleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workOrderServiceId,
      data,
    }: {
      workOrderServiceId: string;
      data: CompleteServiceRequest;
    }) => mechanicService.completeService(workOrderServiceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mechanicKeys.all });
      toast.success("Trabajo finalizado");
    },
    onError: (err) => {
      const axiosError = err as AxiosError<ProblemDetails>;
      const detail = axiosError.response?.data?.detail;
      toast.error(detail ?? "No se pudo finalizar el trabajo");
    },
  });
}

/** Pool de trabajos disponibles. Refetch cada 30s para que aparezcan nuevos sin recargar. */
export function useAvailableServices() {
  return useQuery({
    queryKey: mechanicKeys.availableServices(),
    queryFn:  () => mechanicService.getMyAvailableServices(),
    refetchInterval: 30_000,
  });
}

/**
 * El mecánico toma un servicio del pool. Si falla con 409 (otro lo tomó primero),
 * el toast muestra el detalle del BE y se refresca la lista automáticamente.
 */
export function useClaimService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workOrderServiceId: string) =>
      mechanicService.claimService(workOrderServiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mechanicKeys.all });
      toast.success("Trabajo tomado");
    },
    onError: (err) => {
      const axiosError = err as AxiosError<ProblemDetails>;
      const status     = axiosError.response?.status;
      const detail     = axiosError.response?.data?.detail;

      if (status === 409) {
        // Race condition: refrescamos el pool para que el item desaparezca
        queryClient.invalidateQueries({ queryKey: mechanicKeys.availableServices() });
      }
      toast.error(detail ?? "No se pudo tomar el trabajo");
    },
  });
}

/** El mecánico libera un servicio que tomó (vuelve al pool). */
export function useReleaseService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workOrderServiceId: string) =>
      mechanicService.releaseService(workOrderServiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mechanicKeys.all });
      toast.success("Trabajo liberado");
    },
    onError: (err) => {
      const axiosError = err as AxiosError<ProblemDetails>;
      const detail = axiosError.response?.data?.detail;
      toast.error(detail ?? "No se pudo liberar el trabajo");
    },
  });
}
