"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { toast } from "sonner";
import {
  Car, Gauge, Tag, ChevronRight, X,
  ClipboardPlus, ExternalLink, Fuel,
} from "lucide-react";

import { BackButton } from "@/components/shared/BackButton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Pagination } from "@/components/shared/Pagination";
import { SearchInput } from "@/components/shared/SearchInput";
import { OpenOrderModal } from "@/components/shared/OpenOrderModal";
import { FuelTypeLabel, VehicleBodyTypeLabel } from "@/lib/enums";
import { useVehicle, useVehicles } from "@/hooks/useVehicles";
import { workOrdersService } from "@/services/work-orders.service";
import { Vehicle } from "@/types/api.types";

// ─── Avatar ───────────────────────────────────────────────────────────────────

function VehicleAvatar({ vehicle, size = "md" }: { vehicle: Vehicle; size?: "sm" | "md" | "lg" }) {
  const initials = `${vehicle.brand[0] ?? ""}${vehicle.model[0] ?? ""}`.toUpperCase();
  const sz = size === "lg" ? "w-16 h-16 text-xl" : size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <div className={`${sz} rounded-full bg-[#041627] text-white flex items-center justify-center font-bold shrink-0`}>
      {initials}
    </div>
  );
}

// ─── Panel de detalle ─────────────────────────────────────────────────────────

interface PendingOrder {
  vehicleId:    string;
  vehicleLabel: string;
  mileage:      number;
}

function DetailPanel({
  vehicleId,
  onClose,
  onOpenOrder,
}: {
  vehicleId:   string;
  onClose:     () => void;
  onOpenOrder: (p: PendingOrder) => void;
}) {
  const { data: vehicle, isLoading } = useVehicle(vehicleId);

  return (
    <aside className="w-full lg:w-80 shrink-0 bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden flex flex-col self-start lg:sticky lg:top-0">

      {/* Header */}
      <div className="border-b border-[#c4c6cd]/60 px-5 py-4">
        <div className="flex items-start justify-between mb-4">
          {isLoading ? (
            <div className="w-16 h-16 rounded-full bg-[#c4c6cd]/30 animate-pulse" />
          ) : vehicle ? (
            <VehicleAvatar vehicle={vehicle} size="lg" />
          ) : null}
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#44474c] hover:bg-[#eefcfd] hover:text-[#041627] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <div className="h-5 w-40 bg-[#c4c6cd]/30 rounded animate-pulse" />
            <div className="h-3 w-24 bg-[#c4c6cd]/20 rounded animate-pulse" />
          </div>
        ) : vehicle ? (
          <>
            <h3 className="text-base font-bold text-[#041627]">
              {vehicle.brand} {vehicle.model}
            </h3>
            <p className="text-xs text-[#44474c] mt-0.5">
              {vehicle.year}{vehicle.color ? ` · ${vehicle.color}` : ""}
            </p>

            {/* Mini stats */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="rounded-lg bg-[#eefcfd] border border-[#c4c6cd]/60 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70 mb-1">Patente</p>
                <span className="inline-flex items-center gap-1 text-sm font-mono font-semibold text-[#041627]">
                  <Tag className="w-3 h-3" />
                  {vehicle.licensePlate}
                </span>
              </div>
              <div className="rounded-lg bg-[#eefcfd] border border-[#c4c6cd]/60 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70 mb-1">Kilometraje</p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#041627]">
                  <Gauge className="w-3 h-3" />
                  {vehicle.currentMileage.toLocaleString("es-AR")} km
                </span>
              </div>
              <div className="rounded-lg bg-[#eefcfd] border border-[#c4c6cd]/60 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70 mb-1">Carrocería</p>
                <p className="text-sm font-semibold text-[#041627]">{VehicleBodyTypeLabel[vehicle.vehicleBodyType]}</p>
              </div>
              <div className="rounded-lg bg-[#eefcfd] border border-[#c4c6cd]/60 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70 mb-1">Combustible</p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#041627]">
                  <Fuel className="w-3 h-3" />
                  {FuelTypeLabel[vehicle.fuelType]}
                </span>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Footer de acciones */}
      {vehicle && (
        <div className="border-t border-[#c4c6cd]/60 px-5 py-4 space-y-2">
          <button
            onClick={() => onOpenOrder({
              vehicleId:    vehicle.id,
              vehicleLabel: `${vehicle.brand} ${vehicle.model} · ${vehicle.licensePlate}`,
              mileage:      vehicle.currentMileage,
            })}
            className="flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-bold text-[#041627] bg-[#fea520] hover:bg-[#865300] hover:text-white transition-all"
          >
            <span className="flex items-center gap-1.5">
              <ClipboardPlus className="w-4 h-4" />
              Abrir orden de trabajo
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
          <Link
            href={`/admin/work-orders?vehicleId=${vehicleId}`}
            className="flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium text-[#041627] bg-[#eefcfd] border border-[#c4c6cd]/60 hover:border-[#041627] transition-colors"
          >
            Ver órdenes de este vehículo
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href={`/admin/vehicles/${vehicleId}`}
            className="flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium text-white bg-[#041627] hover:bg-[#041627]/80 transition-colors"
          >
            Ficha completa
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      )}
    </aside>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function VehiclesPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const customerId   = searchParams.get("customerId") ?? undefined;

  const [page,         setPage]         = useState(1);
  const [search,       setSearch]       = useState<string | undefined>(undefined);
  const [selectedId,   setSelectedId]   = useState<string | null>(null);
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);

  const { data, isLoading, isError } = useVehicles({ page, pageSize: 20, search, customerId });

  const handleSearch = useDebouncedCallback((value: string) => {
    setPage(1);
    setSearch(value || undefined);
  }, 350);

  async function handleConfirmOrder({
    mileageAtEntry,
    customerNote,
    contactPersonName,
    contactPersonPhone,
  }: {
    mileageAtEntry: number;
    customerNote: string;
    contactPersonName?: string;
    contactPersonPhone?: string;
  }) {
    if (!pendingOrder) return;
    try {
      const order = await workOrdersService.create({
        vehicleId: pendingOrder.vehicleId,
        mileageAtEntry,
        customerNote: customerNote || undefined,
        contactPersonName: contactPersonName || undefined,
        contactPersonPhone: contactPersonPhone || undefined,
      });
      toast.success("Orden de trabajo abierta");
      router.push(`/admin/work-orders/${order.id}`);
    } catch {
      toast.error("No se pudo abrir la orden de trabajo");
      throw new Error(); // para que el modal no cierre solo
    }
  }

  const items = data?.items ?? [];

  return (
    <div className="space-y-5">

      {/* Modal de apertura de orden */}
      {pendingOrder && (
        <OpenOrderModal
          vehicleLabel={pendingOrder.vehicleLabel}
          initialMileage={pendingOrder.mileage}
          onConfirm={handleConfirmOrder}
          onClose={() => setPendingOrder(null)}
        />
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {customerId && (
          <BackButton href={`/admin/customers/${customerId}`} label="Volver al cliente" />
        )}
        <PageHeader
          title="Vehículos"
          subtitle={
            data
              ? `${data.totalCount.toLocaleString("es-AR")} vehículos registrados${customerId ? " para este cliente" : ""}`
              : "Cargando vehículos..."
          }
          Icon={Car}
        />
      </div>

      {/* ── Búsqueda ────────────────────────────────────────────────────────── */}
      <SearchInput
        placeholder="Buscar patente, marca o modelo..."
        onChange={handleSearch}
        className="max-w-sm"
      />

      {/* ── Contenido principal ─────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">

        {/* Tabla */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="divide-y divide-[#c4c6cd]/40">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <div className="w-10 h-10 rounded-full bg-[#c4c6cd]/30 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-40 bg-[#c4c6cd]/30 rounded animate-pulse" />
                      <div className="h-3 w-24 bg-[#c4c6cd]/20 rounded animate-pulse" />
                    </div>
                    <div className="h-3 w-20 bg-[#c4c6cd]/20 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : isError ? (
              <p className="px-6 py-8 text-sm text-red-500 text-center">Error al cargar los vehículos.</p>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <Car className="w-10 h-10 text-[#c4c6cd]" />
                <p className="text-sm font-semibold text-[#041627]">Sin vehículos</p>
                <p className="text-xs text-[#44474c]">
                  {search ? "Probá con otro término de búsqueda." : "No hay vehículos registrados."}
                </p>
              </div>
            ) : (
              <>
                {/* Cabecera */}
                <div className="grid grid-cols-[1fr_1fr_130px_120px_56px] gap-4 px-6 py-3 bg-[#eefcfd] border-b border-[#c4c6cd]/60">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Vehículo</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Titular registral</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Tipo</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70 text-right">Kilometraje</p>
                  <p />
                </div>

                {/* Filas */}
                <div className="divide-y divide-[#c4c6cd]/40">
                  {items.map((v) => {
                    const isSelected = selectedId === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setSelectedId((prev) => prev === v.id ? null : v.id)}
                        className={`w-full grid grid-cols-[1fr_1fr_130px_120px_56px] gap-4 items-center px-6 py-4 text-left border-l-4 transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-[#fea520]/[0.05] border-l-[#fea520]"
                            : "hover:bg-[#eefcfd]/60 border-l-transparent"
                        }`}
                      >
                        {/* Vehículo */}
                        <div className="flex items-center gap-3 min-w-0">
                          <VehicleAvatar vehicle={v} size="sm" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#041627] truncate">
                              {v.brand} {v.model} ({v.year})
                            </p>
                            <span className="inline-flex items-center gap-1 text-xs text-[#44474c] font-mono">
                              <Tag className="w-3 h-3" />
                              {v.licensePlate}
                            </span>
                          </div>
                        </div>

                        {/* Titular */}
                        <div className="min-w-0 flex flex-col justify-center">
                          <p className="text-sm text-[#041627] truncate">
                            {v.registrationHolderFirstName} {v.registrationHolderLastName}
                          </p>
                        </div>

                        {/* Tipo */}
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <span className="text-xs text-[#041627] font-medium">{VehicleBodyTypeLabel[v.vehicleBodyType]}</span>
                          <span className="text-[10px] text-[#44474c]/70">{FuelTypeLabel[v.fuelType]}</span>
                        </div>

                        {/* Kilometraje */}
                        <div className="flex items-center justify-end gap-1 text-sm text-[#041627] tabular-nums shrink-0">
                          <Gauge className="w-3.5 h-3.5 text-[#44474c]/50" />
                          {v.currentMileage.toLocaleString("es-AR")} km
                        </div>

                        {/* Chevron */}
                        <ChevronRight className={`w-4 h-4 shrink-0 transition-colors ${isSelected ? "text-[#fea520]" : "text-[#c4c6cd]"}`} />
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Footer */}
            {!isLoading && !isError && data && (
              <div className="px-6 py-3 bg-[#eefcfd]/60 border-t border-[#c4c6cd]/60">
                <p className="text-xs text-[#44474c]/70">
                  Mostrando {items.length} de {data.totalCount.toLocaleString("es-AR")} vehículos
                </p>
              </div>
            )}
          </div>

          {data && (
            <Pagination
              currentPage={data.page}
              totalPages={data.totalPages}
              hasNextPage={data.hasNextPage}
              hasPreviousPage={data.hasPreviousPage}
              onPageChange={(p) => { setPage(p); setSelectedId(null); }}
            />
          )}
        </div>

        {/* Panel de detalle */}
        {selectedId && (
          <DetailPanel
            vehicleId={selectedId}
            onClose={() => setSelectedId(null)}
            onOpenOrder={setPendingOrder}
          />
        )}
      </div>
    </div>
  );
}
