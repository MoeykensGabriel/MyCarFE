"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ClipboardList,
  TrendingUp,
  Calendar,
  CalendarDays,
  ChevronRight,
} from "lucide-react";

import { StatusBadge } from "@/components/work-orders/StatusBadge";
import { WorkshopLoadCard } from "@/components/dashboard/WorkshopLoadCard";
import { ExpiringApprovalsCard } from "@/components/dashboard/ExpiringApprovalsCard";
import { TopMechanicsCard } from "@/components/dashboard/TopMechanicsCard";
import { TopServicesCard } from "@/components/dashboard/TopServicesCard";
import { QuickActionsCard } from "@/components/dashboard/QuickActionsCard";
import { VehiclesToPickupCard } from "@/components/dashboard/VehiclesToPickupCard";
import { useDashboardStats } from "@/hooks/useDashboard";
import { formatCurrency, formatDate } from "@/lib/format";
import { WorkOrderStatus } from "@/lib/enums";
import { DashboardOrdersByStatus } from "@/types/api.types";

// ─── Configuración visual de estados para el breakdown ────────────────────────

const STATUS_BREAKDOWN: {
  key: keyof DashboardOrdersByStatus;
  label: string;
  barClass: string;
  textClass: string;
}[] = [
  { key: "received",         label: "Recibido",            barClass: "bg-slate-400",   textClass: "text-slate-600"  },
  { key: "diagnosing",       label: "En diagnóstico",      barClass: "bg-blue-500",    textClass: "text-blue-700"   },
  { key: "awaitingApproval", label: "Esp. aprobación",     barClass: "bg-[#fea520]",   textClass: "text-[#865300]"  },
  { key: "approved",         label: "Aprobado",            barClass: "bg-purple-500",  textClass: "text-purple-700" },
  { key: "inProgress",       label: "En progreso",         barClass: "bg-indigo-500",  textClass: "text-indigo-700" },
  { key: "completed",        label: "Completado",          barClass: "bg-green-500",   textClass: "text-green-700"  },
  { key: "delivered",        label: "Entregado",           barClass: "bg-emerald-500", textClass: "text-emerald-700"},
  { key: "cancelled",        label: "Cancelado",           barClass: "bg-red-400",     textClass: "text-red-600"    },
];

// ─── Componente KPI card ───────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border shadow-sm px-5 py-4 flex items-start justify-between gap-4 ${
        accent
          ? "bg-[#041627] border-[#041627] text-white"
          : "bg-white border-[#c4c6cd] text-[#041627]"
      }`}
    >
      <div className="space-y-1 min-w-0">
        <p className={`text-[11px] font-bold uppercase tracking-widest ${accent ? "text-white/50" : "text-[#44474c]/70"}`}>
          {label}
        </p>
        <p className={`text-2xl font-bold tabular-nums ${accent ? "text-white" : "text-[#041627]"}`}>
          {value}
        </p>
        {sub && (
          <p className={`text-xs truncate ${accent ? "text-white/40" : "text-[#44474c]/60"}`}>{sub}</p>
        )}
      </div>
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          accent ? "bg-white/10" : "bg-[#eefcfd] border border-[#c4c6cd]/60"
        }`}
      >
        <Icon className={`w-5 h-5 ${accent ? "text-[#fea520]" : "text-[#041627]"}`} />
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-[#c4c6cd]/30 ${className}`} />;
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboardStats();

  const today = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6 w-full max-w-7xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#041627]">Dashboard</h1>
        <p className="text-sm text-[#44474c] mt-0.5 capitalize">{today}</p>
      </div>

      {/* Alerta: aprobaciones pendientes (full width) */}
      {!isLoading && (data?.pendingApprovals ?? 0) > 0 && (
        <Link
          href="/admin/work-orders?status=2"
          className="flex items-center gap-3 rounded-xl border border-[#fea520]/40 bg-[#fea520]/8 px-5 py-3.5 hover:bg-[#fea520]/12 transition-colors"
        >
          <AlertTriangle className="w-5 h-5 text-[#fea520] shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#041627]">
              {data!.pendingApprovals}{" "}
              {data!.pendingApprovals === 1
                ? "cliente esperando aprobación de presupuesto"
                : "clientes esperando aprobación de presupuesto"}
            </p>
            <p className="text-xs text-[#44474c] mt-0.5">
              Hacé clic para ver las órdenes en espera
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-[#44474c] shrink-0" />
        </Link>
      )}

      {/* Grid principal: contenido (2/3) + sidebar accionable (1/3) */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6 items-start">

        {/* ═══ Columna izquierda: contenido principal ════════════════════ */}
        <div className="space-y-6 min-w-0">

          {/* KPIs en grilla 2x2 (xl: 4x1 si la columna es ancha) */}
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : isError || !data ? null : (
            <div className="grid grid-cols-2 gap-4">
              <KpiCard
                label="Órdenes activas"
                value={data.activeOrders}
                sub="En el taller ahora"
                icon={ClipboardList}
                accent
              />
              <KpiCard
                label="Hoy"
                value={data.ordersToday}
                sub={`Esta semana: ${data.ordersThisWeek}`}
                icon={Calendar}
              />
              <KpiCard
                label="Este mes"
                value={data.ordersThisMonth}
                sub="Órdenes ingresadas"
                icon={CalendarDays}
              />
              <KpiCard
                label="Ingresos del mes"
                value={formatCurrency(data.revenueThisMonth)}
                sub={`Hoy: ${formatCurrency(data.revenueToday)}`}
                icon={TrendingUp}
              />
            </div>
          )}

          {/* Carga del taller */}
          {isLoading ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : isError || !data ? null : (
            <WorkshopLoadCard load={data.workshopLoad} />
          )}

          {/* Fila: breakdown por estado + últimas órdenes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Estado de órdenes */}
            <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden">
              <div className="border-b border-[#c4c6cd]/60 px-5 py-4">
                <h2 className="text-sm font-semibold text-[#041627]">Órdenes por estado</h2>
              </div>
              <div className="px-5 py-4 space-y-3">
                {isLoading ? (
                  [...Array(7)].map((_, i) => <Skeleton key={i} className="h-8" />)
                ) : isError || !data ? (
                  <p className="text-sm text-[#44474c]">No se pudo cargar.</p>
                ) : (() => {
                  const total = STATUS_BREAKDOWN.reduce(
                    (sum, s) => sum + (data.ordersByStatus[s.key] ?? 0),
                    0,
                  );
                  return STATUS_BREAKDOWN.map(({ key, label, barClass, textClass }) => {
                    const count = data.ordersByStatus[key] ?? 0;
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-medium ${textClass}`}>{label}</span>
                          <span className="text-xs font-bold text-[#041627] tabular-nums">{count}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-[#c4c6cd]/30">
                          <div
                            className={`h-1.5 rounded-full transition-all ${barClass}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Órdenes recientes */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden">
              <div className="border-b border-[#c4c6cd]/60 px-5 py-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#041627]">Últimas órdenes</h2>
                <Link
                  href="/admin/work-orders"
                  className="inline-flex items-center gap-0.5 text-xs font-medium text-[#865300] hover:text-[#041627] transition-colors"
                >
                  Ver todas <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {isLoading ? (
                <div className="px-5 py-4 space-y-3">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : isError || !data ? (
                <p className="px-5 py-4 text-sm text-[#44474c]">No se pudo cargar.</p>
              ) : data.recentOrders.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-[#44474c]">Sin órdenes recientes.</p>
              ) : (
                <div className="divide-y divide-[#c4c6cd]/40">
                  {data.recentOrders.map((order) => {
                    const vehicleLabel =
                      [order.vehicleBrand, order.vehicleModel].filter(Boolean).join(" ") || "—";
                    return (
                      <Link
                        key={order.id}
                        href={`/admin/work-orders/${order.id}`}
                        className="flex items-center gap-4 px-5 py-3 hover:bg-[#eefcfd] transition-colors group"
                      >
                        <span className="text-xs font-mono font-semibold text-[#44474c]/70 shrink-0 w-16">
                          #{order.id.slice(0, 6).toUpperCase()}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#041627] truncate">{vehicleLabel}</p>
                          <p className="text-xs text-[#44474c] truncate">
                            {order.vehicleLicensePlate && (
                              <span className="font-mono mr-1.5">{order.vehicleLicensePlate}</span>
                            )}
                            {order.ownerName && <span>{order.ownerName}</span>}
                          </p>
                        </div>
                        <div className="shrink-0">
                          <StatusBadge status={Number(order.currentStatus) as WorkOrderStatus} />
                        </div>
                        <span className="text-sm font-semibold text-[#041627] tabular-nums shrink-0 w-24 text-right">
                          {formatCurrency(order.totalAmount)}
                        </span>
                        <span className="text-xs text-[#44474c]/60 shrink-0 w-20 text-right">
                          {formatDate(order.createdAt)}
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#c4c6cd] group-hover:text-[#041627] transition-colors shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Fila: rankings del mes (análisis, no urgente) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isLoading ? (
              <>
                <Skeleton className="h-48 rounded-xl" />
                <Skeleton className="h-48 rounded-xl" />
              </>
            ) : isError || !data ? null : (
              <>
                <TopMechanicsCard items={data.topMechanics} />
                <TopServicesCard items={data.topServices} />
              </>
            )}
          </div>
        </div>

        {/* ═══ Columna derecha: sidebar accionable (3 widgets urgentes) ══ */}
        <aside className="space-y-6 min-w-0 xl:sticky xl:top-4 self-start">
          <QuickActionsCard />

          {isLoading ? (
            <>
              <Skeleton className="h-64 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
            </>
          ) : isError || !data ? null : (
            <>
              <VehiclesToPickupCard items={data.vehiclesToPickup} />
              <ExpiringApprovalsCard items={data.expiringApprovals} />
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
