import apiClient from "@/lib/axios";
import {
  CreateInspectionReportRequest,
  InspectionReport,
  MarkAreaNoFindingsRequest,
  UpdateInspectionReportRequest,
  WorkOrder,
} from "@/types/api.types";

/**
 * Endpoints de inspección colectiva.
 *
 * Mechanic: crea/edita SUS reportes sobre áreas en las que está asignado.
 * Admin   : lista los reportes consolidados, marca áreas "sin hallazgos" y cierra la inspección.
 */
export const inspectionsService = {
  // ── Mecánico ────────────────────────────────────────────────────────────────

  create: async (data: CreateInspectionReportRequest): Promise<InspectionReport> => {
    const response = await apiClient.post<InspectionReport>("/api/inspection-reports", data);
    return response.data;
  },

  update: async (id: string, data: UpdateInspectionReportRequest): Promise<InspectionReport> => {
    const response = await apiClient.patch<InspectionReport>(`/api/inspection-reports/${id}`, data);
    return response.data;
  },

  getById: async (id: string): Promise<InspectionReport> => {
    const response = await apiClient.get<InspectionReport>(`/api/inspection-reports/${id}`);
    return response.data;
  },

  // ── Admin (sub-recurso de WorkOrder) ────────────────────────────────────────

  getByWorkOrder: async (workOrderId: string): Promise<InspectionReport[]> => {
    const response = await apiClient.get<InspectionReport[]>(
      `/api/work-orders/${workOrderId}/inspection-reports`
    );
    return response.data;
  },

  markAreaNoFindings: async (
    workOrderId: string,
    data: MarkAreaNoFindingsRequest
  ): Promise<InspectionReport> => {
    const response = await apiClient.post<InspectionReport>(
      `/api/work-orders/${workOrderId}/inspection-reports/no-findings`,
      data
    );
    return response.data;
  },

  /**
   * Admin cierra la inspección colectiva → la orden pasa de UnderInspection a Diagnosing.
   * Falla con 400 si quedan áreas sin reportar.
   */
  closeInspection: async (workOrderId: string): Promise<WorkOrder> => {
    const response = await apiClient.post<WorkOrder>(
      `/api/work-orders/${workOrderId}/close-inspection`
    );
    return response.data;
  },
};
