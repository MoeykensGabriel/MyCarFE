import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { salesService } from "@/services/sales.service";
import { CreateSalePayload, SalesParams } from "@/types/sales.types";

export const saleKeys = {
  all: ["sales"] as const,
  lists: () => [...saleKeys.all, "list"] as const,
  list: (params: SalesParams) => [...saleKeys.lists(), params] as const,
  details: () => [...saleKeys.all, "detail"] as const,
  detail: (id: string) => [...saleKeys.details(), id] as const,
};

export function useSales(params: SalesParams = {}) {
  return useQuery({
    queryKey: saleKeys.list(params),
    queryFn: () => salesService.getAll(params),
  });
}

export function useSale(id: string) {
  return useQuery({
    queryKey: saleKeys.detail(id),
    queryFn: () => salesService.getById(id),
    enabled: !!id,
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSalePayload) => salesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
      toast.success("Venta registrada");
    },
    onError: () => {
      toast.error("No se pudo registrar la venta");
    },
  });
}
