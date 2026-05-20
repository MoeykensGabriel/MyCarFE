import apiClient from "@/lib/axios";
import { WorkOrderServiceAssignmentStatus } from "@/lib/enums";
import { CompleteServiceRequest, MechanicTask } from "@/types/api.types";

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
};
