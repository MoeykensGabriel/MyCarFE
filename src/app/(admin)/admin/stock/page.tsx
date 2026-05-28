"use client";

import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import {
  Package,
  ChevronRight,
  ChevronDown,
  Tag,
  Hash,
  ExternalLink,
  Clock,
  Truck,
  AlertTriangle,
  CheckCircle2,
  PackageCheck,
  RefreshCw,
  Pencil,
  Info,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { StockRequestStatusBadge } from "@/components/stock/StockRequestStatusBadge";
import { StockItemStatusBadge } from "@/components/stock/StockItemStatusBadge";
import {
  StockRequestItemStatus,
  StockRequestItemStatusLabel,
  StockRequestStatus,
  StockRequestStatusLabel,
} from "@/lib/enums";
import { formatDate, formatDateTime } from "@/lib/format";
import { useRetryStockSubmission, useStockRequests, useUpdateStockItem } from "@/hooks/useStock";
import type { StockRequest, StockRequestItem } from "@/types/stock.types";

// ─── Constantes ───────────────────────────────────────────────────────────────

const ALL_STATUSES = [
  StockRequestStatus.PendingReview,
  StockRequestStatus.HasShortages,
  StockRequestStatus.InProgress,
  StockRequestStatus.Ready,
];

const ALL_ITEM_STATUSES = [
  StockRequestItemStatus.PendingReview,
  StockRequestItemStatus.Available,
  StockRequestItemStatus.Missing,
  StockRequestItemStatus.InTransit,
  StockRequestItemStatus.Delivered,
];

/** Ícono, hint y color de borde por estado de pedido */
const REQUEST_STATUS_META: Record<
  StockRequestStatus,
  { Icon: React.ElementType; hint: string; border: string }
> = {
  [StockRequestStatus.PendingReview]: {
    Icon:   Clock,
    hint:   "Esperando respuesta del depósito",
    border: "border-l-gray-300",
  },
  [StockRequestStatus.HasShortages]: {
    Icon:   AlertTriangle,
    hint:   "Hay repuestos que faltan — el depósito los está consiguiendo",
    border: "border-l-red-400",
  },
  [StockRequestStatus.InProgress]: {
    Icon:   Truck,
    hint:   "Todo comprado — en camino al taller",
    border: "border-l-blue-400",
  },
  [StockRequestStatus.Ready]: {
    Icon:   CheckCircle2,
    hint:   "Todos los repuestos fueron entregados",
    border: "border-l-green-400",
  },
};

/** Ícono y color por estado de ítem individual */
const ITEM_STATUS_ICON: Record<StockRequestItemStatus, React.ElementType> = {
  [StockRequestItemStatus.PendingReview]: Clock,
  [StockRequestItemStatus.Available]:     CheckCircle2,
  [StockRequestItemStatus.Missing]:       AlertTriangle,
  [StockRequestItemStatus.InTransit]:     Truck,
  [StockRequestItemStatus.Delivered]:     PackageCheck,
};

const ITEM_ICON_COLOR: Record<StockRequestItemStatus, string> = {
  [StockRequestItemStatus.PendingReview]: "text-gray-400",
  [StockRequestItemStatus.Available]:     "text-indigo-500",
  [StockRequestItemStatus.Missing]:       "text-red-500",
  [StockRequestItemStatus.InTransit]:     "text-yellow-500",
  [StockRequestItemStatus.Delivered]:     "text-green-500",
};

const ITEM_BORDER_COLOR: Record<StockRequestItemStatus, string> = {
  [StockRequestItemStatus.PendingReview]: "border-l-gray-300",
  [StockRequestItemStatus.Available]:     "border-l-indigo-400",
  [StockRequestItemStatus.Missing]:       "border-l-red-400",
  [StockRequestItemStatus.InTransit]:     "border-l-yellow-400",
  [StockRequestItemStatus.Delivered]:     "border-l-green-400",
};

// ─── Página ───────────────────────────────────────────────────────────────────

export default function StockPage() {
  const [filters, setFilters] = useState<{ status?: StockRequestStatus; licensePlate?: string }>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { data, isLoading, isError, dataUpdatedAt } = useStockRequests(filters);
  const items = data ?? [];

  // Stats globales para los chips (sólo filtramos por patente, no por estado)
  const { data: allData } = useStockRequests({ licensePlate: filters.licensePlate });
  const allItems = allData ?? [];

  const handleSearch = useDebouncedCallback((value: string) => {
    setFilters((prev) => ({ ...prev, licensePlate: value || undefined }));
  }, 350);

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const lastUpdate = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("es-AR", {
        hour:   "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  return (
    <div className="space-y-5">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <PageHeader
        title="Pedidos al depósito"
        subtitle={
          data
            ? `${items.length.toLocaleString("es-AR")} ${items.length === 1 ? "pedido" : "pedidos"} encontrados`
            : "Cargando pedidos..."
        }
        Icon={Package}
      />

      {/* ── Chips de estado global ───────────────────────────────────────────── */}
      {allItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {ALL_STATUSES.map((s) => {
            const count = allItems.filter((r) => r.status === s).length;
            if (count === 0) return null;
            const { Icon } = REQUEST_STATUS_META[s];
            const isActive = filters.status === s;
            return (
              <button
                key={s}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    status: isActive ? undefined : s,
                  }))
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  isActive
                    ? "bg-[#041627] text-white border-[#041627]"
                    : "bg-white text-[#44474c] border-[#c4c6cd] hover:border-[#041627]/50 hover:text-[#041627]"
                }`}
              >
                <Icon className="w-3 h-3" />
                {StockRequestStatusLabel[s]}
                <span className={`font-bold ${isActive ? "opacity-70" : "text-[#041627]"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Banner de contexto ───────────────────────────────────────────────── */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-600" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-blue-800">¿Cómo funciona este panel?</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cuando se aprueba un presupuesto, <strong>GestionPGB</strong> recibe el pedido
              automáticamente y responde con la disponibilidad de cada repuesto.
              La pantalla se actualiza sola cada 30 segundos.
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Si el depósito te avisa por teléfono o WhatsApp antes de que el sistema se
              actualice, podés cambiar el estado manualmente desde cada ítem.
            </p>
          </div>
        </div>
      </div>

      {/* ── Filtros + timestamp ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">

        <div className="flex flex-wrap items-center gap-3">
          {/* Select de estado */}
          <div className="relative">
            <select
              value={filters.status ?? ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  status: e.target.value === "" ? undefined : (Number(e.target.value) as StockRequestStatus),
                }))
              }
              className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-[#c4c6cd] bg-white text-[#041627] focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all cursor-pointer"
            >
              <option value="">Todos los estados</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {StockRequestStatusLabel[s]}
                </option>
              ))}
            </select>
            <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#44474c]/50 rotate-90 pointer-events-none" />
          </div>

          {/* Búsqueda por patente */}
          <SearchInput
            placeholder="Buscar por patente..."
            onChange={handleSearch}
            className="w-56"
          />
        </div>

        {/* Indicador de actualización automática */}
        {lastUpdate && (
          <div className="flex items-center gap-1.5 text-xs text-[#44474c]/60">
            <RefreshCw className="w-3 h-3" />
            Actualizado a las {lastUpdate} · refresca cada 30 s
          </div>
        )}
      </div>

      {/* ── Lista de pedidos ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-[#c4c6cd]/40">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-[#c4c6cd]/30 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-[#c4c6cd]/20 rounded animate-pulse" />
                </div>
                <div className="h-6 w-32 bg-[#c4c6cd]/20 rounded-full animate-pulse" />
                <div className="h-4 w-16 bg-[#c4c6cd]/20 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            <p className="text-sm font-semibold text-red-600">Error al cargar los pedidos</p>
            <p className="text-xs text-[#44474c]">Revisá la conexión con el servidor e intentá de nuevo.</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <Package className="w-10 h-10 text-[#c4c6cd]" />
            <p className="text-sm font-semibold text-[#041627]">
              {filters.status !== undefined || filters.licensePlate
                ? "Sin resultados para el filtro aplicado"
                : "No hay pedidos al depósito todavía"}
            </p>
            <p className="text-xs text-[#44474c]">
              {filters.status !== undefined || filters.licensePlate
                ? "Probá cambiando el estado o borrando la búsqueda."
                : "Cuando se apruebe un presupuesto con repuestos del catálogo, el pedido aparece acá."}
            </p>
          </div>
        ) : (
          <>
            {/* Cabecera */}
            <div className="grid grid-cols-[40px_1fr_1fr_210px_90px] gap-4 px-6 py-3 bg-[#eefcfd] border-b border-[#c4c6cd]/60">
              <p />
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Vehículo</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Resumen de repuestos</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Estado del pedido</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Fecha</p>
            </div>

            {/* Filas */}
            <div className="divide-y divide-[#c4c6cd]/40">
              {items.map((request) => (
                <StockRequestRow
                  key={request.id}
                  request={request}
                  expanded={expanded.has(request.id)}
                  onToggle={() => toggleExpanded(request.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Fila del listado ─────────────────────────────────────────────────────────

interface StockRequestRowProps {
  request:  StockRequest;
  expanded: boolean;
  onToggle: () => void;
}

function StockRequestRow({ request, expanded, onToggle }: StockRequestRowProps) {
  const vehicleLabel =
    [request.vehicleBrand, request.vehicleModel].filter(Boolean).join(" ") || "Vehículo sin datos";

  const { mutate: retry, isPending: isRetrying } = useRetryStockSubmission();

  const { Icon: StatusIcon, hint, border } = REQUEST_STATUS_META[request.status];

  // Mini resumen de ítems agrupados por estado
  const itemSummary = ALL_ITEM_STATUSES.map((s) => ({
    status: s,
    count:  request.items.filter((i) => i.status === s).length,
  })).filter((x) => x.count > 0);

  return (
    <div>
      {/* Fila principal */}
      <button
        onClick={onToggle}
        className={`w-full grid grid-cols-[40px_1fr_1fr_210px_90px] gap-4 items-center px-6 py-4 border-l-4 ${border} hover:bg-[#eefcfd]/50 transition-colors text-left`}
      >
        {/* Chevron */}
        <div className="flex justify-center text-[#44474c]/50">
          {expanded
            ? <ChevronDown className="w-4 h-4" />
            : <ChevronRight className="w-4 h-4" />}
        </div>

        {/* Vehículo + patente */}
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-semibold text-[#041627] truncate">{vehicleLabel}</p>
          <span className="inline-flex items-center gap-1 text-xs font-mono text-[#44474c]">
            <Tag className="w-3 h-3" />
            {request.licensePlate}
          </span>
          {request.externalReference && (
            <p className="flex items-center gap-1 text-[10px] font-mono text-[#44474c]/50">
              <Hash className="w-2.5 h-2.5" />
              Ref. depósito: {request.externalReference.substring(0, 8)}…
            </p>
          )}
        </div>

        {/* Resumen de ítems con íconos */}
        <div className="flex flex-wrap gap-2 items-center">
          {itemSummary.length === 0 ? (
            <span className="text-xs text-[#44474c]/50">Sin ítems</span>
          ) : (
            itemSummary.map(({ status, count }) => {
              const ItemIcon  = ITEM_STATUS_ICON[status];
              const iconColor = ITEM_ICON_COLOR[status];
              return (
                <span
                  key={status}
                  className="inline-flex items-center gap-1 text-xs text-[#44474c]"
                  title={StockRequestItemStatusLabel[status]}
                >
                  <ItemIcon className={`w-3.5 h-3.5 ${iconColor}`} />
                  <span className="font-semibold tabular-nums">{count}</span>
                </span>
              );
            })
          )}
          <span className="text-[10px] text-[#44474c]/40">
            ({request.items.length} {request.items.length === 1 ? "repuesto" : "repuestos"})
          </span>
        </div>

        {/* Estado del pedido + hint */}
        <div className="shrink-0 space-y-1">
          <div className="flex items-center gap-1.5">
            <StatusIcon className="w-3.5 h-3.5 text-[#44474c]/50 shrink-0" />
            <StockRequestStatusBadge status={request.status} />
          </div>
          <p className="text-[10px] text-[#44474c]/60 leading-tight pl-5">{hint}</p>
        </div>

        {/* Fecha */}
        <p className="text-xs text-[#44474c] whitespace-nowrap shrink-0">
          {formatDate(request.createdAt)}
        </p>
      </button>

      {/* Panel expandido */}
      {expanded && (
        <div className="bg-[#f8feff] border-t border-[#c4c6cd]/40 px-6 py-5 space-y-4">

          {/* Encabezado del panel */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#041627]">
                {request.items.length} repuesto{request.items.length !== 1 && "s"} en este pedido
              </p>
              <p className="text-xs text-[#44474c]/70 mt-0.5">
                {request.externalReference
                  ? "GestionPGB confirmó la disponibilidad de cada ítem. Si el depósito te avisó por teléfono o WhatsApp, podés actualizar el estado manualmente."
                  : "Este pedido no llegó a GestionPGB — el depósito no estaba disponible al momento de la aprobación. Levantá GestionPGB y reintentá el envío."}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Botón de reintento — sólo aparece si el pedido nunca llegó a GestionPGB */}
              {!request.externalReference && (
                <button
                  onClick={() => retry(request.id)}
                  disabled={isRetrying}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
                  {isRetrying ? "Enviando…" : "Reintentar envío a GestionPGB"}
                </button>
              )}
              <Link
                href={`/admin/work-orders/${request.workOrderId}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#041627] hover:text-[#fea520] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Ver orden de trabajo
              </Link>
            </div>
          </div>

          {/* Lista de ítems */}
          <div className="space-y-2">
            {request.items.map((item) => (
              <StockItemRow key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Ítem individual ──────────────────────────────────────────────────────────

function StockItemRow({ item }: { item: StockRequestItem }) {
  const { mutate: updateStatus, isPending } = useUpdateStockItem();

  const ItemIcon  = ITEM_STATUS_ICON[item.status];
  const iconColor = ITEM_ICON_COLOR[item.status];
  const border    = ITEM_BORDER_COLOR[item.status];

  return (
    <div className={`bg-white rounded-lg border border-[#c4c6cd]/60 border-l-4 ${border} overflow-hidden`}>
      <div className="px-4 py-3 flex items-center gap-4">

        {/* Ícono de estado */}
        <ItemIcon className={`w-5 h-5 shrink-0 ${iconColor}`} />

        {/* Info del repuesto */}
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-sm font-semibold text-[#041627] truncate">{item.name}</p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#44474c]/70">
              <Hash className="w-2.5 h-2.5" />
              {item.productCode}
            </span>
            <span className="text-[11px] text-[#44474c]">
              Cantidad: <span className="font-semibold">{item.quantity}</span>
            </span>
            <span className="text-[11px] text-[#44474c]/50">
              Actualizado {formatDateTime(item.updatedAt)}
            </span>
          </div>
          {item.notes && (
            <p className="text-[11px] text-[#44474c] italic">
              Nota del depósito: {item.notes}
            </p>
          )}
        </div>

        {/* Badge de estado actual */}
        <div className="shrink-0">
          <StockItemStatusBadge status={item.status} />
        </div>

        {/* Override manual */}
        <div className="shrink-0 flex items-center gap-1.5">
          <Pencil className="w-3 h-3 text-[#44474c]/40" aria-label="Actualizar manualmente" />
          <div className="relative">
            <select
              value={item.status}
              disabled={isPending}
              onChange={(e) =>
                updateStatus({
                  itemId:  item.id,
                  payload: { status: Number(e.target.value) as StockRequestItemStatus },
                })
              }
              title="Cambiar el estado manualmente si el depósito te avisó por otro canal"
              className="appearance-none pl-2.5 pr-6 py-1 text-[11px] rounded-md border border-[#c4c6cd] bg-white text-[#44474c] focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {ALL_ITEM_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {StockRequestItemStatusLabel[s]}
                </option>
              ))}
            </select>
            <ChevronRight className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#44474c]/50 rotate-90 pointer-events-none" />
          </div>
        </div>

      </div>
    </div>
  );
}
