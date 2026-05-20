import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AxiosError } from "axios";

import { mechanicService } from "@/services/mechanic.service";
import { WorkOrderServiceAssignmentStatus } from "@/lib/enums";
import { CompleteServiceRequest, ProblemDetails } from "@/types/api.types";

export const mechanicKeys = {
  all:    ["mechanic"] as const,
  tasks:  (status?: WorkOrderServiceAssignmentStatus) =>
    [...mechanicKeys.all, "tasks", status ?? "active"] as const,
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
