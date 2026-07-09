"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { BackButton } from "@/components/shared/BackButton";
import { StatusTimeline } from "@/components/work-orders/StatusTimeline";
import { TechnicianNoteCard } from "@/components/work-orders/TechnicianNoteCard";
import { PhotosCard } from "@/components/work-orders/PhotosCard";
import { BeforePhotosUploader } from "@/components/work-orders/BeforePhotosUploader";
import { AfterPhotosUploader } from "@/components/work-orders/AfterPhotosUploader";
import { ChangeStatusModal } from "@/components/work-orders/ChangeStatusModal";
import { InspectionPanel } from "@/components/work-orders/InspectionPanel";
import { InspectionFindingsCard } from "@/components/work-orders/InspectionFindingsCard";
import { InspectionProposalsCard } from "@/components/work-orders/InspectionProposalsCard";
import { WorkOrderDetailHeader } from "@/components/work-orders/WorkOrderDetailHeader";
import { StatusBanner } from "@/components/work-orders/work-order-status-ui";
import { QuoteCard } from "@/components/work-orders/QuoteCard";
import { AdditionalItemsCard } from "@/components/work-orders/AdditionalItemsCard";
import { SaleConditionCard } from "@/components/work-orders/SaleConditionCard";
import { WorkOrderSummaryPanel } from "@/components/work-orders/WorkOrderSummaryPanel";
import { StockLookupModal } from "@/components/stock/StockLookupModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkOrderStatus } from "@/lib/enums";
import { useWorkOrder, workOrderKeys } from "@/hooks/useWorkOrders";

// ─── Página ───────────────────────────────────────────────────────────────────

export default function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, isError } = useWorkOrder(id);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const queryClient = useQueryClient();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <BackButton href="/admin/work-orders" label="Órdenes de trabajo" />
        <p className="text-sm text-muted-foreground">Cargando orden...</p>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="space-y-4">
        <BackButton href="/admin/work-orders" label="Órdenes de trabajo" />
        <p className="text-sm text-red-500">No se pudo cargar la orden.</p>
      </div>
    );
  }

  const status = Number(order.currentStatus) as WorkOrderStatus;
  const isFinalState =
    status === WorkOrderStatus.Delivered || status === WorkOrderStatus.Cancelled;
  const isDiagnosing      = status === WorkOrderStatus.Diagnosing;
  const isUnderInspection = status === WorkOrderStatus.UnderInspection;
  // Post-aprobación: se pueden cargar ADICIONALES (nacen Pending, requieren OK del cliente)
  const isPostApproval =
    status === WorkOrderStatus.Approved || status === WorkOrderStatus.InProgress;

  return (
    <div className="space-y-6">
      <WorkOrderDetailHeader
        order={order}
        status={status}
        isFinalState={isFinalState}
        onChangeStatus={() => setStatusModalOpen(true)}
      />

      <StatusBanner status={status} />

      {/* ── Grid principal ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Columna izquierda — 2/3 */}
        <div className="lg:col-span-2 space-y-6">

          {/* Panel de inspección colectiva (solo cuando aplica) */}
          {isUnderInspection && <InspectionPanel workOrderId={order.id} />}

          {/* Hallazgos + propuestas de los mecánicos — contexto para armar el presupuesto */}
          {isDiagnosing && <InspectionFindingsCard workOrderId={order.id} />}
          {isDiagnosing && <InspectionProposalsCard workOrderId={order.id} />}

          {/* Presupuesto: una card con servicios + repuestos + total (editable en Diagnosing) */}
          {((order.services?.length ?? 0) > 0 || (order.parts?.length ?? 0) > 0 || isDiagnosing) && (
            <QuoteCard
              order={order}
              status={status}
              isDiagnosing={isDiagnosing}
              onConsultStock={() => setStockOpen(true)}
            />
          )}

          {/* Trabajo adicional post-aprobación: alta de items Pending + decisión del cliente */}
          {isPostApproval && <AdditionalItemsCard order={order} />}

          {/* Condición de venta — en mobile va justo debajo del presupuesto para no
              obligar al admin a scrollear hasta abajo de la columna derecha. En desktop
              se oculta acá y se mantiene en la sidebar (más abajo) con `hidden lg:block`. */}
          <div className="lg:hidden">
            <SaleConditionCard order={order} status={status} />
          </div>

          {/* Motivo de visita ahora vive en el header (WorkOrderDetailHeader),
              siempre visible debajo del ID/estado del vehículo. */}

          {/* Nota del cliente */}
          {order.customerNote && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Nota del cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.customerNote}</p>
              </CardContent>
            </Card>
          )}

          <TechnicianNoteCard workOrderId={order.id} initialNote={order.technicianNote} />

          {/* Fotos de ingreso — recuperables desde la ficha si se saltó el paso en el alta.
              Disponible mientras la orden esté activa; cerrada (Entregada/Cancelada) ya no se
              edita el registro cosmético, queda solo lectura en PhotosCard. */}
          {!isFinalState && (
            <BeforePhotosUploader
              workOrderId={order.id}
              allPhotos={order.photos ?? []}
              onUploaded={() => {
                queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(order.id) });
              }}
            />
          )}

          {/* Fotos finales — solo en Completed; el BE bloquea Delivered si no hay al menos una. */}
          {status === WorkOrderStatus.Completed && (
            <AfterPhotosUploader
              workOrderId={order.id}
              allPhotos={order.photos ?? []}
              onUploaded={() => {
                queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(order.id) });
              }}
            />
          )}

          <PhotosCard photos={order.photos ?? []} />
        </div>

        {/* Columna derecha — 1/3 */}
        <div className="space-y-6">
          <WorkOrderSummaryPanel order={order} />

          {/* Condición de venta de los repuestos — viaja al depósito al aprobar.
              En mobile se muestra debajo del presupuesto (ver arriba), acá solo desktop. */}
          <div className="hidden lg:block">
            <SaleConditionCard order={order} status={status} />
          </div>

          {/* Historial */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial de estados</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline timeline={order.timeline ?? []} />
            </CardContent>
          </Card>
        </div>
      </div>

      <ChangeStatusModal
        workOrder={order}
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
      />

      {isDiagnosing && (
        <StockLookupModal open={stockOpen} onClose={() => setStockOpen(false)} />
      )}
    </div>
  );
}
