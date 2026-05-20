"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ClipboardList, Tag, ChevronRight, Bell } from "lucide-react";

import { BackButton } from "@/components/shared/BackButton";
import { StatusBadge } from "@/components/work-orders/StatusBadge";
import { WorkOrderStatus, WorkOrderStatusConfig, getWorkOrderStatusConfig } from "@/lib/enums";
import { formatCurrency, formatDate } from "@/lib/format";
import { useWorkOrders } from "@/hooks/useWorkOrders";
import { useAuthStore } from "@/store/auth.store";
import { WorkOrder } from "@/types/api.types";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#c4c6cd]/60 shadow-sm p-4 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-36 bg-[#c4c6cd]/40 rounded" />
        <div className="h-5 w-24 bg-[#c4c6cd]/30 rounded-full" />
      </div>
      <div className="h-3 w-20 bg-[#c4c6cd]/30 rounded" />
      <div className="flex items-center justify-between pt-1">
        <div className="h-3 w-24 bg-[#c4c6cd]/20 rounded" />
        <div className="h-4 w-16 bg-[#c4c6cd]/30 rounded" />
      </div>
    </div>
  );
}

// ─── Card de orden ────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: WorkOrder }) {
  const isAwaitingApproval = order.currentStatus === WorkOrderStatus.AwaitingApproval;
  const config = getWorkOrderStatusConfig(order.currentStatus);
  const hint = WorkOrderStatusConfig[order.currentStatus]?.customerHint;

  return (
    <Link
      href={`/my-orders/${order.id}`}
      className={`block bg-white rounded-2xl border shadow-sm p-4 transition-all active:scale-[0.98] ${
        isAwaitingApproval
          ? "border-[#fea520] shadow-[#fea520]/20 shadow-md"
          : "border-[#c4c6cd]/60"
      }`}
    >
      {/* Fila superior: vehículo + estado */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#041627] truncate">
            {order.vehicleBrand} {order.vehicleModel}
          </p>
          <span className="inline-flex items-center gap-1 text-xs text-[#44474c] font-mono mt-0.5">
            <Tag className="w-3 h-3 text-[#44474c]/50" />
            {order.vehicleLicensePlate}
          </span>
        </div>
        <StatusBadge status={order.currentStatus} />
      </div>

      {/* Hint para el cliente si hay uno */}
      {hint && (
        <div className={`flex items-start gap-2 rounded-lg px-3 py-2 mb-3 ${
          isAwaitingApproval ? "bg-[#fea520]/10" : "bg-[#eefcfd]"
        }`}>
          <Bell className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isAwaitingApproval ? "text-[#fea520]" : "text-[#44474c]/60"}`} />
          <p className="text-xs text-[#044474c] leading-relaxed">{hint}</p>
        </div>
      )}

      {/* Fila inferior: fecha + monto + flecha */}
      <div className="flex items-center justify-between pt-1 border-t border-[#c4c6cd]/30 mt-2">
        <p className="text-xs text-[#44474c]">{formatDate(order.createdAt)}</p>
        <div className="flex items-center gap-1">
          <p className="text-sm font-bold text-[#041627] tabular-nums">
            {formatCurrency(order.totalAmount)}
          </p>
          <ChevronRight className={`w-4 h-4 ${isAwaitingApproval ? "text-[#fea520]" : "text-[#c4c6cd]"}`} />
        </div>
      </div>

      {/* CTA destacado si está esperando aprobación */}
      {isAwaitingApproval && (
        <div className="mt-3 bg-[#fea520] rounded-xl px-4 py-2.5 text-center">
          <p className="text-sm font-bold text-[#041627]">Ver y aprobar presupuesto →</p>
        </div>
      )}
    </Link>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function MyOrdersPage() {
  const searchParams            = useSearchParams();
  const vehicleId               = searchParams.get("vehicleId") ?? undefined;
  const { customerId, fleetId } = useAuthStore();

  // Las órdenes de flota están bajo fleetId; las individuales bajo customerId.
  const { data, isLoading, isError } = useWorkOrders({
    pageSize:   50,
    vehicleId,
    fleetId:    fleetId  ?? undefined,
    customerId: !fleetId ? (customerId ?? undefined) : undefined,
  });
  const items = data?.items ?? [];

  const pending = items.filter(
    (o) => o.currentStatus !== WorkOrderStatus.Delivered && o.currentStatus !== WorkOrderStatus.Cancelled
  );
  const history = items.filter(
    (o) => o.currentStatus === WorkOrderStatus.Delivered || o.currentStatus === WorkOrderStatus.Cancelled
  );

  return (
    <div className="space-y-6">

      {/* ── Navegación contextual ───────────────────────────────────────────── */}
      {vehicleId && (
        <BackButton href={`/my-vehicles/${vehicleId}`} label="Volver al vehículo" />
      )}

      {/* ── Título ──────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-[#041627]">
          {vehicleId ? "Órdenes del vehículo" : "Mis órdenes"}
        </h1>
        {!isLoading && (
          <p className="text-sm text-[#44474c] mt-0.5">
            {items.length === 0 ? "Sin órdenes registradas" : `${items.length} orden${items.length !== 1 ? "es" : ""} en total`}
          </p>
        )}
      </div>

      {/* ── Estados de carga / error / vacío ────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <OrderCardSkeleton key={i} />)}
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
          <p className="text-sm text-red-600 font-medium">No pudimos cargar tus órdenes.</p>
          <p className="text-xs text-red-400 mt-0.5">Intentá recargar la página.</p>
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <ClipboardList className="w-12 h-12 text-[#c4c6cd]" />
          <p className="text-sm font-semibold text-[#041627]">Sin órdenes todavía</p>
          <p className="text-xs text-[#44474c] max-w-xs">
            Cuando traigas tu vehículo al taller, tus órdenes de trabajo aparecerán acá.
          </p>
        </div>
      )}

      {/* ── Órdenes activas ─────────────────────────────────────────────────── */}
      {pending.length > 0 && (
        <section className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">
            Activas · {pending.length}
          </p>
          {pending.map((o) => <OrderCard key={o.id} order={o} />)}
        </section>
      )}

      {/* ── Historial ───────────────────────────────────────────────────────── */}
      {history.length > 0 && (
        <section className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">
            Historial · {history.length}
          </p>
          {history.map((o) => <OrderCard key={o.id} order={o} />)}
        </section>
      )}

    </div>
  );
}
