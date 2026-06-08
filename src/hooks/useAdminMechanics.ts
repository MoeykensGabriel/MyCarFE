import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  adminMechanicsService,
  AdminMechanicsParams,
} from "@/services/admin-mechanics.service";
import { CreateMechanicRequest, UpdateMechanicRequest } from "@/types/api.types";

export const mechanicAdminKeys = {
  all: ["admin-mechanics"] as const,
  lists: () => [...mechanicAdminKeys.all, "list"] as const,
  list: (params: AdminMechanicsParams) =>
    [...mechanicAdminKeys.lists(), params] as const,
  details: () => [...mechanicAdminKeys.all, "detail"] as const,
  detail: (id: string) => [...mechanicAdminKeys.details(), id] as const,
};

export function useAdminMechanics(params: AdminMechanicsParams = {}) {
  return useQuery({
    queryKey: mechanicAdminKeys.list(params),
    queryFn: () => adminMechanicsService.getAll(params),
    staleTime: 30_000,
  });
}

export function useAdminMechanic(id: string) {
  return useQuery({
    queryKey: mechanicAdminKeys.detail(id),
    queryFn: () => adminMechanicsService.getById(id),
    enabled: !!id,
  });
}

export function useCreateMechanic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMechanicRequest) =>
      adminMechanicsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mechanicAdminKeys.lists() });
      toast.success("Mecánico creado correctamente");
    },
    onError: () => {
      toast.error("No se pudo crear el mecánico");
    },
  });
}

export function useUpdateMechanic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMechanicRequest }) =>
      adminMechanicsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mechanicAdminKeys.lists() });
      toast.success("Mecánico actualizado");
    },
    onError: () => {
      toast.error("No se pudo actualizar el mecánico");
    },
  });
}

export function useDeactivateMechanic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminMechanicsService.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mechanicAdminKeys.lists() });
      toast.success("Mecánico desactivado");
    },
    onError: () => {
      toast.error("No se pudo desactivar el mecánico");
    },
  });
}

/**
 * Sincroniza las áreas (especialidades) de un mecánico — PUT semantics.
 * Invalida el listado para reflejar el cambio en los chips/badges.
 */
export function useAssignMechanicAreas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, areaIds }: { id: string; areaIds: string[] }) =>
      adminMechanicsService.assignAreas(id, areaIds),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: mechanicAdminKeys.lists() });
      queryClient.invalidateQueries({ queryKey: mechanicAdminKeys.detail(vars.id) });
      toast.success("Áreas actualizadas");
    },
    onError: () => {
      toast.error("No se pudieron actualizar las áreas");
    },
  });
}
