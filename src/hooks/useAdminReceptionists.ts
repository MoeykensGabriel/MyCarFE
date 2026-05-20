import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  adminReceptionistsService,
  AdminReceptionistsParams,
} from "@/services/admin-receptionists.service";
import { CreateReceptionistRequest, UpdateReceptionistRequest } from "@/types/api.types";

export const receptionistAdminKeys = {
  all: ["admin-receptionists"] as const,
  lists: () => [...receptionistAdminKeys.all, "list"] as const,
  list: (params: AdminReceptionistsParams) =>
    [...receptionistAdminKeys.lists(), params] as const,
  details: () => [...receptionistAdminKeys.all, "detail"] as const,
  detail: (id: string) => [...receptionistAdminKeys.details(), id] as const,
};

export function useAdminReceptionists(params: AdminReceptionistsParams = {}) {
  return useQuery({
    queryKey: receptionistAdminKeys.list(params),
    queryFn: () => adminReceptionistsService.getAll(params),
  });
}

export function useCreateReceptionist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReceptionistRequest) =>
      adminReceptionistsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: receptionistAdminKeys.lists() });
      toast.success("Recepcionista creado correctamente");
    },
    onError: () => {
      toast.error("No se pudo crear el recepcionista");
    },
  });
}

export function useUpdateReceptionist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReceptionistRequest }) =>
      adminReceptionistsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: receptionistAdminKeys.lists() });
      toast.success("Recepcionista actualizado");
    },
    onError: () => {
      toast.error("No se pudo actualizar el recepcionista");
    },
  });
}

export function useDeactivateReceptionist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminReceptionistsService.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: receptionistAdminKeys.lists() });
      toast.success("Recepcionista desactivado");
    },
    onError: () => {
      toast.error("No se pudo desactivar el recepcionista");
    },
  });
}
