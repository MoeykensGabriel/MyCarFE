import axios from "axios";
import apiClient from "@/lib/axios";
import {
  AddAdHocWorkOrderServiceRequest,
  AddWorkOrderServiceRequest,
  ApproveQuotePreview,
  CreateWorkOrderRequest,
  PagedResult,
  UpdateWorkOrderNotesRequest,
  UpdateWorkOrderStatusRequest,
  WorkOrder,
} from "@/types/api.types";

// Cliente sin auth para endpoints públicos (aprobación por token)
const publicClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

export interface WorkOrdersParams {
  customerId?: string;
  vehicleId?: string;
  fleetId?: string;
  status?: number;
  ownerType?: 1 | 2;   // 1 = Clientes, 2 = Flotas
  search?: string;     // patente, nombre, razón social
  page?: number;
  pageSize?: number;
}

/** Normaliza los campos del backend al contrato interno del frontend */
function normalizeWorkOrder(o: WorkOrder): WorkOrder {
  return {
    ...o,
    currentStatus: Number(o.currentStatus) as WorkOrder["currentStatus"],
    timeline: o.timeline?.map((entry) => ({
      ...entry,
      fromStatus: entry.fromStatus !== null ? Number(entry.fromStatus) as WorkOrder["currentStatus"] : null,
      toStatus: Number(entry.toStatus) as WorkOrder["currentStatus"],
    })),
  };
}

export const workOrdersService = {
  getAll: async (params: WorkOrdersParams = {}): Promise<PagedResult<WorkOrder>> => {
    const response = await apiClient.get<WorkOrder[] | PagedResult<WorkOrder>>("/api/work-orders", {
      params: { page: 1, pageSize: 20, ...params },
    });
    const raw = response.data;
    if (Array.isArray(raw)) {
      return {
        items:          raw.map(normalizeWorkOrder),
        totalCount:     raw.length,
        totalPages:     1,
        page:           1,
        pageSize:       raw.length,
        hasNextPage:    false,
        hasPreviousPage: false,
      };
    }
    return {
      ...raw,
      items: raw.items.map(normalizeWorkOrder),
    };
  },

  getById: async (id: string): Promise<WorkOrder> => {
    const response = await apiClient.get<WorkOrder>(`/api/work-orders/${id}`);
    return normalizeWorkOrder(response.data);
  },

  create: async (data: CreateWorkOrderRequest): Promise<{ id: string }> => {
    const response = await apiClient.post<{ id: string } | string>("/api/work-orders", data);
    const raw = response.data;
    return typeof raw === "string" ? { id: raw } : raw;
  },

  updateStatus: async (id: string, data: UpdateWorkOrderStatusRequest): Promise<void> => {
    await apiClient.put(`/api/work-orders/${id}/status`, data);
  },

  updateNotes: async (id: string, data: UpdateWorkOrderNotesRequest): Promise<void> => {
    await apiClient.patch(`/api/work-orders/${id}/notes`, data);
  },

  addService: async (id: string, data: AddWorkOrderServiceRequest): Promise<void> => {
    await apiClient.post(`/api/work-orders/${id}/services`, data);
  },

  /** Agrega un servicio puntual (ad-hoc) que no vive en el catálogo. */
  addAdHocService: async (id: string, data: AddAdHocWorkOrderServiceRequest): Promise<void> => {
    await apiClient.post(`/api/work-orders/${id}/services/ad-hoc`, data);
  },

  removeService: async (id: string, serviceId: string): Promise<void> => {
    await apiClient.delete(`/api/work-orders/${id}/services/${serviceId}`);
  },

  addPhoto: async (id: string, formData: FormData): Promise<void> => {
    await apiClient.post(`/api/work-orders/${id}/photos`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  removePhoto: async (id: string, photoId: string): Promise<void> => {
    await apiClient.delete(`/api/work-orders/${id}/photos/${photoId}`);
  },

  downloadQuote: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/api/work-orders/${id}/quote`, {
      responseType: "blob",
    });
    return response.data;
  },

  // ─── Aprobación pública (sin auth, por token) ────────────────────────────

  getApprovePreview: async (token: string): Promise<ApproveQuotePreview> => {
    const response = await publicClient.get<ApproveQuotePreview>(
      "/api/work-orders/approve",
      { params: { token } }
    );
    return response.data;
  },

  approveQuote: async (token: string): Promise<void> => {
    await publicClient.post("/api/work-orders/approve", null, {
      params: { token },
    });
  },

  // ─── Aprobación desde el panel del cliente logueado ─────────────────────
  approveAsCustomer: async (workOrderId: string): Promise<WorkOrder> => {
    const response = await apiClient.post<WorkOrder>(
      `/api/work-orders/${workOrderId}/approve-as-customer`
    );
    return normalizeWorkOrder(response.data);
  },
};
