"use client";

import { useState } from "react";
import Link from "next/link";
import { Car, Gauge, ChevronRight, Fuel, ArrowDownAZ, Clock } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

import { FuelTypeLabel, VehicleBodyTypeLabel } from "@/lib/enums";
import { useInfiniteVehicles } from "@/hooks/useVehicles";
import type { VehicleSort } from "@/services/vehicles.service";
import { useAuthStore } from "@/store/auth.store";
import { Vehicle } from "@/types/api.types";
import { PlateBadge } from "@/components/shared/PlateBadge";
import { SearchInput } from "@/components/shared/SearchInput";
import { UpcomingExpirationsBanner } from "@/components/vehicle-documents/UpcomingExpirationsBanner";
import { useHasPremiumFeature } from "@/lib/premium";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function VehicleCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#041627]/10 shadow-sm p-4 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-[#c4c6cd]/30 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-36 bg-[#c4c6cd]/40 rounded" />
          <div className="h-3 w-20 bg-[#c4c6cd]/30 rounded" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-6 w-20 bg-[#c4c6cd]/20 rounded-full" />
        <div className="h-6 w-16 bg-[#c4c6cd]/20 rounded-full" />
      </div>
    </div>
  );
}

// ─── Card de vehículo ─────────────────────────────────────────────────────────

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Link
      href={`/my-vehicles/${vehicle.id}`}
      className="flex items-center gap-3 sm:gap-4 bg-white rounded-2xl border border-[#041627]/10 shadow-sm p-3.5 sm:p-4 transition-all duration-300 active:scale-[0.98] hover:border-[#fea520]/60 hover:shadow-md group"
    >
      {/* Ícono del vehículo (a futuro: foto del vehículo tomada en la inspección) */}
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#041627] to-[#0a2540] flex items-center justify-center shrink-0 shadow-md shadow-[#041627]/10 group-hover:scale-105 transition-transform duration-300 border border-[#fea520]/20">
        <Car className="w-7 h-7 text-[#fea520]" strokeWidth={2} />
      </div>

      {/* Info — patente grande (PlateBadge, igual que en órdenes), modelo + año abajo */}
      <div className="flex-1 min-w-0">
        <PlateBadge plate={vehicle.licensePlate} />
        <p className="text-xs sm:text-sm font-semibold text-[#44474c] mt-1.5 truncate">
          {vehicle.brand} {vehicle.model} · {vehicle.year}
        </p>

        {/* Chips secundarios */}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#041627] bg-[#eefcfd] border border-[#041627]/5 rounded-full px-2 py-0.5">
            <Gauge className="w-3 h-3 text-[#fea520]" />
            {vehicle.currentMileage.toLocaleString("es-AR")} km
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#041627] bg-[#eefcfd] border border-[#041627]/5 rounded-full px-2 py-0.5">
            <Fuel className="w-3 h-3 text-[#fea520]" />
            {FuelTypeLabel[vehicle.fuelType]}
          </span>
          <span className="hidden sm:inline-flex text-[10px] font-bold text-[#041627] bg-[#eefcfd]/50 border border-[#041627]/5 rounded-full px-2 py-0.5">
            {VehicleBodyTypeLabel[vehicle.vehicleBodyType]}
          </span>
        </div>
      </div>

      <ChevronRight className="w-4 h-4 text-[#c4c6cd] group-hover:text-[#fea520] group-hover:translate-x-0.5 transition-all shrink-0" />
    </Link>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function MyVehiclesPage() {
  const { customerId, fleetId } = useAuthStore();
  const [search, setSearch] = useState<string | undefined>(undefined);
  // Por defecto alfabético (marca/modelo). El cliente puede cambiar a "plate" (patente ≈ antigüedad).
  const [sort, setSort] = useState<VehicleSort>("alphabetical");
  // Vencimientos es función plus — el banner solo aparece si está habilitada.
  const docsEnabled = useHasPremiumFeature("vehicleDocuments");

  // Los vehículos de flota están bajo fleetId; los individuales bajo customerId.
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteVehicles({
    pageSize:   20,
    search,
    sort,
    fleetId:    fleetId  ?? undefined,
    customerId: !fleetId ? (customerId ?? undefined) : undefined,
  });

  const handleSearch = useDebouncedCallback((value: string) => {
    setSearch(value || undefined);
  }, 350);

  // Aplanamos todas las páginas cargadas. El total real viene del back en cada página.
  const items = data?.pages.flatMap((p) => p.items) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? 0;
  const isSearching = !!search;

  return (
    <div className="space-y-5">

      {/* ── Título y Header Premium ─────────────────────────────────────────── */}
      <div className="bg-[#041627] text-white rounded-2xl p-5 shadow-md shadow-[#041627]/10 relative overflow-hidden">
        {/* Decoración circular de fondo */}
        <div className="absolute -right-10 -bottom-10 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <Car className="w-5 h-5 text-[#fea520]" />
            <h1 className="text-lg font-extrabold tracking-wide">Mis Vehículos</h1>
          </div>
          {!isLoading && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">
                Vehículos Registrados
              </p>
              <p className="text-xl font-black text-[#fea520] mt-0.5">
                {totalCount === 0 ? "0" : `${totalCount} unidad${totalCount !== 1 ? "es" : ""}`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Banner de vencimientos — solo si la función plus está habilitada ── */}
      {docsEnabled && <UpcomingExpirationsBanner />}

      {/* ── Buscador ────────────────────────────────────────────────────────── */}
      <SearchInput
        placeholder="Buscar por patente, marca o modelo..."
        onChange={handleSearch}
      />

      {/* ── Orden ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#44474c]/60 mr-1">
          Ordenar:
        </span>
        {([
          { value: "alphabetical", label: "A–Z",          Icon: ArrowDownAZ },
          { value: "plate",        label: "Antigüedad",   Icon: Clock },
        ] as const).map(({ value, label, Icon }) => {
          const active = sort === value;
          return (
            <button
              key={value}
              onClick={() => setSort(value)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                active
                  ? "bg-[#041627] text-white border-[#041627]"
                  : "bg-white text-[#44474c] border-[#c4c6cd] hover:border-[#041627]/40"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Estados ─────────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <VehicleCardSkeleton key={i} />)}
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center shadow-sm">
          <p className="text-sm text-red-600 font-bold">No pudimos cargar tus vehículos.</p>
          <p className="text-xs text-red-400 mt-1">Por favor, intentá de nuevo recargando la página.</p>
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 px-4 text-center bg-white border border-[#041627]/10 rounded-2xl shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#eefcfd] flex items-center justify-center">
            <Car className="w-6 h-6 text-[#041627]" />
          </div>
          {isSearching ? (
            <>
              <p className="text-sm font-extrabold text-[#041627]">Sin resultados</p>
              <p className="text-xs text-[#44474c]/85 max-w-xs leading-relaxed">
                No encontramos vehículos que coincidan con tu búsqueda. Probá con otra patente, marca o modelo.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-extrabold text-[#041627]">Sin vehículos registrados</p>
              <p className="text-xs text-[#44474c]/85 max-w-xs leading-relaxed">
                Cuando traigas tu primer vehículo a nuestro taller o lo dejes para service, lo registraremos y aparecerá automáticamente acá.
              </p>
            </>
          )}
        </div>
      )}

      {/* ── Lista ───────────────────────────────────────────────────────────── */}
      {items.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#44474c] bg-[#eefcfd] border border-[#c4c6cd]/40 w-fit px-2.5 py-0.5 rounded-full shadow-sm">
            Tus autos registrados
          </p>
          <div className="space-y-3 animate-[fadeIn_0.2s_ease-out]">
            {items.map((v) => <VehicleCard key={v.id} vehicle={v} />)}
          </div>

          {/* Cargar más — pide la siguiente página de a 20 al backend */}
          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="w-full py-3 rounded-2xl text-xs font-black uppercase tracking-wider border border-[#041627]/10 bg-white text-[#041627] hover:border-[#fea520] hover:text-[#fea520] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isFetchingNextPage ? "Cargando..." : "Cargar más"}
            </button>
          )}
        </div>
      )}

    </div>
  );
}
