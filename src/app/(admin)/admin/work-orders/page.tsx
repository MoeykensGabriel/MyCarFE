"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { ClipboardList, ChevronRight, Tag, User } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { BackButton } from "@/components/shared/BackButton";
import { Pagination } from "@/components/shared/Pagination";
import { SearchInput } from "@/components/shared/SearchInput";
import { StatusBadge } from "@/components/work-orders/StatusBadge";
import { WorkOrderStatus, WorkOrderStatusConfig } from "@/lib/enums";
import { formatCurrency, formatDate } from "@/lib/format";
import { useWorkOrders } from "@/hooks/useWorkOrders";
import { WorkOrdersParams } from "@/services/work-orders.service";
import { WorkOrder } from "@/types/api.types";

const ALL_STATUSES = Object.values(WorkOrderStatus).filter(
  (v) => typeof v === "number"
) as WorkOrderStatus[];

const OWNER_TABS = [
  { label: "Todos",    value: undefined },
  { label: "Clientes", value: 1 as const },
  { label: "Flotas",   value: 2 as const },
];

export default function WorkOrdersPage() {
  const searchParams = useSearchParams();
  const urlCustomerId = searchParams.get("customerId") ?? undefined;
  const urlVehicleId  = searchParams.get("vehicleId")  ?? undefined;

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Omit<WorkOrdersParams, "page" | "pageSize">>({
    customerId: urlCustomerId,
    vehicleId:  urlVehicleId,
  });

  const { data, isLoading, isError } = useWorkOrders({ ...filters, page, pageSize: 20 });

  function applyFilter(patch: Omit<WorkOrdersParams, "page" | "pageSize">) {
    setPage(1);
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  const handleSearch = useDebouncedCallback(
    (value: string) => applyFilter({ search: value || undefined }),
    350
  );

  const backLink = urlCustomerId
    ? { href: `/admin/customers/${urlCustomerId}`, label: "Volver al cliente" }
    : urlVehicleId
    ? { href: `/admin/vehicles/${urlVehicleId}`, label: "Volver al vehículo" }
    : null;

  const items = data?.items ?? [];

  return (
    <div className="space-y-5">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {backLink && (
          <BackButton href={backLink.href} label={backLink.label} />
        )}
        <PageHeader
          title="Órdenes de trabajo"
          subtitle={data ? `${data.totalCount.toLocaleString("es-AR")} órdenes en total` : "Cargando órdenes..."}
          Icon={ClipboardList}
        />
      </div>

      {/* ── Filtros ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">

        {/* Tabs tipo propietario */}
        <div className="flex bg-white border border-[#c4c6cd] p-1 rounded-lg gap-0.5">
          {OWNER_TABS.map(({ label, value }) => (
            <button
              key={label}
              onClick={() => applyFilter({ ownerType: value })}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                filters.ownerType === value
                  ? "bg-[#041627] text-white"
                  : "text-[#44474c] hover:bg-[#eefcfd]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Select de estado */}
        <div className="relative">
          <select
            defaultValue=""
            onChange={(e) => applyFilter({ status: e.target.value === "" ? undefined : Number(e.target.value) })}
            className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-[#c4c6cd] bg-white text-[#041627] focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all cursor-pointer"
          >
            <option value="">Todos los estados</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {WorkOrderStatusConfig[s].label}
              </option>
            ))}
          </select>
          <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#44474c]/50 rotate-90 pointer-events-none" />
        </div>

        {/* Búsqueda — full width en mobile, fija en desktop */}
        <SearchInput
          placeholder="Buscar patente o nombre..."
          onChange={handleSearch}
          className="w-full sm:w-56"
        />
      </div>

      {/* ── Estados ─────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden divide-y divide-[#c4c6cd]/40">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 sm:px-6 py-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 max-w-[60%] bg-[#c4c6cd]/30 rounded animate-pulse" />
                <div className="h-3 w-24 bg-[#c4c6cd]/20 rounded animate-pulse" />
              </div>
              <div className="h-6 w-20 bg-[#c4c6cd]/20 rounded-full animate-pulse" />
              <div className="h-4 w-16 bg-[#c4c6cd]/20 rounded animate-pulse hidden sm:block" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm px-6 py-8 text-center">
          <p className="text-sm text-red-500">Error al cargar las órdenes.</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm flex flex-col items-center gap-3 px-6 py-16 text-center">
          <ClipboardList className="w-10 h-10 text-[#c4c6cd]" />
          <p className="text-sm font-semibold text-[#041627]">Sin órdenes</p>
          <p className="text-xs text-[#44474c]">No hay órdenes para los filtros seleccionados.</p>
        </div>
      ) : (
        <>
          {/* ── Tabla (desktop) ─────────────────────────────────────────────── */}
          <div className="hidden lg:block bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden">
            {/* Cabecera */}
            <div className="grid grid-cols-[1fr_1fr_150px_110px_90px_56px] gap-4 px-6 py-3 bg-[#eefcfd] border-b border-[#c4c6cd]/60">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Vehículo</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Propietario</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Estado</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70 text-right">Total</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Fecha</p>
              <p />
            </div>

            {/* Filas */}
            <div className="divide-y divide-[#c4c6cd]/40">
              {items.map((order) => (
                <div
                  key={order.id}
                  className="grid grid-cols-[1fr_1fr_150px_110px_90px_56px] gap-4 items-center px-6 py-4 border-l-4 border-l-transparent hover:bg-[#eefcfd]/60 hover:border-l-[#fea520] transition-colors"
                >
                  {/* Vehículo */}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#041627] truncate">
                      {order.vehicleBrand} {order.vehicleModel}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs font-mono text-[#44474c]">
                      <Tag className="w-3 h-3" />
                      {order.vehicleLicensePlate}
                    </span>
                  </div>

                  {/* Propietario */}
                  <div className="min-w-0 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#44474c]/50 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-[#041627] truncate">{order.ownerName ?? "—"}</p>
                      {order.fleetIdAtEntry && (
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#44474c]/60">Flota</p>
                      )}
                    </div>
                  </div>

                  {/* Estado */}
                  <div className="shrink-0">
                    <StatusBadge status={order.currentStatus} />
                  </div>

                  {/* Total */}
                  <p className="text-sm font-bold text-[#041627] tabular-nums text-right shrink-0">
                    {formatCurrency(order.totalAmount)}
                  </p>

                  {/* Fecha */}
                  <p className="text-xs text-[#44474c] whitespace-nowrap shrink-0">
                    {formatDate(order.createdAt)}
                  </p>

                  {/* Acción */}
                  <Link
                    href={`/admin/work-orders/${order.id}`}
                    className="flex items-center gap-1 text-sm font-semibold text-[#041627] hover:text-[#fea520] transition-colors shrink-0"
                  >
                    Ver
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>

            {/* Footer */}
            {data && (
              <div className="px-6 py-3 bg-[#eefcfd]/60 border-t border-[#c4c6cd]/60">
                <p className="text-xs text-[#44474c]/70">
                  Mostrando {items.length} de {data.totalCount.toLocaleString("es-AR")} órdenes
                </p>
              </div>
            )}
          </div>

          {/* ── Cards (mobile / tablet) ─────────────────────────────────────── */}
          <div className="lg:hidden space-y-3">
            {items.map((order) => (
              <WorkOrderMobileCard key={order.id} order={order} />
            ))}
            {data && (
              <p className="text-xs text-[#44474c]/70 px-1 pt-1">
                Mostrando {items.length} de {data.totalCount.toLocaleString("es-AR")} órdenes
              </p>
            )}
          </div>
        </>
      )}

      {data && (
        <Pagination
          currentPage={data.page}
          totalPages={data.totalPages}
          hasNextPage={data.hasNextPage}
          hasPreviousPage={data.hasPreviousPage}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

// ─── Card de orden para mobile / tablet ───────────────────────────────────────
// Misma información que una fila de la tabla, reorganizada para pantalla angosta:
// la tabla de 6 columnas no entra en un celular, así que abajo de lg mostramos
// cada orden como una tarjeta apilada y tocable.

function WorkOrderMobileCard({ order }: { order: WorkOrder }) {
  return (
    <Link
      href={`/admin/work-orders/${order.id}`}
      className="block bg-white rounded-xl border border-[#c4c6cd] shadow-sm p-4 border-l-4 border-l-transparent active:scale-[0.99] hover:border-l-[#fea520] hover:shadow-md transition-all"
    >
      {/* Vehículo + estado */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#041627] truncate">
            {order.vehicleBrand} {order.vehicleModel}
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-mono text-[#44474c] mt-0.5">
            <Tag className="w-3 h-3 shrink-0" />
            {order.vehicleLicensePlate}
          </span>
        </div>
        <div className="shrink-0">
          <StatusBadge status={order.currentStatus} />
        </div>
      </div>

      {/* Propietario */}
      <div className="flex items-center gap-1.5 mt-3 min-w-0">
        <User className="w-3.5 h-3.5 text-[#44474c]/50 shrink-0" />
        <p className="text-sm text-[#041627] truncate">{order.ownerName ?? "—"}</p>
        {order.fleetIdAtEntry && (
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#44474c]/60 bg-[#eefcfd] border border-[#c4c6cd]/60 px-1.5 py-0.5 rounded shrink-0">
            Flota
          </span>
        )}
      </div>

      {/* Fecha + total */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#c4c6cd]/40">
        <span className="text-xs text-[#44474c]">{formatDate(order.createdAt)}</span>
        <span className="text-sm font-bold text-[#041627] tabular-nums bg-[#041627]/5 px-2 py-0.5 rounded-lg">
          {formatCurrency(order.totalAmount)}
        </span>
      </div>
    </Link>
  );
}
