"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, ClipboardList, Building2, User, Car, Clock, Wrench, CheckCircle2, Search, PackageCheck, PackageSearch } from "lucide-react";
import { toast } from "sonner";

import { BackButton } from "@/components/shared/BackButton";
import { InfoRow } from "@/components/shared/InfoRow";
import { StatusBadge } from "@/components/work-orders/StatusBadge";
import { StatusTimeline } from "@/components/work-orders/StatusTimeline";
import { ServicesList } from "@/components/work-orders/ServicesList";
import { AddServicePanel } from "@/components/work-orders/AddServicePanel";
import { PartsList } from "@/components/work-orders/PartsList";
import { AddPartPanel } from "@/components/work-orders/AddPartPanel";
import { TechnicianNoteCard } from "@/components/work-orders/TechnicianNoteCard";
import { PhotosCard } from "@/components/work-orders/PhotosCard";
import { AfterPhotosUploader } from "@/components/work-orders/AfterPhotosUploader";
import { ChangeStatusModal } from "@/components/work-orders/ChangeStatusModal";
import { InspectionPanel } from "@/components/work-orders/InspectionPanel";
import { InspectionFindingsCard } from "@/components/work-orders/InspectionFindingsCard";
import { InspectionProposalsCard } from "@/components/work-orders/InspectionProposalsCard";
import { SendQuoteButton } from "@/components/work-orders/SendQuoteButton";
import { StockLookupModal } from "@/components/stock/StockLookupModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkOrderStatus, WorkOrderStatusConfig } from "@/lib/enums";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/format";
import { useWorkOrder, workOrderKeys } from "@/hooks/useWorkOrders";
import { useQueryClient } from "@tanstack/react-query";
import { workOrdersService } from "@/services/work-orders.service";

// ─── Banner contextual por estado ─────────────────────────────────────────────

const STATUS_BANNERS: Partial<Record<WorkOrderStatus, {
  color: string;
  iconColor: string;
  pulse: boolean;
  title: string;
  message: string;
  actionLabel?: string;
}>> = {
  [WorkOrderStatus.UnderInspection]: {
    color: "bg-slate-50 border-slate-200",
    iconColor: "text-slate-600",
    pulse: false,
    title: "Inspección en curso",
    message: "Las áreas están relevando el vehículo. Cuando cierres la inspección podés pasar a Diagnóstico.",
    actionLabel: "Pasar a Diagnóstico",
  },
  [WorkOrderStatus.Received]: {
    color: "bg-blue-50 border-blue-200",
    iconColor: "text-blue-700",
    pulse: false,
    title: "Orden recibida",
    message: "Pasala a Diagnóstico cuando el mecánico empiece a revisar el vehículo.",
    actionLabel: "Iniciar diagnóstico",
  },
  [WorkOrderStatus.Diagnosing]: {
    color: "bg-amber-50 border-amber-200",
    iconColor: "text-amber-700",
    pulse: true,
    title: "En diagnóstico — armando presupuesto",
    message: "Cargá los servicios y repuestos en base a los hallazgos. Cuando el presupuesto esté listo, enviáselo al cliente.",
  },
  [WorkOrderStatus.AwaitingApproval]: {
    color: "bg-purple-50 border-purple-200",
    iconColor: "text-purple-700",
    pulse: false,
    title: "Esperando aprobación del cliente",
    message: "El presupuesto fue enviado. Cuando el cliente apruebe — por el link o por teléfono — avanzá al siguiente paso.",
    actionLabel: "Cliente aprobó → continuar",
  },
  [WorkOrderStatus.Approved]: {
    color: "bg-emerald-50 border-emerald-300",
    iconColor: "text-emerald-700",
    pulse: true,
    title: "¡Presupuesto aprobado — listo para iniciar!",
    message: "El cliente dio el OK. Cuando el vehículo esté en el taller, iniciá el trabajo — los mecánicos van a ver los servicios automáticamente en su panel.",
    actionLabel: "Auto en el taller → Iniciar trabajo",
  },
  [WorkOrderStatus.InProgress]: {
    color: "bg-orange-50 border-orange-200",
    iconColor: "text-orange-700",
    pulse: false,
    title: "Trabajo en curso",
    message: "Los mecánicos están trabajando. Podés cerrar la orden cuando todos los servicios estén completados.",
    actionLabel: "Marcar como completado",
  },
  [WorkOrderStatus.Completed]: {
    color: "bg-green-50 border-green-200",
    iconColor: "text-green-700",
    pulse: true,
    title: "¡Trabajo finalizado!",
    message: "Todos los servicios fueron completados. Registrá la entrega cuando el cliente retire el vehículo.",
    actionLabel: "Registrar entrega al cliente",
  },
};

const STATUS_ICONS: Partial<Record<WorkOrderStatus, typeof Car>> = {
  [WorkOrderStatus.UnderInspection]:  Search,
  [WorkOrderStatus.Received]:         ClipboardList,
  [WorkOrderStatus.Diagnosing]:       Wrench,
  [WorkOrderStatus.AwaitingApproval]: Clock,
  [WorkOrderStatus.Approved]:         CheckCircle2,
  [WorkOrderStatus.InProgress]:       Wrench,
  [WorkOrderStatus.Completed]:        PackageCheck,
};

// ─── Página ───────────────────────────────────────────────────────────────────

export default function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, isError } = useWorkOrder(id);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const queryClient = useQueryClient();

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
  const isDiagnosing      = status === WorkOrderStatus.Diagnosing;
  const isUnderInspection = status === WorkOrderStatus.UnderInspection;
  const banner = STATUS_BANNERS[status];

  const nextStatusLabel = WorkOrderStatusConfig[status]?.label;
  const BannerIcon = STATUS_ICONS[status];

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <BackButton href="/admin/work-orders" label="Órdenes de trabajo" />
        
        <div className="bg-white rounded-xl border border-[#c4c6cd] border-l-4 border-l-[#041627] shadow-sm p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 hover:shadow-md">
          <div className="flex items-start md:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-[#041627] shrink-0 shadow-inner">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-none">
                  Orden #{order.id.slice(0, 8).toUpperCase()}
                </h1>
                <StatusBadge status={status} />
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

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            {status === WorkOrderStatus.AwaitingApproval && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadQuote}
                disabled={downloadingPdf}
                className="font-semibold text-slate-700"
              >
                {downloadingPdf ? "Descargando..." : "Descargar presupuesto"}
              </Button>
            )}
            {/* CTA principal en Diagnosing: enviar presupuesto al cliente.
                El modal genérico de "Cambiar estado" ya no ofrece AwaitingApproval. */}
            <SendQuoteButton order={order} />
            {!isFinalState && (
              <Button
                variant={status === WorkOrderStatus.Diagnosing ? "outline" : "default"}
                size="sm"
                onClick={() => setStatusModalOpen(true)}
                className="font-bold"
              >
                {banner?.actionLabel ?? "Cambiar estado"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Banner contextual ───────────────────────────────────────────────── */}
      {banner && (
        <div className={`rounded-xl border-2 px-5 py-4 ${banner.color}`}>
          <div className="flex items-start gap-3">
            {BannerIcon && (
              <div className={banner.pulse ? "animate-pulse" : ""}>
                <BannerIcon className={`w-5 h-5 mt-0.5 shrink-0 ${banner.iconColor}`} />
              </div>
            )}
            <div>
              <p className={`font-bold text-sm ${banner.iconColor}`}>{banner.title}</p>
              <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">{banner.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Grid principal ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Columna izquierda — 2/3 */}
        <div className="lg:col-span-2 space-y-6">

          {/* Panel de inspección colectiva (solo cuando aplica) */}
          {isUnderInspection && <InspectionPanel workOrderId={order.id} />}

          {/* Hallazgos de la inspección — visible en Diagnosing para que el admin
              tenga el contexto al armar el presupuesto y pueda convertir cada
              hallazgo en servicio/repuesto con un click. */}
          {isDiagnosing && <InspectionFindingsCard workOrderId={order.id} />}

          {/* Propuestas concretas de los mecánicos (servicios + repuestos sugeridos
              en sus inspecciones). El admin elige cuáles pasan al presupuesto. */}
          {isDiagnosing && <InspectionProposalsCard workOrderId={order.id} />}

          {/* Presupuesto — UNA card con Servicios + Repuestos + Total, con precios
              editables (servicio y repuesto) antes de presupuestar (Diagnosing). */}
          {((order.services?.length ?? 0) > 0 || (order.parts?.length ?? 0) > 0 || isDiagnosing) && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">Presupuesto</CardTitle>
                  {isDiagnosing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStockOpen(true)}
                      className="font-semibold"
                    >
                      <PackageSearch className="w-4 h-4 mr-1.5" />
                      Consultar stock
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-5">

                {/* Servicios */}
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Servicios{(order.services?.length ?? 0) > 0 ? ` (${order.services!.length})` : ""}
                  </p>
                  <ServicesList
                    workOrderId={order.id}
                    services={order.services ?? []}
                    editable={isDiagnosing}
                    workOrderStatus={status}
                  />
                </div>

                {/* Repuestos */}
                <div className="space-y-2 border-t pt-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Repuestos{(order.parts?.length ?? 0) > 0 ? ` (${order.parts!.length})` : ""}
                  </p>
                  <PartsList
                    workOrderId={order.id}
                    parts={order.parts ?? []}
                    editable={isDiagnosing}
                  />
                </div>

                {/* Agregar items (solo Diagnosing) */}
                {isDiagnosing && (
                  <div className="border-t pt-1">
                    <AddServicePanel workOrderId={order.id} />
                    <AddPartPanel workOrderId={order.id} />
                  </div>
                )}

                {/* Total */}
                <div className="border-t pt-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-[#041627]/5 flex items-center justify-center shrink-0">
                      <ClipboardList className="w-4 h-4 text-[#fea520]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#041627]">Total presupuestado</h3>
                      <p className="text-[11px] text-muted-foreground">Suma de servicios y repuestos</p>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-[#041627] tabular-nums tracking-tight">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Motivo de visita (lo carga recepción al abrir la orden) */}
          {order.serviceReason && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Motivo de visita</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{order.serviceReason}</p>
              </CardContent>
            </Card>
          )}

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

          {/* Uploader de fotos finales del vehículo — solo en Completed para que el admin
              las cargue antes de entregar. El BE bloquea Delivered si no hay al menos una. */}
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

          {/* Resumen de la Orden (siguiendo estilo IntakeSummaryPanel) */}
          <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 bg-[#041627] text-white flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-[#fea520]" />
              <div>
                <p className="text-sm font-bold leading-none">Resumen de la orden</p>
                <p className="text-[10px] text-white/60 mt-0.5">Información general y del cliente</p>
              </div>
            </div>

            <div className="divide-y divide-[#c4c6cd]/40">
              {/* ── Tipo de ingreso & Fechas ─────────────────────────────────── */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Clock className="w-3.5 h-3.5 text-[#041627]" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#041627]">
                    Detalles del ingreso
                  </p>
                </div>
                <div className="space-y-2 mt-2">
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#fea520]/10 text-[#865300] border border-[#fea520]/30">
                      {order.fleetIdAtEntry ? "Flota / Empresa" : "Particular"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-b border-[#c4c6cd]/20 pb-1.5">
                    <span className="text-[#44474c]/70 font-medium">Creada</span>
                    <span className="text-[#041627] font-semibold">{formatDateTime(order.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-b border-[#c4c6cd]/20 pb-1.5">
                    <span className="text-[#44474c]/70 font-medium">Última actualización</span>
                    <span className="text-[#041627] font-semibold">{formatDateTime(order.updatedAt)}</span>
                  </div>
                  {order.mileageAtEntry != null && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#44474c]/70 font-medium">Kilometraje al ingreso</span>
                      <span className="text-[#041627] font-semibold">{order.mileageAtEntry.toLocaleString("es-AR")} km</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Cliente / Empresa ───────────────────────────────────────── */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-1.5 mb-2.5">
                  {order.fleetIdAtEntry ? (
                    <Building2 className="w-3.5 h-3.5 text-[#041627]" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-[#041627]" />
                  )}
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#041627]">
                    {order.fleetIdAtEntry ? "Empresa" : "Cliente"}
                  </p>
                </div>
                
                {order.fleetIdAtEntry ? (
                  <div className="space-y-2">
                    <dl className="space-y-1 text-xs">
                      <p className="text-sm font-semibold text-[#041627]">{order.ownerName ?? "—"}</p>
                    </dl>
                    
                    <div className="pt-1.5 space-y-1">
                      <Link
                        href={`/admin/fleets/${order.fleetIdAtEntry}`}
                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
                      >
                        Ver flota <ChevronRight className="w-3 h-3" />
                      </Link>
                      <br />
                      <Link
                        href={`/admin/work-orders?fleetId=${order.fleetIdAtEntry}`}
                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
                      >
                        Otras órdenes de la flota <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>

                    {order.contactPersonName && (
                      <div className="pt-2 mt-2 border-t border-[#c4c6cd]/40">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70 mb-1">
                          Conductor / Entrega
                        </p>
                        <p className="text-xs font-semibold text-[#041627]">
                          {order.contactPersonName}
                        </p>
                        {order.contactPersonPhone && (
                          <p className="text-[11px] text-[#44474c]">
                            {order.contactPersonPhone}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <dl className="space-y-1 text-xs">
                      <p className="text-sm font-semibold text-[#041627]">{order.ownerName ?? "—"}</p>
                    </dl>
                    
                    <div className="pt-1.5 space-y-1">
                      <Link
                        href={`/admin/customers/${order.customerIdAtEntry}`}
                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
                      >
                        Ver ficha <ChevronRight className="w-3 h-3" />
                      </Link>
                      <br />
                      <Link
                        href={`/admin/work-orders?customerId=${order.customerIdAtEntry}`}
                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
                      >
                        Otras órdenes <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Vehículo ────────────────────────────────────────────────── */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Car className="w-3.5 h-3.5 text-[#041627]" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#041627]">
                    Vehículo
                  </p>
                </div>
                <dl className="space-y-1 text-xs">
                  <p className="text-sm font-semibold text-[#041627]">
                    {vehicleLabel}
                  </p>
                  {order.vehicleLicensePlate && (
                    <p className="font-mono text-[#44474c] uppercase">Patente {order.vehicleLicensePlate}</p>
                  )}
                  
                  <div className="pt-1.5 space-y-1">
                    <Link
                      href={`/admin/vehicles/${order.vehicleId}`}
                      className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
                    >
                      Ver ficha <ChevronRight className="w-3 h-3" />
                    </Link>
                    <br />
                    <Link
                      href={`/admin/work-orders?vehicleId=${order.vehicleId}`}
                      className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
                    >
                      Otras órdenes <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </dl>
              </div>
              
              {/* ── Monto Total en Resumen ─────────────────────────────────── */}
              <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-slate-100/30 flex items-center justify-between border-t border-[#c4c6cd]/40">
                <div className="flex items-center gap-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#041627]">
                    Total estimado
                  </p>
                </div>
                <span className="text-base font-black text-[#041627] tabular-nums">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>
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
