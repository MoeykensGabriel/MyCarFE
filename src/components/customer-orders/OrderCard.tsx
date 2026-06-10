"use client";

import Link from "next/link";
import { Tag, ChevronRight, Sparkles } from "lucide-react";

import { StatusBadge } from "@/components/work-orders/StatusBadge";
import { WorkOrderStatus } from "@/lib/enums";
import { formatCurrency, formatDate } from "@/lib/format";
import { WorkOrder } from "@/types/api.types";

import { OrderStatusStepper } from "./OrderStatusStepper";

/**
 * Card de una orden en curso: vehículo + patente, barra de progreso de etapas
 * y CTA destacado cuando espera aprobación del cliente.
 */
export function OrderCard({ order }: { order: WorkOrder }) {
  const status = Number(order.currentStatus) as WorkOrderStatus;
  const isAwaitingApproval = status === WorkOrderStatus.AwaitingApproval;

  return (
    <Link
      href={`/my-orders/${order.id}`}
      className={`block bg-white rounded-2xl border shadow-sm p-4 transition-all duration-300 active:scale-[0.98] ${
        isAwaitingApproval
          ? "border-[#fea520] shadow-[0_4px_20px_rgba(254,165,32,0.12)] hover:shadow-[0_6px_24px_rgba(254,165,32,0.18)]"
          : "border-[#041627]/10 hover:border-[#fea520]/40 hover:shadow-md"
      }`}
    >
      {/* Etiqueta superior flotante para órdenes que esperan aprobación */}
      {isAwaitingApproval && (
        <div className="flex items-center gap-1 bg-[#fea520]/15 text-[#e8951d] text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full w-fit mb-2.5 animate-pulse">
          <Sparkles className="w-3 h-3" />
          Requiere tu aprobación
        </div>
      )}

      {/* Fila superior: vehículo + estado */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-[#041627] truncate">
            {order.vehicleBrand} {order.vehicleModel}
          </p>
          <span className="inline-flex items-center gap-1 text-[11px] text-[#44474c] font-semibold font-mono mt-0.5 bg-[#f4f6f8] px-2 py-0.5 rounded-md">
            <Tag className="w-3 h-3 text-[#44474c]/50" />
            {order.vehicleLicensePlate}
          </span>
        </div>
        <StatusBadge status={order.currentStatus} />
      </div>

      {/* Progreso del viaje de la orden */}
      <OrderStatusStepper status={status} />

      {/* Fila inferior: fecha + monto + flecha */}
      <div className="flex items-center justify-between pt-2.5 border-t border-[#041627]/5 mt-3">
        <p className="text-xs font-semibold text-[#44474c]/70">{formatDate(order.createdAt)}</p>
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-extrabold text-[#041627] tabular-nums bg-[#041627]/5 px-2 py-0.5 rounded-lg">
            {formatCurrency(order.totalAmount)}
          </p>
          <ChevronRight className={`w-4 h-4 ${isAwaitingApproval ? "text-[#fea520]" : "text-[#c4c6cd]"}`} />
        </div>
      </div>

      {/* CTA destacado si está esperando aprobación */}
      {isAwaitingApproval && (
        <div className="mt-3.5 bg-gradient-to-r from-[#fea520] to-[#fec15d] rounded-xl px-4 py-2.5 text-center shadow-sm active:scale-[0.98] transition-transform">
          <p className="text-xs font-extrabold text-[#041627] uppercase tracking-wider">Ver y aprobar presupuesto →</p>
        </div>
      )}
    </Link>
  );
}

/** Placeholder de carga con la misma silueta que la card. */
export function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#041627]/10 shadow-sm p-4 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-36 bg-[#c4c6cd]/40 rounded" />
        <div className="h-5 w-24 bg-[#c4c6cd]/30 rounded-full" />
      </div>
      <div className="h-1.5 w-full bg-[#c4c6cd]/30 rounded-full" />
      <div className="flex items-center justify-between pt-1">
        <div className="h-3 w-24 bg-[#c4c6cd]/20 rounded" />
        <div className="h-4 w-16 bg-[#c4c6cd]/30 rounded" />
      </div>
    </div>
  );
}
