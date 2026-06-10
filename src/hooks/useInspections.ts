import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { inspectionsService } from "@/services/inspections.service";
import { mechanicService } from "@/services/mechanic.service";
import {
  CreateInspectionReportRequest,
  MarkAreaNoFindingsRequest,
  UpdateInspectionReportRequest,
} from "@/types/api.types";

export const inspectionKeys = {
  all: ["inspections"] as const,
  byWorkOrder: (workOrderId: string) =>
    [...inspectionKeys.all, "by-work-order", workOrderId] as const,
  myPending: () => [...inspectionKeys.all, "my-pending"] as const,
};

// ─── Admin: ver reportes de una orden ───────────────────────────────────────

export function useInspectionReportsByWorkOrder(workOrderId: string | undefined) {
  return useQuery({
    queryKey: inspectionKeys.byWorkOrder(workOrderId ?? ""),
    queryFn: () => inspectionsService.getByWorkOrder(workOrderId!),
    enabled: !!workOrderId,
  });
}

// ─── Mecánico: inspecciones pendientes ──────────────────────────────────────

export function useMyPendingInspections() {
  return useQuery({
    queryKey: inspectionKeys.myPending(),
    queryFn: () => mechanicService.getMyPendingInspections(),
  });
}

// ─── Mecánico: crear / editar reporte ────────────────────────────────────────

export function useCreateInspectionReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInspectionReportRequest) => inspectionsService.create(data),
    onSuccess: (report) => {
      qc.invalidateQueries({ queryKey: inspectionKeys.myPending() });
      qc.invalidateQueries({ queryKey: inspectionKeys.byWorkOrder(report.workOrderId) });
      toast.success("Reporte enviado");
    },
    onError: () => toast.error("No se pudo enviar el reporte"),
  });
}

export function useUpdateInspectionReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInspectionReportRequest }) =>
      inspectionsService.update(id, data),
    onSuccess: (report) => {
      qc.invalidateQueries({ queryKey: inspectionKeys.byWorkOrder(report.workOrderId) });
      qc.invalidateQueries({ queryKey: inspectionKeys.myPending() });
      toast.success("Reporte actualizado");
    },
    onError: () => toast.error("No se pudo actualizar el reporte"),
  });
}

// ─── Admin: cerrar inspección / marcar área sin hallazgos ───────────────────

export function useMarkAreaNoFindings(workOrderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: MarkAreaNoFindingsRequest) =>
      inspectionsService.markAreaNoFindings(workOrderId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inspectionKeys.byWorkOrder(workOrderId) });
      toast.success("Área marcada sin novedades");
    },
    onError: () => toast.error("No se pudo marcar el área"),
  });
}

export function useCloseInspection(workOrderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => inspectionsService.closeInspection(workOrderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inspectionKeys.byWorkOrder(workOrderId) });
      // También invalidamos cachés genéricas de workorder para que la pantalla refleje el nuevo estado
      qc.invalidateQueries({ queryKey: ["work-orders"] });
      toast.success("Inspección cerrada — la orden pasó a cotización");
    },
    onError: (err: unknown) => {
      // El BE devuelve 400 con detalle cuando faltan áreas; mostramos el mensaje real
      const message =
        (err as { response?: { data?: { detail?: string; title?: string } } })?.response?.data
          ?.detail ??
        (err as { response?: { data?: { title?: string } } })?.response?.data?.title ??
        "No se pudo cerrar la inspección";
      toast.error(message);
    },
  });
}
