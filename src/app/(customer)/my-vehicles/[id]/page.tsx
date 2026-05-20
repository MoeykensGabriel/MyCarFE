"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Tag, Gauge, Fuel, ClipboardList, ChevronRight, Info } from "lucide-react";

import { BackButton } from "@/components/shared/BackButton";
import {
  DocumentTypeLabel, FuelTypeLabel,
  VehicleBodyTypeLabel, VehicleUseTypeLabel,
} from "@/lib/enums";
import { useVehicle } from "@/hooks/useVehicles";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 w-28 bg-[#c4c6cd]/40 rounded" />
      <div className="bg-white rounded-2xl border border-[#c4c6cd]/60 p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#c4c6cd]/30 shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-40 bg-[#c4c6cd]/40 rounded" />
            <div className="h-3 w-20 bg-[#c4c6cd]/30 rounded" />
          </div>
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-3 w-24 bg-[#c4c6cd]/20 rounded" />
            <div className="h-3 w-28 bg-[#c4c6cd]/30 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Fila de información ──────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-[#c4c6cd]/30 last:border-0">
      <p className="text-xs text-[#44474c]/70 shrink-0">{label}</p>
      <p className="text-sm font-semibold text-[#041627] text-right">{value ?? "—"}</p>
    </div>
  );
}

// ─── Sección con título ───────────────────────────────────────────────────────

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-[#c4c6cd]/60 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#c4c6cd]/40 bg-[#eefcfd]">
        <Icon className="w-3.5 h-3.5 text-[#44474c]/60" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">{title}</p>
      </div>
      <div className="px-4">{children}</div>
    </section>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function MyVehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: vehicle, isLoading, isError } = useVehicle(id);

  if (isLoading) return (
    <div className="space-y-4">
      <BackButton href="/my-vehicles" label="Mis vehículos" />
      <Skeleton />
    </div>
  );

  if (isError || !vehicle) return (
    <div className="space-y-4">
      <BackButton href="/my-vehicles" label="Mis vehículos" />
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
        <p className="text-sm text-red-600 font-medium">No pudimos cargar este vehículo.</p>
      </div>
    </div>
  );

  const initials = `${vehicle.brand[0] ?? ""}${vehicle.model[0] ?? ""}`.toUpperCase();

  return (
    <div className="space-y-4">

      {/* ── Navegación ──────────────────────────────────────────────────────── */}
      <BackButton href="/my-vehicles" label="Mis vehículos" />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#c4c6cd]/60 shadow-sm p-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#041627] text-white flex items-center justify-center font-bold text-xl shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-[#041627] truncate">
              {vehicle.brand} {vehicle.model}
            </h1>
            <p className="text-sm text-[#44474c]">{vehicle.year}{vehicle.color ? ` · ${vehicle.color}` : ""}</p>
            <span className="inline-flex items-center gap-1 text-xs font-mono text-[#44474c] mt-0.5">
              <Tag className="w-3 h-3 text-[#44474c]/50" />
              {vehicle.licensePlate}
            </span>
          </div>
        </div>

        {/* Chips rápidos */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-[#c4c6cd]/30">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#44474c] bg-[#eefcfd] border border-[#c4c6cd]/60 rounded-full px-2.5 py-1">
            <Gauge className="w-3 h-3" />
            {vehicle.currentMileage.toLocaleString("es-AR")} km
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#44474c] bg-[#eefcfd] border border-[#c4c6cd]/60 rounded-full px-2.5 py-1">
            <Fuel className="w-3 h-3" />
            {FuelTypeLabel[vehicle.fuelType]}
          </span>
          <span className="text-[10px] font-semibold text-[#44474c] bg-[#eefcfd] border border-[#c4c6cd]/60 rounded-full px-2.5 py-1">
            {VehicleBodyTypeLabel[vehicle.vehicleBodyType]}
          </span>
          <span className="text-[10px] font-semibold text-[#44474c] bg-[#eefcfd] border border-[#c4c6cd]/60 rounded-full px-2.5 py-1">
            {VehicleUseTypeLabel[vehicle.vehicleUseType]}
          </span>
        </div>
      </div>

      {/* ── Datos técnicos ──────────────────────────────────────────────────── */}
      <Section icon={Info} title="Datos técnicos">
        <InfoRow label="Marca" value={vehicle.brand} />
        <InfoRow label="Modelo" value={vehicle.model} />
        <InfoRow label="Año" value={String(vehicle.year)} />
        <InfoRow label="Color" value={vehicle.color} />
        <InfoRow label="VIN" value={vehicle.vin} />
        <InfoRow label="N° de motor" value={vehicle.engineNumber} />
        <InfoRow label="N° de cédula verde" value={vehicle.registrationCertificateNumber} />
      </Section>

      {/* ── Titular registral ───────────────────────────────────────────────── */}
      <Section icon={Info} title="Titular registral">
        <InfoRow
          label="Nombre"
          value={`${vehicle.registrationHolderFirstName} ${vehicle.registrationHolderLastName}`}
        />
        <InfoRow
          label="Documento"
          value={`${DocumentTypeLabel[vehicle.registrationHolderDocumentType]} ${vehicle.registrationHolderDocumentNumber}`}
        />
      </Section>

      {/* ── Acceso rápido a órdenes ─────────────────────────────────────────── */}
      <Link
        href={`/my-orders?vehicleId=${vehicle.id}`}
        className="flex items-center justify-between w-full bg-white rounded-2xl border border-[#c4c6cd]/60 shadow-sm px-4 py-4 hover:border-[#fea520]/60 transition-all active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#eefcfd] border border-[#c4c6cd]/60 flex items-center justify-center shrink-0">
            <ClipboardList className="w-4 h-4 text-[#041627]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#041627]">Órdenes de trabajo</p>
            <p className="text-xs text-[#44474c]">Ver el historial de este vehículo</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-[#c4c6cd]" />
      </Link>

    </div>
  );
}
