"use client";

import Link from "next/link";
import { ChevronRight, CheckCircle2, XCircle } from "lucide-react";

import { PlateBadge } from "@/components/shared/PlateBadge";
import { WorkOrderStatus } from "@/lib/enums";
import { formatCurrency, formatDate } from "@/lib/format";
import { WorkOrder } from "@/types/api.types";

/**
 * Fila compacta para el historial (entregadas / canceladas): una línea por
 * orden, mucho más baja que la card de órdenes en curso, para que el historial
 * largo no obligue a scrollear de más.
 */
export function HistoryOrderRow({ order }: { order: WorkOrder }) {
  const cancelled = Number(order.currentStatus) === WorkOrderStatus.Cancelled;

  return (
    <Link
      href={`/my-orders/${order.id}`}
      className="flex items-center gap-3 bg-white rounded-xl border border-[#041627]/10 px-3.5 py-2.5 shadow-sm hover:border-[#fea520]/40 hover:shadow-md active:scale-[0.99] transition-all"
    >
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
          cancelled ? "bg-red-50" : "bg-emerald-50"
        }`}
      >
        {cancelled ? (
          <XCircle className="w-4 h-4 text-red-400" strokeWidth={2.25} />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={2.25} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <PlateBadge plate={order.vehicleLicensePlate} size="sm" />
        <p className="text-[10px] font-semibold text-[#44474c]/60 mt-1 truncate">
          {order.vehicleBrand} {order.vehicleModel} · {cancelled ? "Cancelada" : "Entregada"} · {formatDate(order.createdAt)}
        </p>
      </div>

      <p className="text-xs font-extrabold text-[#041627] tabular-nums shrink-0">
        {formatCurrency(order.totalAmount)}
      </p>
      <ChevronRight className="w-4 h-4 text-[#c4c6cd] shrink-0" />
    </Link>
  );
}
