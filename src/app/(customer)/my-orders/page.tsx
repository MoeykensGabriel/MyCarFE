"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ClipboardList, Tag, ChevronRight, Bell, Sparkles } from "lucide-react";

import { BackButton } from "@/components/shared/BackButton";
import { StatusBadge } from "@/components/work-orders/StatusBadge";
import { WorkOrderStatus, getWorkOrderStatusConfig } from "@/lib/enums";
import { formatCurrency, formatDate } from "@/lib/format";
import { useWorkOrders } from "@/hooks/useWorkOrders";
import { useAuthStore } from "@/store/auth.store";
import { WorkOrder } from "@/types/api.types";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#041627]/10 shadow-sm p-4 space-y-3 animate-pulse">
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
  const hint = config?.customerHint;

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
      <div className="flex items-start justify-between gap-3 mb-2">
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

      {/* Hint para el cliente si hay uno */}
      {hint && (
        <div className={`flex items-start gap-2 rounded-xl px-3 py-2 mb-3 transition-colors ${
          isAwaitingApproval ? "bg-[#fea520]/5" : "bg-[#eefcfd]/60"
        }`}>
          <Bell className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isAwaitingApproval ? "text-[#fea520]" : "text-[#44474c]/60"}`} />
          <p className="text-[11px] font-semibold text-[#44474c] leading-relaxed">{hint}</p>
        </div>
      )}

      {/* Fila inferior: fecha + monto + flecha */}
      <div className="flex items-center justify-between pt-2 border-t border-[#041627]/5 mt-2">
        <p className="text-xs font-semibold text-[#44474c]/70">{formatDate(order.createdAt)}</p>
        <div className="flex items-center gap-1.5">
          <p className="text-xs text-[#44474c]/60 mr-1">Monto total:</p>
          <p className="text-sm font-extrabold text-[#041627] tabular-nums bg-[#041627]/5 px-2 py-0.5 rounded-lg">
            {formatCurrency(order.totalAmount)}
          </p>
          <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isAwaitingApproval ? "text-[#fea520]" : "text-[#c4c6cd]"}`} />
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
    <div className="space-y-5">

      {/* ── Navegación contextual ───────────────────────────────────────────── */}
      {vehicleId && (
        <BackButton href={`/my-vehicles/${vehicleId}`} label="Volver al vehículo" />
      )}

      {/* ── Título y Header Premium ─────────────────────────────────────────── */}
      <div className="bg-[#041627] text-white rounded-2xl p-5 shadow-md shadow-[#041627]/10 relative overflow-hidden">
        {/* Decoración circular de fondo */}
        <div className="absolute -right-10 -bottom-10 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#fea520]" />
            <h1 className="text-lg font-extrabold tracking-wide">
              {vehicleId ? "Órdenes del vehículo" : "Mis órdenes de trabajo"}
            </h1>
          </div>
          {!isLoading && (
            <div className="flex gap-4 mt-3 pt-3 border-t border-white/10">
              <div>
                <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Activas</p>
                <p className="text-xl font-black text-[#fea520]">{pending.length}</p>
              </div>
              <div className="border-l border-white/10 pl-4">
                <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Historial</p>
                <p className="text-xl font-black text-white/80">{history.length}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Estados de carga / error / vacío ────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <OrderCardSkeleton key={i} />)}
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center shadow-sm">
          <p className="text-sm text-red-600 font-bold">No pudimos cargar tus órdenes.</p>
          <p className="text-xs text-red-400 mt-1">Por favor, intentá de nuevo recargando la página.</p>
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 px-4 text-center bg-white border border-[#041627]/10 rounded-2xl shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#eefcfd] flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-[#041627]" />
          </div>
          <p className="text-sm font-extrabold text-[#041627]">Sin órdenes todavía</p>
          <p className="text-xs text-[#44474c]/85 max-w-xs leading-relaxed">
            Cuando traigas tu vehículo al taller, tus órdenes de trabajo y presupuestos aparecerán acá para que los sigas al instante.
          </p>
        </div>
      )}

      {/* ── Órdenes activas ─────────────────────────────────────────────────── */}
      {pending.length > 0 && (
        <section className="space-y-3">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#44474c] bg-[#eefcfd] border border-[#c4c6cd]/40 w-fit px-2.5 py-0.5 rounded-full shadow-sm">
            Activas · {pending.length}
          </p>
          <div className="space-y-3">
            {pending.map((o) => <OrderCard key={o.id} order={o} />)}
          </div>
        </section>
      )}

      {/* ── Historial ───────────────────────────────────────────────────────── */}
      {history.length > 0 && (
        <section className="space-y-3">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#44474c] bg-[#f4f6f8] border border-[#c4c6cd]/40 w-fit px-2.5 py-0.5 rounded-full shadow-sm">
            Historial · {history.length}
          </p>
          <div className="space-y-3">
            {history.map((o) => <OrderCard key={o.id} order={o} />)}
          </div>
        </section>
      )}

    </div>
  );
}
