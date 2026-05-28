import apiClient from "@/lib/axios";
import { WorkOrderServiceAssignmentStatus } from "@/lib/enums";
import {
  AvailableService,
  CompleteServiceRequest,
  MechanicTask,
  PendingInspection,
} from "@/types/api.types";

export const mechanicService = {
  /** Lista de servicios asignados al mecánico actual. */
  getMyTasks: async (
    status?: WorkOrderServiceAssignmentStatus
  ): Promise<MechanicTask[]> => {
    const response = await apiClient.get<MechanicTask[]>("/api/mechanics/me/tasks", {
      params: status !== undefined ? { status } : undefined,
    });
    return response.data;
  },

  /** El mecánico acepta el trabajo (Pending → Accepted). */
  acceptService: async (workOrderServiceId: string): Promise<void> => {
    await apiClient.post(`/api/work-order-services/${workOrderServiceId}/accept`);
  },

  /** El mecánico finaliza el trabajo (Accepted → Completed). Notas obligatorias. */
  completeService: async (
    workOrderServiceId: string,
    data: CompleteServiceRequest
  ): Promise<void> => {
    await apiClient.post(`/api/work-order-services/${workOrderServiceId}/complete`, data);
  },

  /**
   * Órdenes en fase de inspección con áreas pendientes que le tocan al mecánico
   * (solo las áreas que él tiene asignadas y aún no fueron reportadas).
   */
  getMyPendingInspections: async (): Promise<PendingInspection[]> => {
    const response = await apiClient.get<PendingInspection[]>(
      "/api/mechanics/me/pending-inspections"
    );
    return response.data;
  },

  /**
   * Pool de trabajos sin asignar y aprobados, en WOs InProgress.
   * El mecánico puede claimear cualquiera con `claimService`.
   */
  getMyAvailableServices: async (): Promise<AvailableService[]> => {
    const response = await apiClient.get<AvailableService[]>(
      "/api/mechanics/me/available-services"
    );
    return response.data;
  },

  /** El mecánico se auto-asigna un servicio del pool (Unassigned → Pending). */
  claimService: async (workOrderServiceId: string): Promise<void> => {
    await apiClient.post(`/api/work-order-services/${workOrderServiceId}/claim`);
  },

  /**
   * El mecánico libera un servicio que tomó pero todavía no aceptó.
   * Vuelve al pool. Solo válido en estado Pending.
   */
  releaseService: async (workOrderServiceId: string): Promise<void> => {
    await apiClient.post(`/api/work-order-services/${workOrderServiceId}/release`);
  },
};
