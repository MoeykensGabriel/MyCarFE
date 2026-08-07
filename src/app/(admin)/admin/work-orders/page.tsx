"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { AlertTriangle, ChevronRight, ClipboardList, Plus } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { BackButton } from "@/components/shared/BackButton";
import { Pagination } from "@/components/shared/Pagination";
import { SearchInput } from "@/components/shared/SearchInput";
import { StatusBadge } from "@/components/work-orders/StatusBadge";
import { WorkOrderStatus, WorkOrderStatusConfig } from "@/lib/enums";
import { formatDate, formatOrderNumber } from "@/lib/format";
import { InspectionOnlyBadge } from "@/components/work-orders/InspectionOnlyBadge";
import { useWorkOrders } from "@/hooks/useWorkOrders";
import { WorkOrdersParams } from "@/services/work-orders.service";
import { WorkOrder } from "@/types/api.types";
import { cn } from "@/lib/utils";

const ALL_STATUSES = Object.values(WorkOrderStatus).filter(
  (v) => typeof v === "number"
) as WorkOrderStatus[];

// "Aprobadas en adelante": presupuestos que pasaron la aprobación (para liquidar comisiones).
const APPROVED_ONWARD: WorkOrderStatus[] = [
  WorkOrderStatus.Approved,
  WorkOrderStatus.InProgress,
  WorkOrderStatus.Completed,
  WorkOrderStatus.Delivered,
];

// Valor sentinel del select para el grupo "aprobadas en adelante".
const APPROVED_ONWARD_VALUE = "approved-onward";

const OWNER_TABS = [
  { label: "Todos",    value: undefined },
  { label: "Clientes", value: 1 as const },
  { label: "Flotas",   value: 2 as const },
];

// Grilla de la tabla: N° Orden | Vehículo | Propietario | Estado | Fecha.
// Una sola constante para cabecera y filas — si se desalinean, la tabla se ve rota.
const COLS = "grid-cols-[92px_minmax(0,1.2fr)_minmax(0,1fr)_150px_100px]";

export default function WorkOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCustomerId = searchParams.get("customerId") ?? undefined;
  const urlVehicleId  = searchParams.get("vehicleId")  ?? undefined;

  const [page, setPage] = useState(1);
  // Fila marcada. Es solo visual: el click marca, el doble click abre.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Omit<WorkOrdersParams, "page" | "pageSize">>({
    customerId: urlCustomerId,
    vehicleId:  urlVehicleId,
  });

  // isLoading es la PRIMERA carga (no hay nada que mostrar). isFetching es cualquier
  // refresco, incluido el de cambiar un filtro: ahí ya hay filas viejas en pantalla y solo
  // las atenuamos, en vez de sacarlas y volver a meterlas.
  const { data, isLoading, isFetching, isError } = useWorkOrders({ ...filters, page, pageSize: 20 });

  function applyFilter(patch: Omit<WorkOrdersParams, "page" | "pageSize">) {
    setPage(1);
    setSelectedId(null);
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  const handleSearch = useDebouncedCallback(
    (value: string) => applyFilter({ search: value || undefined }),
    350
  );

  function openOrder(id: string) {
    router.push(`/admin/work-orders/${id}`);
  }

  const backLink = urlCustomerId
    ? { href: `/admin/customers/${urlCustomerId}`, label: "Volver al cliente" }
    : urlVehicleId
    ? { href: `/admin/vehicles/${urlVehicleId}`, label: "Volver al vehículo" }
    : null;

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">

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
      <div className="flex flex-wrap items-center gap-2">

        {/* Acción principal de la pantalla: dar entrada a un vehículo. */}
        <Link
          href="/admin/intake"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#041627] text-white text-sm font-bold hover:bg-[#0a2540] transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nueva orden
        </Link>

        <SearchInput
          placeholder="Buscar N° de orden, patente o nombre..."
          onChange={handleSearch}
          className="w-full sm:w-64"
        />

        {/* Select de estado */}
        <div className="relative">
          <select
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") applyFilter({ status: undefined, statuses: undefined });
              else if (v === APPROVED_ONWARD_VALUE) applyFilter({ status: undefined, statuses: APPROVED_ONWARD });
              else applyFilter({ status: Number(v), statuses: undefined });
            }}
            className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-[#c4c6cd] bg-white text-[#041627] focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all cursor-pointer"
          >
            <option value="">Filtrar por estados</option>
            <option value={APPROVED_ONWARD_VALUE}>Aprobadas (en adelante)</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {WorkOrderStatusConfig[s].label}
              </option>
            ))}
          </select>
          <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#44474c]/50 rotate-90 pointer-events-none" />
        </div>

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

        {/* Rango de fechas — siempre visible. Antes aparecía solo con ciertos estados y
            había que adivinar que existía; es el filtro que más se usa para cerrar un
            período (liquidación de comisiones, cierre de mes).

            En mobile ocupa su propia fila completa y los inputs se reparten el ancho:
            un input date no se achica solo, así que en línea con el resto se salía de la
            pantalla. El ml-auto que lo manda a la derecha recién aplica en desktop. */}
        <div className="flex items-center gap-2 w-full lg:w-auto lg:ml-auto">
          <div className="flex items-center gap-1.5 flex-1 lg:flex-none min-w-0">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70 whitespace-nowrap">Desde</label>
            <input
              type="date"
              value={filters.from ?? ""}
              onChange={(e) => applyFilter({ from: e.target.value || undefined })}
              className="w-full lg:w-auto min-w-0 px-2 py-1.5 text-sm rounded-lg border border-[#c4c6cd] bg-white text-[#041627] focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-1 lg:flex-none min-w-0">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70 whitespace-nowrap">Hasta</label>
            <input
              type="date"
              value={filters.to ?? ""}
              onChange={(e) => applyFilter({ to: e.target.value || undefined })}
              className="w-full lg:w-auto min-w-0 px-2 py-1.5 text-sm rounded-lg border border-[#c4c6cd] bg-white text-[#041627] focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all cursor-pointer"
            />
          </div>
          {/* Siempre montado, invisible cuando no hay fechas: si apareciera y desapareciera,
              la barra de filtros se reacomodaría sola y movería la tabla de abajo. */}
          <button
            type="button"
            onClick={() => applyFilter({ from: undefined, to: undefined })}
            aria-hidden={!filters.from && !filters.to}
            tabIndex={!filters.from && !filters.to ? -1 : 0}
            className={cn(
              "text-xs text-[#44474c]/70 hover:text-red-500 font-medium underline underline-offset-2 shrink-0",
              !filters.from && !filters.to && "invisible pointer-events-none",
            )}
          >
            Limpiar
          </button>
        </div>
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
        // Mientras llegan los resultados del filtro nuevo, las filas viejas siguen ahí y
        // solo se atenúan. Es el aviso de "estoy actualizando" sin mover nada de lugar.
        <div className={cn("transition-opacity duration-200", isFetching && "opacity-50")}>
          {/* ── Tabla (desktop) ─────────────────────────────────────────────── */}
          <div className="hidden lg:block bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden">
            {/* Cabecera */}
            <div className={cn("grid gap-4 px-6 py-3 bg-[#eefcfd] border-b border-[#c4c6cd]/60", COLS)}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">N° Orden</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Vehículo</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Propietario</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Estado</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Fecha</p>
            </div>

            {/* Filas */}
            <div className="divide-y divide-[#c4c6cd]/40">
              {items.map((order) => (
                <WorkOrderRow
                  key={order.id}
                  order={order}
                  selected={selectedId === order.id}
                  onSelect={() => setSelectedId(order.id)}
                  onOpen={() => openOrder(order.id)}
                />
              ))}
            </div>

            {/* Footer */}
            {data && (
              <div className="px-6 py-3 bg-[#eefcfd]/60 border-t border-[#c4c6cd]/60 flex items-center justify-between gap-4">
                <p className="text-xs text-[#44474c]/70">
                  Mostrando {items.length} de {data.totalCount.toLocaleString("es-AR")} órdenes
                </p>
                {/* La fila no tiene botón: sin esta pista, abrir una orden es adivinanza. */}
                <p className="text-xs text-[#44474c]/70">
                  Doble click en una fila para abrir la orden
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
        </div>
      )}

      {data && (
        <Pagination
          currentPage={data.page}
          totalPages={data.totalPages}
          hasNextPage={data.hasNextPage}
          hasPreviousPage={data.hasPreviousPage}
          // La marca se limpia al cambiar de página: si no, queda una fila "seleccionada"
          // que ya no está en pantalla.
          onPageChange={(p) => { setSelectedId(null); setPage(p); }}
        />
      )}
    </div>
  );
}

// ─── Fila de la tabla ─────────────────────────────────────────────────────────

/**
 * Una orden en la tabla. Click marca la fila, doble click abre la orden.
 *
 * `select-none` no es cosmético: sin eso, el doble click selecciona el texto de la celda y
 * la fila queda resaltada a medias mientras navega.
 *
 * Además es focusable y responde a Enter — quien viene del teclado no tiene doble click.
 */
function WorkOrderRow({
  order,
  selected,
  onSelect,
  onOpen,
}: {
  order: WorkOrder;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onDoubleClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter") { e.preventDefault(); onOpen(); }
      }}
      title="Doble click para abrir la orden"
      className={cn(
        "grid gap-4 items-center px-6 py-3.5 border-l-4 cursor-pointer select-none transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#041627]/30",
        COLS,
        selected
          ? "bg-[#eefcfd] border-l-[#fea520]"
          : "border-l-transparent hover:bg-[#eefcfd]/60 hover:border-l-[#c4c6cd]",
      )}
    >
      {/* N° Orden */}
      <span className="text-sm font-mono font-bold text-[#041627]">
        {formatOrderNumber(order)}
      </span>

      {/* Vehículo: patente arriba (es lo que el taller canta), modelo abajo */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-mono font-bold uppercase tracking-wide text-[#041627] truncate">
            {order.vehicleLicensePlate}
          </span>
          {order.isInspectionOnly && <InspectionOnlyBadge compact />}
          {order.hasLateFindings && <LateFindingBadge />}
        </div>
        <p className="text-xs text-[#44474c] truncate">
          {order.vehicleBrand} {order.vehicleModel}
        </p>
      </div>

      {/* Propietario */}
      <div className="min-w-0 flex items-center gap-1.5">
        <p className="text-sm text-[#041627] truncate">{order.ownerName ?? "—"}</p>
        {order.fleetIdAtEntry && <FleetTag />}
      </div>

      {/* Estado */}
      <div className="shrink-0">
        <StatusBadge status={order.currentStatus} />
      </div>

      {/* Fecha */}
      <p className="text-xs text-[#44474c] whitespace-nowrap shrink-0">
        {formatDate(order.createdAt)}
      </p>
    </div>
  );
}

/** Marca de flota al lado del nombre — el trato comercial cambia según sea flota o particular. */
function FleetTag() {
  return (
    <span className="text-[9px] font-bold uppercase tracking-wider text-[#15803d] bg-[#15803d]/10 border border-[#15803d]/30 px-1.5 py-0.5 rounded shrink-0">
      Flota
    </span>
  );
}

/**
 * Aviso de que llegó un hallazgo con la inspección ya cerrada.
 *
 * Va en el LISTADO y no solo en la ficha porque el problema es justamente que la oficina
 * no se entera: el área desaparece de "sin inspeccionar" y el hallazgo aparece en otra card,
 * en silencio. Si la orden ya está aprobada, ese hallazgo puede necesitar que el cliente
 * autorice un adicional.
 */
function LateFindingBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-100 border border-amber-300 text-amber-800 shrink-0"
      title="Se inspeccionó un área que había quedado postergada y apareció un hallazgo"
    >
      <AlertTriangle className="w-3 h-3" />
      Novedad
    </span>
  );
}

// ─── Card de orden para mobile / tablet ───────────────────────────────────────
// Misma información que una fila de la tabla, reorganizada para pantalla angosta.
// Acá NO hay doble click: en un celular se abre con un toque.

/**
 * Una orden en pantalla angosta.
 *
 * Un dato por renglón, en vez de apretar todo en la primera línea. En un celular no entran
 * número + patente + badges + estado en el mismo renglón: lo que se achicaba era la PATENTE
 * ("AI4…"), que es justo con lo que el taller identifica el auto. Cada cosa tiene su lugar:
 *
 *   #1002                              [Completado]
 *   AI466XD
 *   Fiat Cronos 1.3
 *   [SOLO INSPECCIÓN] [NOVEDAD]
 *   ───────────────────────────────────────────────
 *   Moeykens SRL [FLOTA]                 04/08/2026
 *
 * Los badges van en su propio renglón y sólo si existen: son la excepción, no la regla, y
 * no pueden condicionar el ancho de lo que se muestra siempre.
 */
function WorkOrderMobileCard({ order }: { order: WorkOrder }) {
  const hasBadges = order.isInspectionOnly || order.hasLateFindings;

  return (
    <Link
      href={`/admin/work-orders/${order.id}`}
      className="block bg-white rounded-xl border border-[#c4c6cd] shadow-sm p-4 border-l-4 border-l-transparent active:scale-[0.99] hover:border-l-[#fea520] hover:shadow-md transition-all"
    >
      {/* Número + estado */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-mono font-bold text-[#44474c]/70">
          {formatOrderNumber(order)}
        </span>
        <StatusBadge status={order.currentStatus} />
      </div>

      {/* Patente: sola en su renglón, nunca recortada — es el identificador del auto */}
      <p className="text-lg font-mono font-bold uppercase tracking-wide text-[#041627] leading-tight mt-1.5">
        {order.vehicleLicensePlate}
      </p>

      {/* Marca y modelo: acá sí truncamos, un modelo largo no cambia de qué auto hablamos */}
      <p className="text-xs text-[#44474c] truncate">
        {order.vehicleBrand} {order.vehicleModel}
      </p>

      {hasBadges && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {order.isInspectionOnly && <InspectionOnlyBadge compact />}
          {order.hasLateFindings && <LateFindingBadge />}
        </div>
      )}

      {/* Propietario + fecha */}
      <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-[#c4c6cd]/40">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-sm text-[#041627] truncate">{order.ownerName ?? "—"}</p>
          {order.fleetIdAtEntry && <FleetTag />}
        </div>
        <span className="text-xs text-[#44474c] shrink-0">{formatDate(order.createdAt)}</span>
      </div>
    </Link>
  );
}
