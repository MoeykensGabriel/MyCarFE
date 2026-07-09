import apiClient from "@/lib/axios";

/**
 * Endpoints de un WorkOrderService individual.
 * Las acciones del mecánico (accept / complete) viven en mechanic.service.ts.
 * Acá solo expongo lo que admin/oficina necesita para gestionar la asignación.
 */
export const workOrderServicesService = {
  /** Admin/oficina asigna un mecánico a un servicio. */
  assignMechanic: async (
    workOrderServiceId: string,
    mechanicId: string
  ): Promise<void> => {
    await apiClient.post(
      `/api/work-order-services/${workOrderServiceId}/assign`,
      { mechanicId }
    );
  },

  /** Admin/oficina desasigna al mecánico actual (vale también con el trabajo en curso). */
  unassignMechanic: async (workOrderServiceId: string): Promise<void> => {
    await apiClient.post(
      `/api/work-order-services/${workOrderServiceId}/unassign`
    );
  },

  /**
   * Admin/oficina finaliza un trabajo en curso en nombre del taller — destraba servicios
   * cuyo mecánico no va a continuar. Notes obligatorio (mínimo 10 chars).
   */
  completeAsWorkshop: async (
    workOrderServiceId: string,
    notes: string
  ): Promise<void> => {
    await apiClient.post(
      `/api/work-order-services/${workOrderServiceId}/complete-as-workshop`,
      { notes }
    );
  },
};
