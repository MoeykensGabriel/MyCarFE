import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AxiosError } from "axios";

import {
  workOrdersService,
  WorkOrdersParams,
} from "@/services/work-orders.service";
import { workOrderServicesService } from "@/services/work-order-services.service";
import {
  AddAdHocWorkOrderServiceRequest,
  AddWorkOrderServiceRequest,
  CreateWorkOrderRequest,
  ProblemDetails,
  UpdateWorkOrderStatusRequest,
} from "@/types/api.types";

// Extrae el mensaje de error más útil de un ProblemDetails del backend
function extractError(err: unknown, fallback: string): string {
  const axiosErr = err as AxiosError<ProblemDetails>;
  return (
    axiosErr.response?.data?.detail ??
    axiosErr.response?.data?.title ??
    fallback
  );
}

// ─── Query keys ───────────────────────────────────────────────────────────────
export const workOrderKeys = {
  all: ["work-orders"] as const,
  lists: () => [...workOrderKeys.all, "list"] as const,
  list: (params: WorkOrdersParams) => [...workOrderKeys.lists(), params] as const,
  details: () => [...workOrderKeys.all, "detail"] as const,
  detail: (id: string) => [...workOrderKeys.details(), id] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useWorkOrders(params: WorkOrdersParams = {}) {
  return useQuery({
    queryKey: workOrderKeys.list(params),
    queryFn: () => workOrdersService.getAll(params),
  });
}

export function useWorkOrder(id: string) {
  return useQuery({
    queryKey: workOrderKeys.detail(id),
    queryFn: () => workOrdersService.getById(id),
    enabled: !!id,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWorkOrderRequest) => workOrdersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() });
    },
    onError: () => {
      toast.error("No se pudo crear la orden de trabajo");
    },
  });
}

export function useUpdateWorkOrderStatus(workOrderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateWorkOrderStatusRequest) =>
      workOrdersService.updateStatus(workOrderId, data),
    onSuccess: () => {
      // Invalida el detalle y la lista para que se refresquen
      queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(workOrderId) });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() });
      toast.success("Estado actualizado");
    },
    onError: () => {
      toast.error("No se pudo actualizar el estado");
    },
  });
}

export function useAddWorkOrderService(workOrderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddWorkOrderServiceRequest) =>
      workOrdersService.addService(workOrderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(workOrderId) });
    },
    onError: () => {
      toast.error("No se pudo agregar el servicio");
    },
  });
}

export function useAddAdHocWorkOrderService(workOrderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddAdHocWorkOrderServiceRequest) =>
      workOrdersService.addAdHocService(workOrderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(workOrderId) });
      toast.success("Servicio puntual agregado");
    },
    onError: (err) => {
      toast.error(extractError(err, "No se pudo agregar el servicio puntual"));
    },
  });
}

export function useRemoveWorkOrderService(workOrderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (serviceId: string) =>
      workOrdersService.removeService(workOrderId, serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(workOrderId) });
    },
    onError: () => {
      toast.error("No se pudo eliminar el servicio");
    },
  });
}

export function useAssignMechanic(workOrderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workOrderServiceId,
      mechanicId,
    }: {
      workOrderServiceId: string;
      mechanicId: string;
    }) => workOrderServicesService.assignMechanic(workOrderServiceId, mechanicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(workOrderId) });
      toast.success("Mecánico asignado");
    },
    onError: (err) => {
      toast.error(extractError(err, "No se pudo asignar el mecánico"));
    },
  });
}

export function useUnassignMechanic(workOrderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workOrderServiceId: string) =>
      workOrderServicesService.unassignMechanic(workOrderServiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(workOrderId) });
      toast.success("Mecánico desasignado");
    },
    onError: (err) => {
      toast.error(extractError(err, "No se pudo desasignar el mecánico"));
    },
  });
}

export function useApproveAsCustomer(workOrderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => workOrdersService.approveAsCustomer(workOrderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(workOrderId) });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() });
      toast.success("¡Presupuesto aprobado!");
    },
    onError: (err) => {
      toast.error(extractError(err, "No se pudo aprobar el presupuesto"));
    },
  });
}

export function useUpdateWorkOrderNotes(workOrderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (technicianNote: string) =>
      workOrdersService.updateNotes(workOrderId, { workOrderId, technicianNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(workOrderId) });
      toast.success("Notas guardadas");
    },
    onError: () => {
      toast.error("No se pudieron guardar las notas");
    },
  });
}
