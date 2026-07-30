import apiClient from "@/lib/axios";
import { StockRequestItemStatus, StockRequestStatus } from "@/lib/enums";
import {
  StockRequest,
  StockRequestsParams,
  UpdateStockItemPayload,
} from "@/types/stock.types";

/**
 * Normaliza los enums devueltos por el backend.
 * El backend envía int — TypeScript respeta el tipo pero por seguridad lo casteamos
 * a Number para evitar comparaciones extrañas si en algún caso viene como string.
 */
function normalize(r: StockRequest): StockRequest {
  return {
    ...r,
    status: Number(r.status) as StockRequestStatus,
    items:  r.items.map((i) => ({
      ...i,
      status: Number(i.status) as StockRequestItemStatus,
    })),
  };
}

export const stockService = {
  getAll: async (params: StockRequestsParams = {}): Promise<StockRequest[]> => {
    const response = await apiClient.get<StockRequest[]>("/api/stock-requests", { params });
    return response.data.map(normalize);
  },

  getById: async (id: string): Promise<StockRequest> => {
    const response = await apiClient.get<StockRequest>(`/api/stock-requests/${id}`);
    return normalize(response.data);
  },

  /**
   * Override manual de un item. Útil cuando el depósito avisó por otro canal
   * (teléfono, WhatsApp) antes de que GestionPGB actualice automáticamente.
   */
  updateItemStatus: async (itemId: string, payload: UpdateStockItemPayload): Promise<StockRequest> => {
    const response = await apiClient.post<StockRequest>(
      `/api/stock-requests/items/${itemId}/status`,
      payload,
    );
    return normalize(response.data);
  },

  /**
   * Reintenta el envío a GestionPGB para un pedido que quedó sin ExternalReference
   * porque el depósito no estaba corriendo al momento de la aprobación.
   */
  retrySubmission: async (stockRequestId: string): Promise<StockRequest> => {
    const response = await apiClient.post<StockRequest>(
      `/api/stock-requests/${stockRequestId}/retry-submission`,
    );
    return normalize(response.data);
  },
};
