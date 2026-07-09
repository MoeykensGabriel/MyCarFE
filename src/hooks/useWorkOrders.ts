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
  AddWorkOrderPartRequest,
  AddWorkOrderServiceRequest,
  ApproveQuotePayload,
  CreateWorkOrderRequest,
  ProblemDetails,
  SetSaleConditionRequest,
  UpdateWorkOrderPartRequest,
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

export function useScheduleWorkOrder(workOrderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { scheduledStart: string | null; scheduledEnd?: string | null }) =>
      workOrdersService.schedule(workOrderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(workOrderId) });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() });
      // El calendario de ocupación lee de otra query key (schedule/occupancy).
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
      toast.success("Agenda actualizada");
    },
    onError: () => {
      toast.error("No se pudo agendar la orden");
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

export function useUpdateWorkOrderServicePrice(workOrderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ serviceId, price }: { serviceId: string; price: number }) =>
      workOrdersService.updateServicePrice(workOrderId, serviceId, price),
    onSuccess: (updated) => {
      queryClient.setQueryData(workOrderKeys.detail(workOrderId), updated);
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() });
    },
    onError: (err) => {
      toast.error(extractError(err, "No se pudo actualizar el precio del servicio"));
    },
  });
}

// ─── Repuestos (parts) ────────────────────────────────────────────────────────
// Patrón: el BE devuelve el WorkOrderDetail completo, así que actualizamos la cache
// directamente con setQueryData para evitar un refetch innecesario. Si falla, igual
// invalidamos para resync.

export function useSetSaleCondition(workOrderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SetSaleConditionRequest) =>
      workOrdersService.setSaleCondition(workOrderId, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(workOrderKeys.detail(workOrderId), updated);
      toast.success("Condición de venta guardada");
    },
    onError: (err) => {
      toast.error(extractError(err, "No se pudo guardar la condición de venta"));
    },
  });
}

export function useAddWorkOrderPart(workOrderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddWorkOrderPartRequest) =>
      workOrdersService.addPart(workOrderId, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(workOrderKeys.detail(workOrderId), updated);
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() });
      toast.success("Repuesto agregado");
    },
    onError: (err) => {
      toast.error(extractError(err, "No se pudo agregar el repuesto"));
    },
  });
}

export function useUpdateWorkOrderPart(workOrderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      partId,
      data,
    }: {
      partId: string;
      data: UpdateWorkOrderPartRequest;
    }) => workOrdersService.updatePart(workOrderId, partId, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(workOrderKeys.detail(workOrderId), updated);
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() });
      toast.success("Repuesto actualizado");
    },
    onError: (err) => {
      toast.error(extractError(err, "No se pudo actualizar el repuesto"));
    },
  });
}

export function useRemoveWorkOrderPart(workOrderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (partId: string) => workOrdersService.removePart(workOrderId, partId),
    onSuccess: (updated) => {
      queryClient.setQueryData(workOrderKeys.detail(workOrderId), updated);
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() });
      toast.success("Repuesto eliminado");
    },
    onError: (err) => {
      toast.error(extractError(err, "No se pudo eliminar el repuesto"));
    },
  });
}

export function useConvertProposals(workOrderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { proposedServiceIds: string[]; proposedPartIds: string[] }) =>
      workOrdersService.convertProposals(workOrderId, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(workOrderKeys.detail(workOrderId), updated);
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["inspections", "by-work-order", workOrderId] });
      toast.success("Propuestas agregadas al presupuesto");
    },
    onError: (err) => {
      toast.error(extractError(err, "No se pudieron agregar las propuestas"));
    },
  });
}

/**
 * Envía el presupuesto al cliente. Mutation con efectos: congela items, genera token,
 * transiciona a AwaitingApproval, dispara email.
 */
export function useSendQuote(workOrderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => workOrdersService.sendQuote(workOrderId),
    onSuccess: (updated) => {
      queryClient.setQueryData(workOrderKeys.detail(workOrderId), updated);
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() });
      toast.success("Presupuesto enviado al cliente");
    },
    onError: (err) => {
      toast.error(extractError(err, "No se pudo enviar el presupuesto"));
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
      toast.success("Mecánico desasignado — el trabajo vuelve al pool");
    },
    onError: (err) => {
      toast.error(extractError(err, "No se pudo desasignar el mecánico"));
    },
  });
}

/** Admin/oficina finaliza un trabajo en curso en nombre del taller (mecánico ausente). */
export function useCompleteServiceAsWorkshop(workOrderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workOrderServiceId,
      notes,
    }: {
      workOrderServiceId: string;
      notes: string;
    }) => workOrderServicesService.completeAsWorkshop(workOrderServiceId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(workOrderId) });
      toast.success("Trabajo finalizado por el taller");
    },
    onError: (err) => {
      toast.error(extractError(err, "No se pudo finalizar el trabajo"));
    },
  });
}

export function useApproveAsCustomer(workOrderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ApproveQuotePayload) =>
      workOrdersService.approveAsCustomer(workOrderId, payload),
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
