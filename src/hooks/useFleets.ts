import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CreateFleetRequest, UpdateFleetRequest } from "@/types/api.types";
import { fleetsService, FleetsParams } from "@/services/fleets.service";

export const fleetKeys = {
  all: ["fleets"] as const,
  lists: () => [...fleetKeys.all, "list"] as const,
  list: (params: FleetsParams) => [...fleetKeys.lists(), params] as const,
  details: () => [...fleetKeys.all, "detail"] as const,
  detail: (id: string) => [...fleetKeys.details(), id] as const,
};

export function useFleets(params: FleetsParams = {}) {
  return useQuery({
    queryKey: fleetKeys.list(params),
    queryFn: () => fleetsService.getAll(params),
    staleTime: 30_000,
  });
}

export function useFleet(id: string) {
  return useQuery({
    queryKey: fleetKeys.detail(id),
    queryFn: () => fleetsService.getById(id),
    enabled: !!id,
  });
}

export function useFleetMine() {
  return useQuery({
    queryKey: [...fleetKeys.all, "mine"] as const,
    queryFn: () => fleetsService.getMine(),
  });
}

export function useSearchFleets(search: string) {
  return useQuery({
    queryKey: ["fleets", "search", search],
    queryFn: () => fleetsService.getAll({ search, pageSize: 8 }),
    enabled: search.length >= 2,
    staleTime: 30_000,
  });
}

export function useCreateFleet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFleetRequest) => fleetsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fleetKeys.lists() });
    },
    onError: () => {
      toast.error("No se pudo crear la flota");
    },
  });
}

export function useUpdateFleet(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateFleetRequest) => fleetsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fleetKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: fleetKeys.lists() });
      toast.success("Flota actualizada");
    },
    onError: () => {
      toast.error("No se pudo actualizar la flota");
    },
  });
}
