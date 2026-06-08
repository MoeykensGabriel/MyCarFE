import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { CreateVehicleRequest } from "@/types/api.types";
import { vehiclesService, VehiclesParams } from "@/services/vehicles.service";

export const vehicleKeys = {
  all: ["vehicles"] as const,
  lists: () => [...vehicleKeys.all, "list"] as const,
  list: (params: VehiclesParams) => [...vehicleKeys.lists(), params] as const,
  infinite: (params: VehiclesParams) =>
    [...vehicleKeys.lists(), "infinite", params] as const,
  details: () => [...vehicleKeys.all, "detail"] as const,
  detail: (id: string) => [...vehicleKeys.details(), id] as const,
};

export function useVehicles(params: VehiclesParams = {}) {
  return useQuery({
    queryKey: vehicleKeys.list(params),
    queryFn: () => vehiclesService.getAll(params),
    // Reusa el listado en memoria al volver a entrar dentro de 30s (evita refetch
    // innecesario al navegar ida/vuelta). Las mutaciones invalidan lists() igual.
    staleTime: 30_000,
  });
}

/**
 * Listado paginado incremental ("Cargar más") para el portal del cliente.
 * Pide de a `pageSize` (default 20) y avanza de página mientras `hasNextPage`.
 * El backend filtra/pagina en DB; acá solo acumulamos páginas.
 */
export function useInfiniteVehicles(
  params: Omit<VehiclesParams, "page"> = {},
) {
  const pageSize = params.pageSize ?? 20;
  return useInfiniteQuery({
    queryKey: vehicleKeys.infinite({ ...params, pageSize }),
    queryFn: ({ pageParam }) =>
      vehiclesService.getAll({ ...params, pageSize, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.page + 1 : undefined,
  });
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: vehicleKeys.detail(id),
    queryFn: () => vehiclesService.getById(id),
    enabled: !!id,
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVehicleRequest) => vehiclesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
      toast.success("Vehículo registrado correctamente");
    },
    onError: () => {
      toast.error("No se pudo registrar el vehículo");
    },
  });
}
