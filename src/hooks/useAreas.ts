import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { areasService } from "@/services/areas.service";
import { CreateAreaRequest, UpdateAreaRequest } from "@/types/api.types";

export const areaKeys = {
  all: ["areas"] as const,
  lists: () => [...areaKeys.all, "list"] as const,
  list: (includeInactive: boolean) =>
    [...areaKeys.lists(), { includeInactive }] as const,
  detail: (id: string) => [...areaKeys.all, "detail", id] as const,
};

/**
 * Lista de áreas. Por defecto solo activas — pasá includeInactive=true para
 * verlas todas (solo Admin: el BE ignora el flag si no sos Admin).
 */
export function useAreas(includeInactive = false) {
  return useQuery({
    queryKey: areaKeys.list(includeInactive),
    queryFn: () => areasService.getAll(includeInactive),
  });
}

export function useCreateArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAreaRequest) => areasService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: areaKeys.lists() });
      toast.success("Área creada");
    },
    onError: () => toast.error("No se pudo crear el área"),
  });
}

export function useUpdateArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAreaRequest }) =>
      areasService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: areaKeys.lists() });
      toast.success("Área actualizada");
    },
    onError: () => toast.error("No se pudo actualizar el área"),
  });
}

export function useDeleteArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => areasService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: areaKeys.lists() });
      toast.success("Área desactivada");
    },
    onError: () => toast.error("No se pudo desactivar el área"),
  });
}
