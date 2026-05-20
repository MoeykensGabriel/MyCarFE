"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Tag, Clock, Wrench, FileText, Bell, CheckCircle2, MoveRight, Download } from "lucide-react";

import { BackButton } from "@/components/shared/BackButton";
import { ContactWorkshopCard } from "@/components/shared/ContactWorkshopCard";
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
      <div className="bg-white rounded-2xl border border-[#c4c6cd]/60 p-5 space-y-3">
        <div className="h-5 w-48 bg-[#c4c6cd]/40 rounded" />
        <div className="h-4 w-24 bg-[#c4c6cd]/30 rounded" />
        <div className="h-6 w-28 bg-[#c4c6cd]/20 rounded-full" />
      </div>
      <div className="bg-white rounded-2xl border border-[#c4c6cd]/60 p-5 space-y-3">
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
    <section className="bg-white rounded-2xl border border-[#c4c6cd]/60 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#c4c6cd]/40 bg-[#eefcfd]">
        <Icon className="w-3.5 h-3.5 text-[#44474c]/60" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">{title}</p>
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
        <p className="text-sm text-[#44474c]/60 italic">Los servicios serán cargados durante el diagnóstico.</p>
      </Section>
    );
  }

  return (
    <Section icon={Wrench} title="Servicios">
      <div className="space-y-0 divide-y divide-[#c4c6cd]/30">
        {services.map((s) => (
          <div key={s.id} className="flex items-start justify-between gap-3 py-3 first:pt-0">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#041627]">{s.nameSnapshot}</p>
              {s.descriptionSnapshot && (
                <p className="text-xs text-[#44474c] mt-0.5">{s.descriptionSnapshot}</p>
              )}
              {s.quantity > 1 && (
                <p className="text-xs text-[#44474c]/60 mt-0.5">
                  {s.quantity} × {formatCurrency(s.priceSnapshot)}
                </p>
              )}
            </div>
            <p className="text-sm font-bold text-[#041627] tabular-nums shrink-0">{formatCurrency(s.subtotal)}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 mt-1 border-t border-[#c4c6cd]/50">
        <p className="text-sm font-bold text-[#041627]">Total</p>
        <p className="text-lg font-bold text-[#041627] tabular-nums">{formatCurrency(totalAmount)}</p>
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
    <Section icon={Clock} title="Historial">
      {sorted.length === 0 ? (
        <p className="text-sm text-[#44474c]/60 italic">Sin movimientos registrados.</p>
      ) : (
        <ol className="space-y-3">
          {sorted.map((entry, i) => {
            const toConfig   = getWorkOrderStatusConfig(entry.toStatus);
            const fromConfig = entry.fromStatus !== null ? getWorkOrderStatusConfig(entry.fromStatus) : null;
            const isFirst    = i === 0;

            return (
              <li key={entry.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${isFirst ? "bg-[#fea520]" : "bg-[#c4c6cd]"}`} />
                  {i < sorted.length - 1 && <div className="w-px flex-1 bg-[#c4c6cd]/40 mt-1" />}
                </div>
                <div className="pb-3 min-w-0">
                  <p className="text-sm font-semibold text-[#041627] flex items-center gap-1 flex-wrap">
                    {fromConfig && (
                      <span className="text-[#44474c]/60 font-normal flex items-center gap-1">
                        {fromConfig.label}
                        <MoveRight className="w-3 h-3" />
                      </span>
                    )}
                    {toConfig.label}
                  </p>
                  <p className="text-xs text-[#44474c]/60 mt-0.5">{formatDateTime(entry.changedAt)}</p>
                  {entry.note && (
                    <p className="text-xs text-[#44474c] mt-1 italic">"{entry.note}"</p>
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
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
        <p className="text-sm text-red-600 font-medium">No pudimos cargar esta orden.</p>
        <p className="text-xs text-red-400 mt-0.5">Intentá recargar la página.</p>
      </div>
    </div>
  );

  const status              = Number(order.currentStatus) as WorkOrderStatus;
  const isAwaitingApproval  = status === WorkOrderStatus.AwaitingApproval;
  const isDelivered         = status === WorkOrderStatus.Delivered;
  const hint                = WorkOrderStatusConfig[status]?.customerHint;
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
    <div className="space-y-4">

      {/* ── Navegación ──────────────────────────────────────────────────────── */}
      <BackButton href="/my-orders" label="Mis órdenes" />

      {/* ── Header de la orden ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#c4c6cd]/60 shadow-sm p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-[#44474c]/60 font-mono mb-1">
              #{order.id.slice(0, 8).toUpperCase()}
            </p>
            <h1 className="text-lg font-bold text-[#041627] truncate">{vehicleLabel}</h1>
            {order.vehicleLicensePlate && (
              <span className="inline-flex items-center gap-1 text-xs font-mono text-[#44474c] mt-0.5">
                <Tag className="w-3 h-3 text-[#44474c]/50" />
                {order.vehicleLicensePlate}
              </span>
            )}
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#c4c6cd]/30">
          <p className="text-xs text-[#44474c]">{formatDate(order.createdAt)}</p>
          <p className="text-base font-bold text-[#041627] tabular-nums">
            {formatCurrency(order.totalAmount)}
          </p>
        </div>
      </div>

      {/* ── Tiempo estimado de trabajo ──────────────────────────────────────── */}
      {showEta && (
        <div className="flex items-center gap-3 bg-white border border-[#c4c6cd]/60 rounded-2xl px-4 py-3 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-[#eefcfd] text-[#041627] flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">
              Tiempo estimado de trabajo
            </p>
            <p className="text-sm font-semibold text-[#041627] mt-0.5">
              {etaLabel}
            </p>
          </div>
          <p className="text-[10px] text-[#44474c]/60 italic max-w-[140px] text-right leading-tight shrink-0">
            Estimación. Puede variar según diagnóstico final.
          </p>
        </div>
      )}

      {/* ── Entregado: banner de celebración ────────────────────────────────── */}
      {isDelivered && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <p className="text-sm font-semibold text-emerald-800">¡Tu vehículo fue entregado!</p>
        </div>
      )}

      {/* ── Botón descargar PDF del presupuesto ─────────────────────────────── */}
      {quotePdfAvailable && (order.services?.length ?? 0) > 0 && (
        <button
          onClick={handleDownloadQuote}
          disabled={downloadingPdf}
          className="w-full flex items-center justify-between gap-3 bg-white border border-[#c4c6cd]/60 rounded-2xl px-4 py-3 shadow-sm active:scale-[0.99] hover:border-[#041627] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#041627] text-[#fea520] flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-sm font-semibold text-[#041627]">Presupuesto en PDF</p>
              <p className="text-[11px] text-[#44474c]">
                {downloadingPdf ? "Generando..." : "Descargalo como comprobante"}
              </p>
            </div>
          </div>
          <Download className={`w-4 h-4 shrink-0 ${downloadingPdf ? "text-[#c4c6cd]" : "text-[#fea520]"}`} />
        </button>
      )}

      {/* ── Hint de estado (diagnóstico, en espera, etc.) ───────────────────── */}
      {hint && !isDelivered && (
        <div className={`flex items-start gap-3 rounded-2xl px-4 py-3 ${
          isAwaitingApproval
            ? "bg-[#fea520]/10 border border-[#fea520]/40"
            : "bg-[#eefcfd] border border-[#c4c6cd]/60"
        }`}>
          <Bell className={`w-4 h-4 shrink-0 mt-0.5 ${isAwaitingApproval ? "text-[#fea520]" : "text-[#44474c]/50"}`} />
          <p className="text-sm text-[#041627] leading-relaxed">{hint}</p>
        </div>
      )}

      {/* ── CTA aprobar presupuesto ─────────────────────────────────────────── */}
      {isAwaitingApproval && (order.services?.length ?? 0) > 0 && (
        <div className="bg-[#fea520] rounded-2xl p-4 space-y-3">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#041627]" />
              <p className="text-sm font-bold text-[#041627]">Presupuesto pendiente</p>
            </div>
            <p className="text-xs text-[#041627]/70 leading-relaxed mt-1">
              Revisá los servicios detallados abajo. Total: <span className="font-bold">{formatCurrency(order.totalAmount)}</span>.
            </p>
          </div>

          {confirmOpen ? (
            <div className="space-y-2">
              <p className="text-xs text-[#041627] leading-relaxed">
                Al aprobar autorizás la realización de los servicios y el cobro del monto total al momento de la entrega.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => approveMutation.mutate()}
                  disabled={approveMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold bg-[#041627] text-white hover:bg-[#0a2540] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {approveMutation.isPending ? "Aprobando..." : "Sí, aprobar"}
                </button>
                <button
                  onClick={() => setConfirmOpen(false)}
                  disabled={approveMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-white/30 text-[#041627] hover:bg-white/50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold bg-[#041627] text-white hover:bg-[#0a2540] active:scale-[0.98] transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              Aprobar presupuesto
            </button>
          )}

          <p className="text-[10px] text-[#041627]/60 text-center">
            También podés aprobar desde el link que te enviamos por email.
          </p>
        </div>
      )}

      {/* ── Servicios ───────────────────────────────────────────────────────── */}
      <ServicesSection services={order.services ?? []} totalAmount={order.totalAmount} />

      {/* ── Nota del mecánico ───────────────────────────────────────────────── */}
      {order.technicianNote && (
        <Section icon={FileText} title="Nota del taller">
          <p className="text-sm text-[#041627] leading-relaxed whitespace-pre-wrap">
            {order.technicianNote}
          </p>
        </Section>
      )}

      {/* ── Nota del cliente ────────────────────────────────────────────────── */}
      {order.customerNote && (
        <Section icon={FileText} title="Tu nota">
          <p className="text-sm text-[#44474c] leading-relaxed whitespace-pre-wrap">
            {order.customerNote}
          </p>
        </Section>
      )}

      {/* ── Historial ───────────────────────────────────────────────────────── */}
      <TimelineSection timeline={order.timeline ?? []} />

      {/* ── Contacto con el taller ──────────────────────────────────────────── */}
      <ContactWorkshopCard
        orderContext={{ orderId: order.id, vehicleLabel }}
        title="¿Una consulta sobre esta orden?"
        subtitle="Contactanos y te respondemos a la brevedad."
      />

    </div>
  );
}
