import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

import { stockService } from "@/services/stock.service";
import { StockRequestsParams, UpdateStockItemPayload } from "@/types/stock.types";

interface ProblemDetails {
  detail?: string;
  title?:  string;
  status?: number;
}

function extractError(err: unknown, fallback: string): string {
  const axiosErr = err as AxiosError<ProblemDetails>;
  return (
    axiosErr.response?.data?.detail ??
    axiosErr.response?.data?.title ??
    fallback
  );
}

export const stockKeys = {
  all:     ["stock-requests"] as const,
  lists:   () => [...stockKeys.all, "list"] as const,
  list:    (params: StockRequestsParams) => [...stockKeys.lists(), params] as const,
  details: () => [...stockKeys.all, "detail"] as const,
  detail:  (id: string) => [...stockKeys.details(), id] as const,
};

export function useStockRequests(params: StockRequestsParams = {}) {
  return useQuery({
    queryKey: stockKeys.list(params),
    queryFn:  () => stockService.getAll(params),
    // Refetch periódico — la oficina necesita ver actualizaciones que empuja GestionPGB.
    refetchInterval: 30_000,
  });
}

export function useStockRequest(id: string) {
  return useQuery({
    queryKey: stockKeys.detail(id),
    queryFn:  () => stockService.getById(id),
    enabled:  !!id,
  });
}

/**
 * Reintenta el envío a GestionPGB para un pedido que quedó con ExternalReference null
 * porque el depósito no estaba disponible al momento de la aprobación.
 */
export function useRetryStockSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (stockRequestId: string) => stockService.retrySubmission(stockRequestId),
    onSuccess: (updated) => {
      queryClient.setQueryData(stockKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: stockKeys.lists() });
      if (updated.externalReference) {
        toast.success("Pedido enviado a GestionPGB correctamente");
      } else {
        toast.error("GestionPGB sigue sin responder. Intentá de nuevo cuando el depósito esté disponible.");
      }
    },
    onError: (err) => {
      toast.error(extractError(err, "No se pudo conectar con GestionPGB"));
    },
  });
}

/**
 * Útil para forzar un estado manualmente desde la pantalla cuando el depósito
 * avisa por teléfono o WhatsApp antes de que GestionPGB actualice automáticamente.
 */
export function useUpdateStockItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: UpdateStockItemPayload }) =>
      stockService.updateItemStatus(itemId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(stockKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: stockKeys.lists() });
      toast.success("Estado del repuesto actualizado");
    },
    onError: (err) => {
      toast.error(extractError(err, "No se pudo actualizar el estado"));
    },
  });
}
