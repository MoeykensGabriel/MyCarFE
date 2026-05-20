"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { BackButton } from "@/components/shared/BackButton";
import { InfoRow } from "@/components/shared/InfoRow";
import { StatusBadge } from "@/components/work-orders/StatusBadge";
import { StatusTimeline } from "@/components/work-orders/StatusTimeline";
import { ServicesList } from "@/components/work-orders/ServicesList";
import { AddServicePanel } from "@/components/work-orders/AddServicePanel";
import { TechnicianNoteCard } from "@/components/work-orders/TechnicianNoteCard";
import { PhotosCard } from "@/components/work-orders/PhotosCard";
import { ChangeStatusModal } from "@/components/work-orders/ChangeStatusModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkOrderStatus, WorkOrderStatusConfig } from "@/lib/enums";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/format";
import { useWorkOrder } from "@/hooks/useWorkOrders";
import { workOrdersService } from "@/services/work-orders.service";

// ─── Banner contextual por estado ─────────────────────────────────────────────

const STATUS_BANNERS: Partial<Record<WorkOrderStatus, { color: string; message: string }>> = {
  [WorkOrderStatus.Received]: {
    color: "bg-blue-50 border-blue-200 text-blue-800",
    message: "La orden fue recibida. Pasala a Diagnóstico cuando el mecánico empiece a revisar el vehículo.",
  },
  [WorkOrderStatus.Diagnosing]: {
    color: "bg-yellow-50 border-yellow-200 text-yellow-800",
    message: "En diagnóstico: agregá los servicios relevados antes de enviar al cliente para su aprobación.",
  },
  [WorkOrderStatus.AwaitingApproval]: {
    color: "bg-purple-50 border-purple-200 text-purple-800",
    message: "Esperando que el cliente apruebe el presupuesto. Podés descargar el PDF para enviárselo.",
  },
  [WorkOrderStatus.Approved]: {
    color: "bg-violet-50 border-violet-200 text-violet-800",
    message: "El cliente aprobó el presupuesto. Cuando el vehículo esté en el taller y arranque el trabajo, pasá a En progreso.",
  },
  [WorkOrderStatus.InProgress]: {
    color: "bg-orange-50 border-orange-200 text-orange-800",
    message: "Trabajo en curso. Pasá a Completado cuando los servicios estén terminados.",
  },
  [WorkOrderStatus.Completed]: {
    color: "bg-green-50 border-green-200 text-green-800",
    message: "Trabajo completado. Pasá a Entregado una vez que el cliente retire el vehículo.",
  },
};

// ─── Página ───────────────────────────────────────────────────────────────────

export default function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, isError } = useWorkOrder(id);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadQuote = async () => {
    setDownloadingPdf(true);
    try {
      const blob = await workOrdersService.downloadQuote(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `presupuesto-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("No se pudo descargar el presupuesto");
    } finally {
      setDownloadingPdf(false);
    }
  };

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

  const vehicleLabel =
    [order.vehicleBrand, order.vehicleModel].filter(Boolean).join(" ") || "—";

  const status = Number(order.currentStatus) as WorkOrderStatus;
  const isFinalState =
    status === WorkOrderStatus.Delivered || status === WorkOrderStatus.Cancelled;
  const isDiagnosing = status === WorkOrderStatus.Diagnosing;
  const banner = STATUS_BANNERS[status];

  const nextStatusLabel = WorkOrderStatusConfig[status]?.label;

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <BackButton href="/admin/work-orders" label="Órdenes de trabajo" />
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                Orden #{order.id.slice(0, 8).toUpperCase()}
              </h1>
              <StatusBadge status={status} />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {vehicleLabel}
              {order.vehicleLicensePlate && (
                <span className="ml-2 font-mono">{order.vehicleLicensePlate}</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {status === WorkOrderStatus.AwaitingApproval && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadQuote}
                disabled={downloadingPdf}
              >
                {downloadingPdf ? "Descargando..." : "Descargar presupuesto"}
              </Button>
            )}
            {!isFinalState && (
              <Button size="sm" onClick={() => setStatusModalOpen(true)}>
                Cambiar estado
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Banner contextual ───────────────────────────────────────────────── */}
      {banner && (
        <div className={`rounded-md border px-4 py-3 text-sm ${banner.color}`}>
          {banner.message}
        </div>
      )}

      {/* ── Grid principal ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-6">

        {/* Columna izquierda — 2/3 */}
        <div className="col-span-2 space-y-6">

          {/* Información general */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <InfoRow
                label="Vehículo"
                value={vehicleLabel}
                href={`/admin/vehicles/${order.vehicleId}`}
              />
              <InfoRow label="Patente" value={order.vehicleLicensePlate} />
              <InfoRow
                label="Propietario"
                value={order.ownerName}
                href={
                  order.customerIdAtEntry
                    ? `/admin/customers/${order.customerIdAtEntry}`
                    : order.fleetIdAtEntry
                    ? `/admin/fleets/${order.fleetIdAtEntry}`
                    : undefined
                }
              />
              <InfoRow
                label="Kilometraje al ingreso"
                value={
                  order.mileageAtEntry != null
                    ? order.mileageAtEntry.toLocaleString("es-AR") + " km"
                    : null
                }
              />
              <InfoRow label="Creada" value={formatDateTime(order.createdAt)} />
              <InfoRow label="Última actualización" value={formatDateTime(order.updatedAt)} />
            </CardContent>
          </Card>

          {/* Servicios */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Servicios
                {(order.services?.length ?? 0) > 0 && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    ({order.services!.length}) · Total: {formatCurrency(order.totalAmount)}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ServicesList
                workOrderId={order.id}
                services={order.services ?? []}
                totalAmount={order.totalAmount}
                editable={isDiagnosing}
                workOrderStatus={status}
              />
              {isDiagnosing && <AddServicePanel workOrderId={order.id} />}
            </CardContent>
          </Card>

          {/* Notas */}
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

          <PhotosCard photos={order.photos ?? []} />
        </div>

        {/* Columna derecha — 1/3 */}
        <div className="space-y-6">

          {/* Historial */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial de estados</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline timeline={order.timeline ?? []} />
            </CardContent>
          </Card>

          {/* Vehículo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vehículo</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="font-medium text-gray-900">{vehicleLabel}</p>
              {order.vehicleLicensePlate && (
                <p className="font-mono text-xs text-muted-foreground">
                  {order.vehicleLicensePlate}
                </p>
              )}
              <div className="pt-1 space-y-1">
                <Link
                  href={`/admin/vehicles/${order.vehicleId}`}
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                >
                  Ver ficha <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href={`/admin/work-orders?vehicleId=${order.vehicleId}`}
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                >
                  Otras órdenes <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Propietario */}
          {(order.customerIdAtEntry || order.fleetIdAtEntry) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {order.fleetIdAtEntry ? "Flota" : "Cliente"}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p className="font-medium text-gray-900">{order.ownerName ?? "—"}</p>
                <div className="pt-1 space-y-1">
                  {order.customerIdAtEntry ? (
                    <>
                      <Link
                        href={`/admin/customers/${order.customerIdAtEntry}`}
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                      >
                        Ver ficha <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href={`/admin/work-orders?customerId=${order.customerIdAtEntry}`}
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                      >
                        Otras órdenes <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href={`/admin/fleets/${order.fleetIdAtEntry}`}
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                      >
                        Ver flota <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href={`/admin/work-orders?fleetId=${order.fleetIdAtEntry}`}
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                      >
                        Otras órdenes de la flota <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Persona que trajo el vehículo (solo para flotas) */}
          {order.fleetIdAtEntry && order.contactPersonName && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Entrega</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="font-medium text-gray-900">
                  {order.contactPersonName}
                  {order.contactPersonPhone && ` — ${order.contactPersonPhone}`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Trajo el vehículo</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ChangeStatusModal
        workOrder={order}
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
      />
    </div>
  );
}
