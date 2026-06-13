"use client";

import Link from "next/link";
import {
  Sparkles, ClipboardList, Car, ChevronRight, Building2,
  ShieldCheck, Gauge,
} from "lucide-react";

import { MileageReminderBanner } from "@/components/vehicle-mileage/MileageReminderBanner";
import { MaintenanceAlertList } from "@/components/customer-home/MaintenanceAlertList";
import { WorkOrderStatus } from "@/lib/enums";
import { useWorkOrders } from "@/hooks/useWorkOrders";
import { useVehicles } from "@/hooks/useVehicles";
import { useMaintenanceSummary } from "@/hooks/useMaintenanceSummary";
import { useAuthStore } from "@/store/auth.store";
import { WorkOrder } from "@/types/api.types";

function isFinished(o: WorkOrder): boolean {
  const s = Number(o.currentStatus);
  return s === WorkOrderStatus.Delivered || s === WorkOrderStatus.Cancelled;
}

/**
 * Inicio del cliente: tablero que junta en una sola pantalla lo que requiere su
 * atención (presupuestos por aprobar, kilometraje por actualizar) y da acceso a
 * Órdenes y Vehículos. Las alertas de mantenimiento agregadas (aceite, batería,
 * cubiertas de todos los autos) llegan en una segunda etapa con un endpoint de
 * resumen — hoy se muestran las que ya se derivan de datos disponibles.
 */
export default function CustomerHomePage() {
  const { customerId, fleetId } = useAuthStore();
  const isFleet = !!fleetId;

  const ownerParams = {
    fleetId:    fleetId  ?? undefined,
    customerId: !fleetId ? (customerId ?? undefined) : undefined,
  };

  const { data: ordersData, isLoading: ordersLoading } = useWorkOrders({ pageSize: 50, ...ownerParams });
  const { data: vehiclesData, isLoading: vehiclesLoading } = useVehicles({ pageSize: 100, ...ownerParams });
  const { data: alertsData, isLoading: alertsLoading } = useMaintenanceSummary();

  const orders   = ordersData?.items ?? [];
  const vehicles = vehiclesData?.items ?? [];
  const alerts   = alertsData ?? [];

  const activeOrders   = orders.filter((o) => !isFinished(o));
  const pendingApproval = orders.filter(
    (o) => Number(o.currentStatus) === WorkOrderStatus.AwaitingApproval,
  );
  const vehiclesDue   = vehicles.filter((v) => v.mileageUpdateDue);
  const vehicleCount  = vehiclesData?.totalCount ?? vehicles.length;

  const isLoading  = ordersLoading || vehiclesLoading || alertsLoading;
  const allClear   = !isLoading && pendingApproval.length === 0 && vehiclesDue.length === 0 && alerts.length === 0;

  return (
    <div className="space-y-4 pb-4">

      {/* ── Encabezado ──────────────────────────────────────────────────────── */}
      <div className="bg-[#041627] text-white rounded-2xl p-5 shadow-md shadow-[#041627]/10 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#fea520]" />
            <h1 className="text-lg font-extrabold tracking-wide">Inicio</h1>
          </div>
          <p className="text-xs text-white/60 mt-1 leading-snug max-w-[280px]">
            Todo lo que necesitás saber de tus vehículos, en un solo lugar.
          </p>
        </div>
      </div>

      {/* ── Skeleton ────────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-3">
          <div className="h-16 bg-white rounded-2xl border border-[#041627]/10 animate-pulse" />
          <div className="h-16 bg-white rounded-2xl border border-[#041627]/10 animate-pulse" />
        </div>
      )}

      {/* ── Requiere tu atención ────────────────────────────────────────────── */}
      {!isLoading && (
        <section className="space-y-3">

          {/* Presupuestos por aprobar — la alerta de mayor prioridad */}
          {pendingApproval.length > 0 && (
            <Link
              href="/my-orders"
              className="flex items-center gap-3 bg-gradient-to-r from-[#fea520] to-[#fec15d] text-[#041627] rounded-2xl p-4 shadow-md shadow-[#fea520]/20 active:scale-[0.98] transition-transform"
            >
              <div className="w-10 h-10 rounded-xl bg-white/25 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-wider">
                  {pendingApproval.length === 1
                    ? "1 presupuesto espera tu aprobación"
                    : `${pendingApproval.length} presupuestos esperan tu aprobación`}
                </p>
                <p className="text-[11px] font-semibold opacity-80 mt-0.5">
                  Revisá el detalle y aprobá los trabajos.
                </p>
              </div>
              <ChevronRight className="w-5 h-5 shrink-0" />
            </Link>
          )}

          {/* Alertas de mantenimiento de los vehículos (cubiertas) */}
          <MaintenanceAlertList alerts={alerts} />

          {/* Kilometraje por actualizar (reutiliza el banner de Mis Vehículos) */}
          {vehiclesDue.length > 0 && (
            <Link href="/my-vehicles" className="block active:scale-[0.99] transition-transform">
              <MileageReminderBanner dueCount={vehiclesDue.length} />
            </Link>
          )}

          {/* Todo al día */}
          {allClear && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 border border-emerald-200">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-emerald-800">Todo al día</p>
                <p className="text-[11px] font-semibold text-emerald-700/80 mt-0.5 leading-snug">
                  No hay nada urgente. Te avisamos acá apenas algo necesite tu atención.
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Accesos ─────────────────────────────────────────────────────────── */}
      {!isLoading && (
        <section className="grid grid-cols-2 gap-3">
          <Link
            href="/my-orders"
            className="bg-white rounded-2xl border border-[#041627]/10 shadow-sm p-4 active:scale-[0.97] hover:border-[#fea520]/40 transition-all"
          >
            <ClipboardList className="w-5 h-5 text-[#fea520]" />
            <p className="text-2xl font-black text-[#041627] mt-2 leading-none">{activeOrders.length}</p>
            <p className="text-[11px] font-bold text-[#44474c]/70 mt-1">
              {activeOrders.length === 1 ? "Orden activa" : "Órdenes activas"}
            </p>
          </Link>
          <Link
            href="/my-vehicles"
            className="bg-white rounded-2xl border border-[#041627]/10 shadow-sm p-4 active:scale-[0.97] hover:border-[#fea520]/40 transition-all"
          >
            <Car className="w-5 h-5 text-[#fea520]" />
            <p className="text-2xl font-black text-[#041627] mt-2 leading-none">{vehicleCount}</p>
            <p className="text-[11px] font-bold text-[#44474c]/70 mt-1">
              {vehicleCount === 1 ? "Vehículo" : "Vehículos"}
            </p>
          </Link>
        </section>
      )}

      {/* ── Acceso a Mi empresa (solo flotas) ───────────────────────────────── */}
      {!isLoading && isFleet && (
        <Link
          href="/my-fleet"
          className="flex items-center justify-between bg-white rounded-2xl border border-[#041627]/10 shadow-sm p-4 active:scale-[0.98] hover:border-[#fea520]/40 transition-all"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#eefcfd] border border-[#041627]/5 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-[#041627]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-[#041627]">Mi empresa</p>
              <p className="text-[11px] font-semibold text-[#44474c]/70 mt-0.5">Datos de la flota y contactos</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#c4c6cd] shrink-0" />
        </Link>
      )}

      {/* ── Nota de lo que viene (placeholder honesto del tablero) ──────────── */}
      {!isLoading && (
        <p className="flex items-center gap-1.5 text-[10px] text-[#44474c]/50 leading-relaxed px-1 pt-1">
          <Gauge className="w-3 h-3 shrink-0" />
          Próximamente: avisos de aceite y batería de todos tus vehículos, acá mismo.
        </p>
      )}
    </div>
  );
}
