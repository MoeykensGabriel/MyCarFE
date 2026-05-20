import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CreateCatalogServiceRequest,
  UpdateCatalogServiceRequest,
} from "@/types/api.types";
import { catalogService, CatalogParams } from "@/services/catalog.service";

const CATALOG_KEY = ["catalog-services"] as const;

export function useCatalogServices(params: CatalogParams = {}) {
  return useQuery({
    queryKey: [...CATALOG_KEY, params],
    queryFn: () => catalogService.getAll(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCatalogService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCatalogServiceRequest) => catalogService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CATALOG_KEY });
      toast.success("Servicio creado correctamente");
    },
    onError: () => toast.error("No se pudo crear el servicio"),
  });
}

export function useUpdateCatalogService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCatalogServiceRequest }) =>
      catalogService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CATALOG_KEY });
      toast.success("Servicio actualizado");
    },
    onError: () => toast.error("No se pudo actualizar el servicio"),
  });
}

export function useDeleteCatalogService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => catalogService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CATALOG_KEY });
      toast.success("Servicio eliminado");
    },
    onError: () => toast.error("No se pudo eliminar el servicio"),
  });
}
