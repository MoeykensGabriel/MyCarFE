"use client";

import Link from "next/link";
import { Car, Tag, Gauge, ChevronRight, Fuel } from "lucide-react";

import { FuelTypeLabel, VehicleBodyTypeLabel } from "@/lib/enums";
import { useVehicles } from "@/hooks/useVehicles";
import { useAuthStore } from "@/store/auth.store";
import { Vehicle } from "@/types/api.types";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function VehicleCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#c4c6cd]/60 shadow-sm p-4 space-y-3 animate-pulse">
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
  const initials = `${vehicle.brand[0] ?? ""}${vehicle.model[0] ?? ""}`.toUpperCase();

  return (
    <Link
      href={`/my-vehicles/${vehicle.id}`}
      className="flex items-center gap-4 bg-white rounded-2xl border border-[#c4c6cd]/60 shadow-sm p-4 transition-all active:scale-[0.98] hover:border-[#fea520]/60 hover:shadow-md"
    >
      {/* Avatar */}
      <div className="w-12 h-12 rounded-xl bg-[#041627] text-white flex items-center justify-center font-bold text-base shrink-0">
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#041627] truncate">
          {vehicle.brand} {vehicle.model} <span className="font-normal text-[#44474c]">({vehicle.year})</span>
        </p>

        <span className="inline-flex items-center gap-1 text-xs font-mono text-[#44474c] mt-0.5">
          <Tag className="w-3 h-3 text-[#44474c]/50" />
          {vehicle.licensePlate}
        </span>

        {/* Chips */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#44474c] bg-[#eefcfd] border border-[#c4c6cd]/60 rounded-full px-2 py-0.5">
            <Gauge className="w-3 h-3" />
            {vehicle.currentMileage.toLocaleString("es-AR")} km
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#44474c] bg-[#eefcfd] border border-[#c4c6cd]/60 rounded-full px-2 py-0.5">
            <Fuel className="w-3 h-3" />
            {FuelTypeLabel[vehicle.fuelType]}
          </span>
          <span className="text-[10px] font-semibold text-[#44474c] bg-[#eefcfd] border border-[#c4c6cd]/60 rounded-full px-2 py-0.5">
            {VehicleBodyTypeLabel[vehicle.vehicleBodyType]}
          </span>
        </div>
      </div>

      <ChevronRight className="w-4 h-4 text-[#c4c6cd] shrink-0" />
    </Link>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function MyVehiclesPage() {
  const { customerId, fleetId } = useAuthStore();

  // Los vehículos de flota están bajo fleetId; los individuales bajo customerId.
  const { data, isLoading, isError } = useVehicles({
    pageSize:   50,
    fleetId:    fleetId  ?? undefined,
    customerId: !fleetId ? (customerId ?? undefined) : undefined,
  });
  const items = data?.items ?? [];

  return (
    <div className="space-y-4">

      {/* ── Título ──────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-[#041627]">Mis vehículos</h1>
        {!isLoading && (
          <p className="text-sm text-[#44474c] mt-0.5">
            {items.length === 0
              ? "Sin vehículos registrados"
              : `${items.length} vehículo${items.length !== 1 ? "s" : ""} registrado${items.length !== 1 ? "s" : ""}`}
          </p>
        )}
      </div>

      {/* ── Estados ─────────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <VehicleCardSkeleton key={i} />)}
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
          <p className="text-sm text-red-600 font-medium">No pudimos cargar tus vehículos.</p>
          <p className="text-xs text-red-400 mt-0.5">Intentá recargar la página.</p>
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Car className="w-12 h-12 text-[#c4c6cd]" />
          <p className="text-sm font-semibold text-[#041627]">Sin vehículos todavía</p>
          <p className="text-xs text-[#44474c] max-w-xs">
            Cuando registres un vehículo en el taller, aparecerá acá.
          </p>
        </div>
      )}

      {/* ── Lista ───────────────────────────────────────────────────────────── */}
      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((v) => <VehicleCard key={v.id} vehicle={v} />)}
        </div>
      )}

    </div>
  );
}
