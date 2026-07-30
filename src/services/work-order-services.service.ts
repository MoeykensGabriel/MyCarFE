import apiClient from "@/lib/axios";

/**
 * Endpoints de un WorkOrderService individual.
 * Las acciones de EJECUCIÓN (claim / accept / complete / release) viven en
 * mechanic.service.ts, y las usa tanto el mecánico desde su panel como el admin
 * desde la ficha de la orden cuando hace el trabajo con sus propias manos.
 * Acá solo expongo lo que admin/oficina necesita para gestionar trabajo AJENO.
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
   * Admin/oficina finaliza en nombre del taller un trabajo de OTRO — destraba servicios
   * cuyo mecánico no va a continuar. Vale tanto para trabajos en curso (Accepted) como
   * para los que quedaron tomados y nunca arrancaron (Pending).
   * Notes obligatorio (mínimo 10 chars); no guarda hallazgos.
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
