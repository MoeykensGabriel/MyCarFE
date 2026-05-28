"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Tag, Clock, Wrench, FileText, Bell, CheckCircle2, MoveRight, Download, Sparkles, AlertTriangle, ShieldCheck } from "lucide-react";

import { BackButton } from "@/components/shared/BackButton";
import { ContactWorkshopCard } from "@/components/shared/ContactWorkshopCard";
import { BeforeAfterGallery } from "@/components/work-orders/BeforeAfterGallery";
import { StatusBadge } from "@/components/work-orders/StatusBadge";
import { WorkOrderStatus, WorkOrderStatusConfig, getWorkOrderStatusConfig } from "@/lib/enums";
import { formatCurrency, formatDate, formatDateTime, formatEstimatedDuration } from "@/lib/format";
import { useWorkOrder, useApproveAsCustomer } from "@/hooks/useWorkOrders";
import { workOrdersService } from "@/services/work-orders.service";
import { WorkOrderService, WorkOrderTimelineEntry } from "@/types/api.types";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 w-32 bg-[#c4c6cd]/40 rounded" />
      <div className="bg-white rounded-2xl border border-[#041627]/10 p-5 space-y-3">
        <div className="h-5 w-48 bg-[#c4c6cd]/40 rounded" />
        <div className="h-4 w-24 bg-[#c4c6cd]/30 rounded" />
        <div className="h-6 w-28 bg-[#c4c6cd]/20 rounded-full" />
      </div>
      <div className="bg-white rounded-2xl border border-[#041627]/10 p-5 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-4 w-36 bg-[#c4c6cd]/30 rounded" />
            <div className="h-4 w-16 bg-[#c4c6cd]/20 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sección con título ───────────────────────────────────────────────────────

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-[#041627]/10 shadow-sm overflow-hidden transition-all duration-300 hover:border-[#fea520]/20 hover:shadow-md">
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-[#041627]/5 bg-gradient-to-r from-[#eefcfd] to-white">
        <Icon className="w-4 h-4 text-[#041627]" strokeWidth={2} />
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627]/80">{title}</p>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

// ─── Lista de servicios (read-only) ───────────────────────────────────────────

function ServicesSection({ services, totalAmount }: { services: WorkOrderService[]; totalAmount: number }) {
  if (!services.length) {
    return (
      <Section icon={Wrench} title="Servicios">
        <p className="text-xs text-[#44474c]/70 italic text-center py-4">Los servicios serán cargados durante el diagnóstico.</p>
      </Section>
    );
  }

  return (
    <Section icon={Wrench} title="Servicios Detallados">
      <div className="space-y-0 divide-y divide-[#041627]/5">
        {services.map((s) => (
          <div key={s.id} className="flex items-start justify-between gap-3 py-3 first:pt-0">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#041627] leading-snug">{s.nameSnapshot}</p>
              {s.descriptionSnapshot && (
                <p className="text-[11px] text-[#44474c]/80 mt-0.5 leading-relaxed">{s.descriptionSnapshot}</p>
              )}
              {s.quantity > 1 && (
                <p className="text-[10px] font-semibold text-[#44474c]/60 mt-1">
                  Cant: {s.quantity} × {formatCurrency(s.priceSnapshot)}
                </p>
              )}
            </div>
            <p className="text-xs font-extrabold text-[#041627] tabular-nums shrink-0 bg-[#041627]/5 px-2.5 py-1 rounded-lg self-center">
              {formatCurrency(s.subtotal)}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#041627]/10">
        <div>
          <p className="text-xs font-extrabold text-[#041627]/70 uppercase tracking-widest">Monto Total</p>
          <p className="text-[9px] text-[#44474c]/65 font-bold uppercase tracking-wider mt-0.5">IVA e impuestos incluidos</p>
        </div>
        <p className="text-xl font-black text-[#041627] tabular-nums tracking-tight bg-[#fea520]/10 px-3.5 py-1 rounded-xl border border-[#fea520]/20">
          {formatCurrency(totalAmount)}
        </p>
      </div>
    </Section>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function TimelineSection({ timeline }: { timeline: WorkOrderTimelineEntry[] }) {
  const sorted = [...timeline].sort(
    (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
  );

  return (
    <Section icon={Clock} title="Historial del Vehículo">
      {sorted.length === 0 ? (
        <p className="text-xs text-[#44474c]/70 italic text-center py-4">Sin movimientos registrados.</p>
      ) : (
        <ol className="space-y-4">
          {sorted.map((entry, i) => {
            const toConfig   = getWorkOrderStatusConfig(entry.toStatus);
            const fromConfig = entry.fromStatus !== null ? getWorkOrderStatusConfig(entry.fromStatus) : null;
            const isFirst    = i === 0;

            return (
              <li key={entry.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full shrink-0 mt-1 transition-all ${isFirst ? "bg-[#fea520] ring-4 ring-[#fea520]/20 animate-pulse" : "bg-[#c4c6cd]"}`} />
                  {i < sorted.length - 1 && <div className="w-0.5 flex-1 bg-[#c4c6cd]/40 mt-1.5" />}
                </div>
                <div className="pb-2 min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#041627] flex items-center gap-1.5 flex-wrap">
                    {fromConfig && (
                      <span className="text-[#44474c]/50 font-normal flex items-center gap-1 text-[11px]">
                        {fromConfig.label}
                        <MoveRight className="w-2.5 h-2.5" />
                      </span>
                    )}
                    <span className={isFirst ? "text-[#041627]" : "text-[#44474c]/80"}>{toConfig.label}</span>
                  </p>
                  <p className="text-[10px] font-semibold text-[#44474c]/60 mt-0.5">{formatDateTime(entry.changedAt)}</p>
                  {entry.note && (
                    <div className="mt-1.5 bg-[#f4f6f8] px-3 py-2 rounded-xl border border-[#041627]/5">
                      <p className="text-xs text-[#44474c] italic">"{entry.note}"</p>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Section>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function MyOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, isError } = useWorkOrder(id);
  const approveMutation = useApproveAsCustomer(id);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Descarga el PDF del presupuesto y lo abre como descarga del navegador.
  async function handleDownloadQuote() {
    setDownloadingPdf(true);
    try {
      const blob = await workOrdersService.downloadQuote(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Presupuesto-${id.slice(0, 8).toUpperCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("No se pudo descargar el presupuesto. Intentá de nuevo.");
    } finally {
      setDownloadingPdf(false);
    }
  }

  if (isLoading) return (
    <div className="space-y-4">
      <BackButton href="/my-orders" label="Mis órdenes" />
      <Skeleton />
    </div>
  );

  if (isError || !order) return (
    <div className="space-y-4">
      <BackButton href="/my-orders" label="Mis órdenes" />
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
        <p className="text-sm text-red-600 font-extrabold">No pudimos cargar esta orden.</p>
        <p className="text-xs text-red-400 mt-1">Intentá recargar la página.</p>
      </div>
    </div>
  );

  const status              = Number(order.currentStatus) as WorkOrderStatus;
  const isAwaitingApproval  = status === WorkOrderStatus.AwaitingApproval;
  const isDelivered         = status === WorkOrderStatus.Delivered;
  const config              = getWorkOrderStatusConfig(status);
  const hint                = config?.customerHint;
  const vehicleLabel        = [order.vehicleBrand, order.vehicleModel].filter(Boolean).join(" ") || "—";

  // El PDF está disponible desde que la orden tiene presupuesto: no en Received/Diagnosing.
  const quotePdfAvailable =
    status !== WorkOrderStatus.Received && status !== WorkOrderStatus.Diagnosing;

  // Suma de duraciones estimadas (por servicio × cantidad). Se muestra solo
  // cuando hay presupuesto cargado y la orden todavía no está terminada/cancelada.
  const totalEstimatedMinutes = (order.services ?? []).reduce(
    (acc, s) => acc + (s.estimatedDurationMinutes ?? 0) * (s.quantity ?? 1),
    0,
  );
  const showEta =
    totalEstimatedMinutes > 0 &&
    quotePdfAvailable &&
    status !== WorkOrderStatus.Completed &&
    status !== WorkOrderStatus.Delivered &&
    status !== WorkOrderStatus.Cancelled;
  const etaLabel = formatEstimatedDuration(totalEstimatedMinutes);

  return (
    <div className="space-y-4 pb-12">

      {/* ── Navegación ──────────────────────────────────────────────────────── */}
      <BackButton href="/my-orders" label="Volver a mis órdenes" />

      {/* ── Ticket Header Premium ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#041627]/10 shadow-md relative overflow-hidden">
        {/* Adorno tipo Ticket Digital */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#fea520]" />
        
        <div className="p-5 pt-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="inline-block bg-[#041627]/5 text-[#041627] text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded font-mono">
                Orden #{order.id.slice(0, 8).toUpperCase()}
              </span>
              <h1 className="text-base font-black text-[#041627] mt-1.5 leading-tight truncate">{vehicleLabel}</h1>
              {order.vehicleLicensePlate && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#44474c] mt-1 bg-[#f4f6f8] px-2 py-0.5 rounded-md font-mono">
                  <Tag className="w-3.5 h-3.5 text-[#44474c]/50" />
                  {order.vehicleLicensePlate}
                </span>
              )}
            </div>
            <StatusBadge status={status} />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-dashed border-[#041627]/10">
            <div>
              <p className="text-[9px] text-[#44474c]/60 font-bold uppercase tracking-wider">Fecha de Ingreso</p>
              <p className="text-xs font-bold text-[#041627] mt-0.5">{formatDate(order.createdAt)}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-[#44474c]/60 font-bold uppercase tracking-wider">Importe Acumulado</p>
              <p className="text-sm font-extrabold text-[#041627] mt-0.5 tabular-nums bg-[#041627]/5 px-2.5 py-0.5 rounded-md inline-block">
                {formatCurrency(order.totalAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tiempo estimado de trabajo (showEta) ────────────────────────────── */}
      {showEta && (
        <div className="flex items-center gap-3 bg-gradient-to-r from-[#eefcfd] to-white border border-[#c4c6cd]/40 rounded-2xl p-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-white text-[#041627] flex items-center justify-center shrink-0 shadow-sm border border-[#041627]/5">
            <Clock className="w-5 h-5 text-[#fea520]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#44474c]/70">
              Tiempo Estimado de Trabajo
            </p>
            <p className="text-xs font-extrabold text-[#041627] mt-0.5 leading-none">
              {etaLabel}
            </p>
          </div>
          <p className="text-[9px] text-[#44474c]/50 italic max-w-[120px] text-right leading-tight shrink-0 font-medium">
            Sujeto a variación del diagnóstico
          </p>
        </div>
      )}

      {/* ── Entregado: banner de celebración ────────────────────────────────── */}
      {isDelivered && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-emerald-800">¡Vehículo Entregado!</p>
            <p className="text-[11px] text-emerald-700/80 font-semibold mt-0.5">Muchas gracias por confiar en MyCar.</p>
          </div>
        </div>
      )}

      {/* ── Botón descargar PDF del presupuesto ─────────────────────────────── */}
      {quotePdfAvailable && (order.services?.length ?? 0) > 0 && (
        <button
          onClick={handleDownloadQuote}
          disabled={downloadingPdf}
          className="w-full flex items-center justify-between gap-3 bg-white border border-[#041627]/10 rounded-2xl p-4 shadow-sm active:scale-[0.99] hover:border-[#fea520]/60 transition-all disabled:opacity-60 disabled:cursor-not-allowed group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#041627] text-[#fea520] flex items-center justify-center shrink-0 shadow-md shadow-[#041627]/10">
              <FileText className="w-5 h-5 group-hover:scale-105 transition-transform" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-xs font-extrabold text-[#041627] uppercase tracking-wider">Presupuesto en PDF</p>
              <p className="text-[11px] text-[#44474c] mt-0.5">
                {downloadingPdf ? "Generando documento..." : "Descargalo como comprobante"}
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#fea520]/10 flex items-center justify-center shrink-0 group-hover:bg-[#fea520]/20 transition-colors">
            <Download className={`w-4 h-4 ${downloadingPdf ? "text-[#c4c6cd]" : "text-[#fea520]"}`} />
          </div>
        </button>
      )}

      {/* ── Hint de estado (diagnóstico, en espera, etc.) ───────────────────── */}
      {hint && !isDelivered && (
        <div className={`flex items-start gap-3 rounded-2xl p-4 border transition-all ${
          isAwaitingApproval
            ? "bg-[#fea520]/5 border-[#fea520]/40 shadow-sm shadow-[#fea520]/5"
            : "bg-[#eefcfd]/60 border-[#c4c6cd]/50 shadow-sm"
        }`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isAwaitingApproval ? "bg-[#fea520]/15" : "bg-white"}`}>
            <Bell className={`w-4 h-4 shrink-0 ${isAwaitingApproval ? "text-[#fea520] animate-bounce" : "text-[#041627]"}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627]/70">Estado de tu vehículo</p>
            <p className="text-[11px] font-semibold text-[#041627] leading-relaxed mt-0.5">{hint}</p>
          </div>
        </div>
      )}

      {/* ── CTA APROBAR PRESUPUESTO PREMIUM ─────────────────────────────────── */}
      {isAwaitingApproval && (order.services?.length ?? 0) > 0 && (
        <div className="bg-[#fea520] bg-gradient-to-br from-[#fea520] to-[#fec15d] rounded-2xl p-5 space-y-4 shadow-lg shadow-[#fea520]/15 border border-[#fea520] relative overflow-hidden text-[#041627]">
          {/* Adornos estéticos */}
          <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <p className="text-xs font-black uppercase tracking-widest">Presupuesto Listo</p>
            </div>
            <p className="text-xs font-semibold leading-relaxed mt-1.5">
              Revisá los servicios detallados a continuación. El total presupuestado es de: <span className="font-black bg-[#041627]/10 px-2 py-0.5 rounded">{formatCurrency(order.totalAmount)}</span>.
            </p>
          </div>

          <div className="border-t border-[#041627]/10 pt-3 relative z-10">
            {confirmOpen ? (
              <div className="space-y-3 animate-[fadeIn_0.2s_ease-out]">
                <div className="flex gap-2 items-start bg-white/20 p-2.5 rounded-xl border border-white/30">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-[#041627]" />
                  <p className="text-[10px] font-bold leading-normal">
                    Al confirmar, autorizás al taller a iniciar los trabajos indicados. El abono se realiza al momento de la entrega.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approveMutation.mutate({
                      approvedServiceIds: (order.services ?? []).map((s) => s.id),
                      approvedPartIds:    (order.parts    ?? []).map((p) => p.id),
                    })}
                    disabled={approveMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-wider bg-[#041627] text-white hover:bg-[#0c2e4e] active:scale-[0.97] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {approveMutation.isPending ? "Aprobando..." : "Confirmar Aprobación"}
                  </button>
                  <button
                    onClick={() => setConfirmOpen(false)}
                    disabled={approveMutation.isPending}
                    className="py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-white/30 text-[#041627] hover:bg-white/50 transition-colors active:scale-[0.97]"
                  >
                    Volver
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest bg-[#041627] text-white hover:bg-[#0c2e4e] active:scale-[0.97] transition-all shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                Aprobar presupuesto
              </button>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[9px] font-bold text-[#041627]/60 text-center relative z-10">
            <ShieldCheck className="w-3.5 h-3.5" />
            Transacción 100% segura y autorizada
          </div>
        </div>
      )}

      {/* ── Servicios ───────────────────────────────────────────────────────── */}
      <ServicesSection services={order.services ?? []} totalAmount={order.totalAmount} />

      {/* ── Galería Antes / Después ────────────────────────────────────────── */}
      <BeforeAfterGallery order={order} />

      {/* ── Nota del mecánico ───────────────────────────────────────────────── */}
      {order.technicianNote && (
        <Section icon={FileText} title="Nota de nuestro taller">
          <p className="text-xs text-[#041627] font-semibold leading-relaxed whitespace-pre-wrap">
            {order.technicianNote}
          </p>
        </Section>
      )}

      {/* ── Nota del cliente ────────────────────────────────────────────────── */}
      {order.customerNote && (
        <Section icon={FileText} title="Tu Nota (Ingreso)">
          <p className="text-xs text-[#44474c] leading-relaxed whitespace-pre-wrap">
            {order.customerNote}
          </p>
        </Section>
      )}

      {/* ── Historial ───────────────────────────────────────────────────────── */}
      <TimelineSection timeline={order.timeline ?? []} />

      {/* ── Contacto con el taller ──────────────────────────────────────────── */}
      <ContactWorkshopCard
        orderContext={{ orderId: order.id, vehicleLabel }}
        title="¿Alguna duda sobre tu presupuesto?"
        subtitle="Contactanos por WhatsApp o llamada directa. Estamos para asesorarte."
      />

    </div>
  );
}
