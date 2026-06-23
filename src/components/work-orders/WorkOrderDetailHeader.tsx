"use client";

import { useState } from "react";
import { Car } from "lucide-react";
import { toast } from "sonner";

import { BackButton } from "@/components/shared/BackButton";
import { Button } from "@/components/ui/button";
import { WorkOrder } from "@/types/api.types";
import { WorkOrderStatus } from "@/lib/enums";
import { workOrdersService } from "@/services/work-orders.service";
import { StatusBadge } from "./StatusBadge";
import { SendQuoteButton } from "./SendQuoteButton";
import { STATUS_BANNERS } from "./work-order-status-ui";

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

  const vehicleLabel =
    [order.vehicleBrand, order.vehicleModel].filter(Boolean).join(" ") || "—";
  const banner = STATUS_BANNERS[status];

  const handleDownloadQuote = async () => {
    setDownloadingPdf(true);
    try {
      const blob = await workOrdersService.downloadQuote(order.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `presupuesto-${order.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("No se pudo descargar el presupuesto");
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
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
                onClick={onChangeStatus}
                className="font-bold"
              >
                {banner?.actionLabel ?? "Cambiar estado"}
              </Button>
            )}
          </div>
        </div>
      </div>
  );
}
