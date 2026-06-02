import apiClient from "@/lib/axios";
import { StockRequestItemStatus, StockRequestStatus } from "@/lib/enums";
import {
  StockAvailability,
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

  /**
   * Consulta la disponibilidad de un producto por código en el sistema del taller.
   *
   * TODO: conectar a GestionPGB — reemplazar el stub por:
   *   const response = await apiClient.get<StockAvailability>("/api/stock/availability", {
   *     params: { code: productCode },
   *   });
   *   return response.data;
   *
   * Por ahora simula la respuesta (con un pequeño delay) para construir la UI.
   * Regla trivial de demo: códigos que terminan en dígito par => disponibles.
   */
  checkAvailability: async (productCode: string): Promise<StockAvailability> => {
    const code = productCode.trim();
    await new Promise((resolve) => setTimeout(resolve, 600)); // simula latencia de red
    const lastChar = code.slice(-1);
    const lastDigit = Number(lastChar);
    const available = !Number.isNaN(lastDigit) && lastDigit % 2 === 0;
    return {
      productCode:    code,
      available,
      name:           available ? "Producto de ejemplo" : null,
      quantityOnHand: available ? 5 : 0,
    };
  },
};
