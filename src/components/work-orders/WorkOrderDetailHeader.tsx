"use client";

import { useState } from "react";
import { Car, FileLock2, FileText, MessageSquareText } from "lucide-react";
import { toast } from "sonner";

import { BackButton } from "@/components/shared/BackButton";
import { Button } from "@/components/ui/button";
import { WorkOrder } from "@/types/api.types";
import { formatOrderNumber } from "@/lib/format";
import { UserRole, WorkOrderStatus } from "@/lib/enums";
import { useAuthStore } from "@/store/auth.store";
import { workOrdersService } from "@/services/work-orders.service";
import { useReviseQuote } from "@/hooks/useWorkOrders";
import { StatusBadge } from "./StatusBadge";
import { SendQuoteButton } from "./SendQuoteButton";
import { PromoteToWorkOrderButton } from "./PromoteToWorkOrderButton";
import { InspectionOnlyBadge } from "./InspectionOnlyBadge";
import { getStatusBanner } from "./work-order-status-ui";

interface Props {
  order: WorkOrder;
  status: WorkOrderStatus;
  isFinalState: boolean;
  onChangeStatus: () => void;
}

/**
 * Encabezado del detalle de la orden: volver, identificación del vehículo + estado,
 * y acciones (descargar PDF, enviar presupuesto, cambiar estado). Maneja la descarga.
 */
export function WorkOrderDetailHeader({ order, status, isFinalState, onChangeStatus }: Props) {
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  // Cuál de los dos informes se está bajando — los botones se deshabilitan por separado.
  const [downloadingReport, setDownloadingReport] = useState<"client" | "internal" | null>(null);
  const { mutate: reviseQuote, isPending: revising } = useReviseQuote(order.id);
  const role = useAuthStore((s) => s.role);

  // El informe de cierre existe recién con la orden terminada: es el resumen de la visita.
  // Cancelled queda afuera a propósito — no hubo cierre que contar.
  const canDownloadReport =
    status === WorkOrderStatus.Completed || status === WorkOrderStatus.Delivered;

  // La versión interna lleva costos unitarios y nombres de mecánicos. Recepción usa esta
  // misma pantalla, así que el botón se gatea por rol — el backend igual lo rechaza.
  const canDownloadInternal = canDownloadReport && role === UserRole.Admin;

  const handleReviseQuote = () => {
    const ok = window.confirm(
      "¿Volver el presupuesto a edición?\n\n" +
        "El link de aprobación que tiene el cliente deja de funcionar. " +
        "Después de modificar los items vas a tener que reenviarlo.",
    );
    if (ok) reviseQuote(undefined);
  };

  const vehicleLabel =
    [order.vehicleBrand, order.vehicleModel].filter(Boolean).join(" ") || "—";
  const banner = getStatusBanner(status, !!order.isInspectionOnly);

  const handleDownloadQuote = async () => {
    setDownloadingPdf(true);
    try {
      const blob = await workOrdersService.downloadQuote(order.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `presupuesto-${order.number ?? order.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("No se pudo descargar el presupuesto");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadReport = async (internal: boolean) => {
    setDownloadingReport(internal ? "internal" : "client");
    try {
      const blob = await workOrdersService.downloadClosingReport(order.id, internal);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = internal
        ? `informe-interno-${order.number ?? order.id}.pdf`
        : `informe-${order.number ?? order.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("No se pudo generar el informe");
    } finally {
      setDownloadingReport(null);
    }
  };

  return (
      <div className="space-y-3">
        <BackButton href="/admin/work-orders" label="Órdenes de trabajo" />
        
        <div className="bg-white rounded-xl border border-[#c4c6cd] border-l-4 border-l-[#041627] shadow-sm p-5 md:p-6 transition-all duration-300 hover:shadow-md">
          {/* Fila superior: vehículo + acciones */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start md:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-[#041627] shrink-0 shadow-inner">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-none">
                    Orden {formatOrderNumber(order)}
                  </h1>
                  <StatusBadge status={status} />
                  {/* Solo mientras siga siéndolo: una vez promovida ya es una orden de
                      trabajo y el dato pasa a ser histórico. */}
                  {order.isInspectionOnly && <InspectionOnlyBadge />}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-slate-500 font-bold mt-1.5 leading-none">
                  <span>{vehicleLabel}</span>
                  {order.vehicleLicensePlate && (
                    <>
                      <span className="text-slate-300 font-normal select-none">•</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-mono font-semibold uppercase text-[11px] tracking-wide">
                        {order.vehicleLicensePlate}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 shrink-0 self-end md:self-auto max-w-full">
              {status === WorkOrderStatus.AwaitingApproval && (
                <>
                  {/* "Modificar presupuesto": el cliente pidió cambios antes de aprobar.
                      Vuelve a Diagnosing vía endpoint dedicado (descongela items e
                      invalida el link) — no pasa por el modal genérico de estado. */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReviseQuote}
                    disabled={revising}
                    className="font-semibold text-slate-700"
                  >
                    {revising ? "Volviendo a edición..." : "Modificar presupuesto"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadQuote}
                    disabled={downloadingPdf}
                    className="font-semibold text-slate-700"
                  >
                    {downloadingPdf ? "Descargando..." : "Descargar presupuesto"}
                  </Button>
                </>
              )}
              {/* CTA principal en Diagnosing: enviar presupuesto al cliente.
                  El modal genérico de "Cambiar estado" ya no ofrece AwaitingApproval. */}
              <SendQuoteButton order={order} />
              {/* Informe de cierre: el resumen de la visita para pasarle al cliente. */}
              {canDownloadReport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadReport(false)}
                  disabled={downloadingReport !== null}
                  className="font-semibold text-slate-700"
                >
                  <FileText className="w-4 h-4 mr-1.5" />
                  {downloadingReport === "client" ? "Generando..." : "Informe cliente"}
                </Button>
              )}
              {/* Misma visita, sin recortes: para el taller, no para entregar. */}
              {canDownloadInternal && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadReport(true)}
                  disabled={downloadingReport !== null}
                  className="font-semibold border-[#8b1e3f] text-[#8b1e3f] hover:bg-[#8b1e3f]/10"
                >
                  <FileLock2 className="w-4 h-4 mr-1.5" />
                  {downloadingReport === "internal" ? "Generando..." : "Informe interno"}
                </Button>
              )}
              {/* CTA de una inspección ya cerrada: el cliente aceptó arreglar. */}
              <PromoteToWorkOrderButton order={order} />
              {!isFinalState && (
                <Button
                  variant={status === WorkOrderStatus.Diagnosing ? "outline" : "default"}
                  size="sm"
                  onClick={onChangeStatus}
                  className="font-bold"
                >
                  {banner?.actionLabel ?? "Cambiar estado"}
                </Button>
              )}
            </div>
          </div>

          {/* ── Motivo de visita del cliente — siempre visible ──────────────
              Lo que dijo el cliente al traer el auto a su idioma. Card con icono
              de mensaje, fondo claro y label uppercase para diferenciar. Full-width,
              se acomoda bien en mobile y desktop. */}
          {order.serviceReason?.trim() && (
            <div className="mt-4 flex items-start gap-3 rounded-lg bg-[#eefcfd]/70 border border-[#c4c6cd]/50 px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#c4c6cd]/60 flex items-center justify-center shrink-0">
                <MessageSquareText className="w-4 h-4 text-[#041627]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/60 mb-1">
                  Motivo de visita del cliente
                </p>
                <p className="text-sm text-[#041627] leading-relaxed whitespace-pre-wrap">
                  {order.serviceReason}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}
