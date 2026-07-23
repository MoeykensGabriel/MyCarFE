import axios from "axios";
import apiClient from "@/lib/axios";
import {
  AddAdHocWorkOrderServiceRequest,
  AddWorkOrderPartRequest,
  AddWorkOrderServiceRequest,
  ApproveQuotePayload,
  ApproveQuotePreview,
  CreateWorkOrderRequest,
  PagedResult,
  SetSaleConditionRequest,
  UpdateWorkOrderNotesRequest,
  UpdateWorkOrderPartRequest,
  UpdateWorkOrderStatusRequest,
  WorkOrder,
} from "@/types/api.types";

// Cliente sin auth para endpoints públicos (aprobación por token)
const publicClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

/** Link de aprobación vigente. Campos en null = la orden no tiene uno activo. */
export interface QuoteApprovalLink {
  approvalLink: string | null;
  expiresAt: string | null;
}

export interface WorkOrdersParams {
  customerId?: string;
  vehicleId?: string;
  fleetId?: string;
  status?: number;
  statuses?: number[]; // atajo multi-estado (ej. "Aprobadas en adelante"); se envía como CSV
  ownerType?: 1 | 2;   // 1 = Clientes, 2 = Flotas
  search?: string;     // patente, nombre, razón social
  from?: string;       // ISO date — filtro de CreatedAt desde (inclusivo)
  to?: string;         // ISO date — filtro de CreatedAt hasta (inclusivo)
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
    const { statuses, ...rest } = params;
    const response = await apiClient.get<WorkOrder[] | PagedResult<WorkOrder>>("/api/work-orders", {
      params: {
        page: 1,
        pageSize: 20,
        ...rest,
        ...(statuses && statuses.length ? { statuses: statuses.join(",") } : {}),
      },
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

  getById: async (id: string, config?: any): Promise<WorkOrder> => {
    const response = await apiClient.get<WorkOrder>(`/api/work-orders/${id}`, config);
    return normalizeWorkOrder(response.data);
  },

  create: async (data: CreateWorkOrderRequest, config?: any): Promise<{ id: string }> => {
    const response = await apiClient.post<{ id: string } | string>("/api/work-orders", data, config);
    const raw = response.data;
    return typeof raw === "string" ? { id: raw } : raw;
  },

  updateStatus: async (id: string, data: UpdateWorkOrderStatusRequest): Promise<void> => {
    await apiClient.put(`/api/work-orders/${id}/status`, data);
  },

  updateNotes: async (id: string, data: UpdateWorkOrderNotesRequest): Promise<void> => {
    await apiClient.patch(`/api/work-orders/${id}/notes`, data);
  },

  /**
   * Agenda la orden (vehículo) en el calendario de ocupación. Si scheduledEnd se omite,
   * el backend lo calcula como inicio + duración total estimada. Pasar ambos null borra el agendado.
   */
  schedule: async (
    id: string,
    data: { scheduledStart: string | null; scheduledEnd?: string | null },
  ): Promise<WorkOrder> => {
    const response = await apiClient.post<WorkOrder>(`/api/work-orders/${id}/schedule`, {
      workOrderId: id,
      ...data,
    });
    return response.data;
  },

  /**
   * Link de aprobación vigente del presupuesto, para reenviárselo al cliente por
   * WhatsApp. No genera un token nuevo: el link que el cliente ya tenga sigue valiendo.
   * Devuelve los campos en null si no hay link activo.
   */
  getApprovalLink: async (id: string): Promise<QuoteApprovalLink> => {
    const response = await apiClient.get<QuoteApprovalLink>(`/api/work-orders/${id}/approval-link`);
    return response.data;
  },

  /**
   * Define la condición de venta de los repuestos (CC / OC + número / Contado + seña).
   * Editable hasta la aprobación; viaja al depósito (GestionPGB) con el pedido.
   */
  setSaleCondition: async (id: string, data: SetSaleConditionRequest): Promise<WorkOrder> => {
    const response = await apiClient.put<WorkOrder>(`/api/work-orders/${id}/sale-condition`, data);
    return normalizeWorkOrder(response.data);
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

  /** Edita el precio de venta de un servicio (precio único modificable, solo en Diagnosing). */
  updateServicePrice: async (id: string, serviceId: string, price: number): Promise<WorkOrder> => {
    const response = await apiClient.patch<WorkOrder>(
      `/api/work-orders/${id}/services/${serviceId}/price`,
      { price },
    );
    return normalizeWorkOrder(response.data);
  },

  // ─── Repuestos (parts) ───────────────────────────────────────────────────
  // Los tres endpoints devuelven el WorkOrderDetail completo, pero acá tipamos
  // como WorkOrder porque los hooks invalidan la query y vuelven a leer el detalle.

  addPart: async (id: string, data: AddWorkOrderPartRequest): Promise<WorkOrder> => {
    const response = await apiClient.post<WorkOrder>(`/api/work-orders/${id}/parts`, data);
    return normalizeWorkOrder(response.data);
  },

  updatePart: async (
    id: string,
    partId: string,
    data: UpdateWorkOrderPartRequest,
  ): Promise<WorkOrder> => {
    const response = await apiClient.patch<WorkOrder>(
      `/api/work-orders/${id}/parts/${partId}`,
      data,
    );
    return normalizeWorkOrder(response.data);
  },

  removePart: async (id: string, partId: string): Promise<WorkOrder> => {
    const response = await apiClient.delete<WorkOrder>(
      `/api/work-orders/${id}/parts/${partId}`,
    );
    return normalizeWorkOrder(response.data);
  },

  /**
   * Convierte propuestas de mecánicos (proposed services/parts en inspection reports)
   * en items reales del presupuesto. Solo Admin, solo en Diagnosing.
   */
  convertProposals: async (
    id: string,
    data: { proposedServiceIds: string[]; proposedPartIds: string[] },
  ): Promise<WorkOrder> => {
    const response = await apiClient.post<WorkOrder>(
      `/api/work-orders/${id}/convert-proposals`,
      { workOrderId: id, ...data },
    );
    return normalizeWorkOrder(response.data);
  },

  /**
   * Envía el presupuesto al cliente.
   * Congela los items, genera token, transiciona a AwaitingApproval y dispara email.
   * Solo válido desde Diagnosing.
   */
  sendQuote: async (id: string): Promise<WorkOrder> => {
    const response = await apiClient.post<WorkOrder>(`/api/work-orders/${id}/send-quote`);
    return normalizeWorkOrder(response.data);
  },

  /**
   * "Modificar presupuesto": vuelve la orden de AwaitingApproval a Diagnosing para editar
   * y reenviar. Descongela items, resetea su decisión e invalida el link de aprobación viejo.
   */
  reviseQuote: async (id: string, note?: string): Promise<WorkOrder> => {
    const response = await apiClient.post<WorkOrder>(`/api/work-orders/${id}/revise-quote`, {
      note: note ?? null,
    });
    return normalizeWorkOrder(response.data);
  },

  /**
   * Decide items ADICIONALES (agregados después de aprobar el presupuesto original).
   * La oficina registra la decisión del cliente; la orden no cambia de estado.
   * Los Pending no incluidos siguen Pending y se pueden decidir más adelante.
   */
  decideAdditionalItems: async (
    id: string,
    data: {
      approvedServiceIds?: string[];
      rejectedServiceIds?: string[];
      approvedPartIds?: string[];
      rejectedPartIds?: string[];
    },
  ): Promise<WorkOrder> => {
    const response = await apiClient.post<WorkOrder>(
      `/api/work-orders/${id}/additional-items/decide`,
      {
        approvedServiceIds: data.approvedServiceIds ?? [],
        rejectedServiceIds: data.rejectedServiceIds ?? [],
        approvedPartIds: data.approvedPartIds ?? [],
        rejectedPartIds: data.rejectedPartIds ?? [],
      },
    );
    return normalizeWorkOrder(response.data);
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

  approveQuote: async (token: string, payload: ApproveQuotePayload): Promise<void> => {
    await publicClient.post("/api/work-orders/approve", {
      token,
      ...payload,
    });
  },

  // ─── Aprobación desde el panel del cliente logueado ─────────────────────
  approveAsCustomer: async (
    workOrderId: string,
    payload: ApproveQuotePayload,
  ): Promise<WorkOrder> => {
    const response = await apiClient.post<WorkOrder>(
      `/api/work-orders/${workOrderId}/approve-as-customer`,
      { workOrderId, ...payload },
    );
    return normalizeWorkOrder(response.data);
  },
};
