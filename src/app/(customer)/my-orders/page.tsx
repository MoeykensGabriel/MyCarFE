"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { ClipboardList, Sparkles, History, Wrench } from "lucide-react";

import { BackButton } from "@/components/shared/BackButton";
import { Pagination } from "@/components/shared/Pagination";
import { SearchInput } from "@/components/shared/SearchInput";
import { OrderCard, OrderCardSkeleton } from "@/components/customer-orders/OrderCard";
import { HistoryOrderRow } from "@/components/customer-orders/HistoryOrderRow";
import { WorkOrderStatus } from "@/lib/enums";
import { useWorkOrders } from "@/hooks/useWorkOrders";
import { useAuthStore } from "@/store/auth.store";
import { WorkOrder } from "@/types/api.types";

type Tab = "active" | "approval" | "history";

function isFinished(o: WorkOrder): boolean {
  const s = Number(o.currentStatus);
  return s === WorkOrderStatus.Delivered || s === WorkOrderStatus.Cancelled;
}

/**
 * Listado de órdenes del cliente / dueño de flota. Para que no haya que
 * scrollear entre todo mezclado: tabs (en curso / por aprobar / historial),
 * búsqueda por patente contra el server, grid de 2 columnas en pantallas
 * anchas e historial en filas compactas. Paginado si hay más de 50.
 */
export default function MyOrdersPage() {
  const searchParams            = useSearchParams();
  const vehicleId               = searchParams.get("vehicleId") ?? undefined;
  const { customerId, fleetId } = useAuthStore();

  const [tab,    setTab]    = useState<Tab>("active");
  const [search, setSearch] = useState<string | undefined>(undefined);
  const [page,   setPage]   = useState(1);

  const handleSearch = useDebouncedCallback((value: string) => {
    setPage(1);
    setSearch(value.trim() || undefined);
  }, 350);

  // Las órdenes de flota están bajo fleetId; las individuales bajo customerId.
  const { data, isLoading, isError } = useWorkOrders({
    page,
    pageSize:   50,
    search,
    vehicleId,
    fleetId:    fleetId  ?? undefined,
    customerId: !fleetId ? (customerId ?? undefined) : undefined,
  });
  const items = data?.items ?? [];

  const active   = items.filter((o) => !isFinished(o));
  const approval = items.filter((o) => Number(o.currentStatus) === WorkOrderStatus.AwaitingApproval);
  const history  = items.filter(isFinished);

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "active",   label: "En curso",    count: active.length },
    { key: "approval", label: "Por aprobar", count: approval.length },
    { key: "history",  label: "Historial",   count: history.length },
  ];

  const shown = tab === "active" ? active : tab === "approval" ? approval : history;

  return (
    <div className="space-y-4">

      {/* ── Navegación contextual ───────────────────────────────────────────── */}
      {vehicleId && (
        <BackButton href={`/my-vehicles/${vehicleId}`} label="Volver al vehículo" />
      )}

      {/* ── Título y Header Premium ─────────────────────────────────────────── */}
      <div className="bg-[#041627] text-white rounded-2xl p-5 shadow-md shadow-[#041627]/10 relative overflow-hidden">
        {/* Decoración circular de fondo */}
        <div className="absolute -right-10 -bottom-10 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#fea520]" />
            <h1 className="text-lg font-extrabold tracking-wide">
              {vehicleId ? "Órdenes del vehículo" : "Mis órdenes de trabajo"}
            </h1>
          </div>

          {/* Llamado a la acción: presupuestos esperando aprobación */}
          {!isLoading && approval.length > 0 && (
            <button
              onClick={() => setTab("approval")}
              className="w-full flex items-center gap-2.5 bg-gradient-to-r from-[#fea520] to-[#fec15d] text-[#041627] rounded-xl px-4 py-3 shadow-md shadow-[#fea520]/20 active:scale-[0.98] transition-transform text-left"
            >
              <Sparkles className="w-4 h-4 shrink-0 animate-pulse" />
              <span className="text-xs font-extrabold leading-snug">
                {approval.length === 1
                  ? "Tenés 1 presupuesto esperando tu aprobación"
                  : `Tenés ${approval.length} presupuestos esperando tu aprobación`}
                {" "}→
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ── Búsqueda + Tabs ─────────────────────────────────────────────────── */}
      <SearchInput
        placeholder="Buscar por patente..."
        onChange={handleSearch}
      />

      <div className="flex bg-white border border-[#c4c6cd]/60 p-1 rounded-xl gap-0.5 shadow-sm">
        {TABS.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-[11px] font-extrabold rounded-lg transition-colors ${
              tab === key
                ? "bg-[#041627] text-white shadow-sm"
                : "text-[#44474c] hover:bg-[#eefcfd]"
            }`}
          >
            <span className="truncate">{label}</span>
            <span
              className={`text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none ${
                tab === key
                  ? key === "approval" && count > 0
                    ? "bg-[#fea520] text-[#041627]"
                    : "bg-white/15 text-white"
                  : key === "approval" && count > 0
                    ? "bg-[#fea520]/20 text-[#e8951d]"
                    : "bg-[#041627]/5 text-[#44474c]"
              }`}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Estados de carga / error ────────────────────────────────────────── */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => <OrderCardSkeleton key={i} />)}
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center shadow-sm">
          <p className="text-sm text-red-600 font-bold">No pudimos cargar tus órdenes.</p>
          <p className="text-xs text-red-400 mt-1">Por favor, intentá de nuevo recargando la página.</p>
        </div>
      )}

      {/* ── Vacíos (por tab o global) ───────────────────────────────────────── */}
      {!isLoading && !isError && shown.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-14 px-4 text-center bg-white border border-[#041627]/10 rounded-2xl shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#eefcfd] flex items-center justify-center">
            {tab === "history"
              ? <History className="w-6 h-6 text-[#041627]" />
              : tab === "approval"
                ? <Sparkles className="w-6 h-6 text-[#041627]" />
                : <Wrench className="w-6 h-6 text-[#041627]" />}
          </div>
          {search ? (
            <>
              <p className="text-sm font-extrabold text-[#041627]">Sin resultados para tu búsqueda</p>
              <p className="text-xs text-[#44474c]/85 max-w-xs leading-relaxed">
                Probá con otra patente o borrá la búsqueda para ver todas tus órdenes.
              </p>
            </>
          ) : tab === "approval" ? (
            <>
              <p className="text-sm font-extrabold text-[#041627]">Nada para aprobar</p>
              <p className="text-xs text-[#44474c]/85 max-w-xs leading-relaxed">
                Cuando el taller te envíe un presupuesto, vas a poder revisarlo y aprobarlo desde acá.
              </p>
            </>
          ) : tab === "history" ? (
            <>
              <p className="text-sm font-extrabold text-[#041627]">Sin órdenes finalizadas</p>
              <p className="text-xs text-[#44474c]/85 max-w-xs leading-relaxed">
                Acá vas a encontrar las órdenes entregadas o canceladas, con su detalle completo.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-extrabold text-[#041627]">Sin órdenes en curso</p>
              <p className="text-xs text-[#44474c]/85 max-w-xs leading-relaxed">
                Cuando traigas tu vehículo al taller, tus órdenes de trabajo y presupuestos aparecerán acá para que los sigas al instante.
              </p>
            </>
          )}
        </div>
      )}

      {/* ── Contenido del tab ───────────────────────────────────────────────── */}
      {!isLoading && !isError && shown.length > 0 && (
        tab === "history" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 animate-[fadeIn_0.2s_ease-out]">
            {shown.map((o) => <HistoryOrderRow key={o.id} order={o} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-[fadeIn_0.2s_ease-out]">
            {shown.map((o) => <OrderCard key={o.id} order={o} />)}
          </div>
        )
      )}

      {/* ── Paginación (solo si hay más de una página en el server) ─────────── */}
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
