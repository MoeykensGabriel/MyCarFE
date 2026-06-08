"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Tag, Gauge, Fuel, ClipboardList, ChevronRight, Info, ShieldAlert, Sparkles, FileText, User } from "lucide-react";

import { BackButton } from "@/components/shared/BackButton";
import {
  DocumentTypeLabel, FuelTypeLabel,
  VehicleBodyTypeLabel, VehicleUseTypeLabel,
} from "@/lib/enums";
import { useVehicle } from "@/hooks/useVehicles";
import { VehicleDocumentsCard } from "@/components/vehicle-documents/VehicleDocumentsCard";
import { CustomerTiresCard } from "@/components/vehicle-tires/CustomerTiresCard";
import { CustomerBatteryCard } from "@/components/vehicle-battery/CustomerBatteryCard";
import { TripStationQrCard } from "@/components/vehicle-trips/TripStationQrCard";
import { VehicleTripsHistoryCard } from "@/components/vehicle-trips/VehicleTripsHistoryCard";
import { PremiumLockCard } from "@/components/shared/PremiumLockCard";
import { useHasPremiumFeature } from "@/lib/premium";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 w-28 bg-[#c4c6cd]/40 rounded" />
      <div className="bg-white rounded-2xl border border-[#041627]/10 p-5 space-y-4">
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
    <div className="flex items-center justify-between gap-4 py-3 border-b border-[#041627]/5 last:border-0">
      <p className="text-xs font-semibold text-[#44474c]/75 shrink-0">{label}</p>
      <p className="text-xs font-extrabold text-[#041627] text-right truncate max-w-[200px]">
        {value && value !== "undefined undefined" && value.trim() !== "" ? value : "—"}
      </p>
    </div>
  );
}

// ─── Sección con título ───────────────────────────────────────────────────────

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-[#041627]/10 shadow-sm overflow-hidden transition-all duration-300 hover:border-[#fea520]/20 hover:shadow-md">
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-[#041627]/5 bg-gradient-to-r from-[#eefcfd] to-white">
        <Icon className="w-4 h-4 text-[#041627]" strokeWidth={2} />
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627]/80">{title}</p>
      </div>
      <div className="px-4">{children}</div>
    </section>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function MyVehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: vehicle, isLoading, isError } = useVehicle(id);

  // Funciones plus (bloqueadas para todos por ahora — ver lib/premium).
  const canDocs  = useHasPremiumFeature("vehicleDocuments");
  const canTrips = useHasPremiumFeature("vehicleTrips");

  if (isLoading) return (
    <div className="space-y-4">
      <BackButton href="/my-vehicles" label="Volver a mis vehículos" />
      <Skeleton />
    </div>
  );

  if (isError || !vehicle) return (
    <div className="space-y-4">
      <BackButton href="/my-vehicles" label="Volver a mis vehículos" />
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
        <p className="text-sm text-red-600 font-extrabold">No pudimos cargar este vehículo.</p>
      </div>
    </div>
  );

  const initials = `${vehicle.brand[0] ?? ""}${vehicle.model[0] ?? ""}`.toUpperCase();

  return (
    <div className="space-y-4 pb-12">

      {/* ── Navegación ──────────────────────────────────────────────────────── */}
      <BackButton href="/my-vehicles" label="Volver a mis vehículos" />

      {/* ── Header Dossier del Auto ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#041627]/10 shadow-md relative overflow-hidden p-5">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#fea520]" />
        
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#041627] to-[#0a2540] text-[#fea520] flex items-center justify-center font-black text-xl shrink-0 shadow-md shadow-[#041627]/10 border border-[#fea520]/20">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#fea520]" />
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#fea520]">Ficha de Unidad</p>
            </div>
            <h1 className="text-lg font-black text-[#041627] leading-tight truncate mt-0.5">
              {vehicle.brand} {vehicle.model}
            </h1>
            <p className="text-xs font-bold text-[#44474c] mt-0.5">
              Año {vehicle.year} {vehicle.color ? `· Color ${vehicle.color}` : ""}
            </p>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono text-[#041627] mt-1.5 bg-[#fea520]/10 border border-[#fea520]/25 px-2.5 py-0.5 rounded-md">
              <Tag className="w-3.5 h-3.5 text-[#e8951d]" />
              {vehicle.licensePlate}
            </span>
          </div>
        </div>

        {/* Chips rápidos */}
        <div className="flex flex-wrap gap-1.5 mt-5 pt-4 border-t border-[#041627]/5">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#041627] bg-[#eefcfd] border border-[#041627]/5 rounded-full px-3 py-1 shadow-sm">
            <Gauge className="w-3.5 h-3.5 text-[#fea520]" />
            {vehicle.currentMileage.toLocaleString("es-AR")} km
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#041627] bg-[#eefcfd] border border-[#041627]/5 rounded-full px-3 py-1 shadow-sm">
            <Fuel className="w-3.5 h-3.5 text-[#fea520]" />
            {FuelTypeLabel[vehicle.fuelType]}
          </span>
          <span className="text-[10px] font-bold text-[#041627] bg-[#eefcfd]/60 border border-[#041627]/5 rounded-full px-3 py-1 shadow-sm">
            {VehicleBodyTypeLabel[vehicle.vehicleBodyType]}
          </span>
          <span className="text-[10px] font-bold text-[#041627] bg-[#eefcfd]/60 border border-[#041627]/5 rounded-full px-3 py-1 shadow-sm">
            {VehicleUseTypeLabel[vehicle.vehicleUseType]}
          </span>
        </div>
      </div>

      {/* ── Acceso Rápido a Órdenes ─────────────────────────────────────────── */}
      <Link
        href={`/my-orders?vehicleId=${vehicle.id}`}
        className="flex items-center justify-between w-full bg-[#041627] text-white rounded-2xl p-4.5 hover:bg-[#0a2540] active:scale-[0.98] transition-all duration-300 shadow-md shadow-[#041627]/10 group border border-[#fea520]/15"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-105 transition-transform duration-300">
            <ClipboardList className="w-5 h-5 text-[#fea520]" />
          </div>
          <div className="text-left">
            <p className="text-xs font-black uppercase tracking-wider text-[#fea520]">Historial de Órdenes</p>
            <p className="text-[11px] text-white/70 font-semibold mt-0.5">Revisá mantenimientos y reparaciones pasadas</p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
          <ChevronRight className="w-4 h-4 text-[#fea520]" />
        </div>
      </Link>

      {/* ── Vencimientos (VTV, póliza, patente) — función plus ──────────────── */}
      {canDocs ? (
        <VehicleDocumentsCard vehicleId={vehicle.id} />
      ) : (
        <PremiumLockCard
          title="Documentación y vencimientos"
          description="Cargá VTV, póliza y patente, y recibí avisos antes de que venzan. Disponible próximamente."
        />
      )}

      {/* ── Estado de cubiertas (solo lectura — lo registra el taller) ───────── */}
      <CustomerTiresCard vehicleId={vehicle.id} />

      {/* ── Estado de batería (solo lectura — lo registra el taller) ─────────── */}
      <CustomerBatteryCard vehicleId={vehicle.id} />

      {/* ── Estación de viajes (QR para choferes) — solo flota, función plus ── */}
      {vehicle.fleetId && (
        canTrips ? (
          <>
            <TripStationQrCard
              vehicleId={vehicle.id}
              vehicleLabel={`${vehicle.brand} ${vehicle.model} · ${vehicle.licensePlate}`}
              tripToken={vehicle.tripToken}
            />
            <VehicleTripsHistoryCard vehicleId={vehicle.id} />
          </>
        ) : (
          <PremiumLockCard
            title="Viajes con QR"
            description="Estación con QR para que los choferes registren sus viajes. Disponible próximamente."
          />
        )
      )}

      {/* ── Datos técnicos ──────────────────────────────────────────────────── */}
      <Section icon={Info} title="Datos Técnicos e Identificación">
        <InfoRow label="Marca" value={vehicle.brand} />
        <InfoRow label="Modelo" value={vehicle.model} />
        <InfoRow label="Año de Fabricación" value={String(vehicle.year)} />
        <InfoRow label="Color Oficial" value={vehicle.color} />
        <InfoRow label="N° de Chasis / VIN" value={vehicle.vin} />
        <InfoRow label="Número de Motor" value={vehicle.engineNumber} />
        <InfoRow label="N° de Cédula Verde" value={vehicle.registrationCertificateNumber} />
      </Section>

      {/* ── Titular registral ───────────────────────────────────────────────── */}
      <Section icon={User} title="Titular Registral del Vehículo">
        <InfoRow
          label="Nombre Completo"
          value={`${vehicle.registrationHolderFirstName ?? ""} ${vehicle.registrationHolderLastName ?? ""}`}
        />
        <InfoRow
          label="Tipo y N° de Documento"
          value={`${DocumentTypeLabel[vehicle.registrationHolderDocumentType] ?? ""} ${vehicle.registrationHolderDocumentNumber ?? ""}`}
        />
      </Section>

    </div>
  );
}
