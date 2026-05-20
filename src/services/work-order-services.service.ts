import apiClient from "@/lib/axios";

/**
 * Endpoints de un WorkOrderService individual.
 * Las acciones del mecánico (accept / complete) viven en mechanic.service.ts.
 * Acá solo expongo lo que el admin necesita para asignar mecánicos.
 */
export const workOrderServicesService = {
  /** Admin asigna un mecánico a un servicio. */
  assignMechanic: async (
    workOrderServiceId: string,
    mechanicId: string
  ): Promise<void> => {
    await apiClient.post(
      `/api/work-order-services/${workOrderServiceId}/assign`,
      { mechanicId }
    );
  },

  /** Admin desasigna al mecánico actual. */
  unassignMechanic: async (workOrderServiceId: string): Promise<void> => {
    await apiClient.post(
      `/api/work-order-services/${workOrderServiceId}/unassign`
    );
  },
};
