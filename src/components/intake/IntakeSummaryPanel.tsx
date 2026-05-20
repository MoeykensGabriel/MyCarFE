"use client";

import { Check, User, Building2, Car, ClipboardList } from "lucide-react";

import {
  DocumentType,
  DocumentTypeLabel,
  FuelTypeLabel,
  VehicleBodyTypeLabel,
  VehicleUseTypeLabel,
} from "@/lib/enums";
import { Customer, Fleet } from "@/types/api.types";
import { CustomerDraft, FleetAndContactDraft, IntakeMode, VehicleDraft } from "./types";

interface Props {
  mode:             IntakeMode | null;
  customerDraft:    CustomerDraft | undefined;
  existingCustomer: Customer | undefined;
  fleetAndContact:  FleetAndContactDraft | undefined;
  /** Datos de la flota cuando el admin seleccionó una existente (fetched). */
  existingFleet?:   Fleet;
  vehicleDraft:     VehicleDraft | undefined;
}

/**
 * Panel lateral que se va llenando conforme el admin avanza por el intake.
 * Sirve como confirmación visual de los pasos previos (sin tener que volver
 * atrás) y como hint del progreso del flujo.
 */
export function IntakeSummaryPanel({
  mode,
  customerDraft,
  existingCustomer,
  fleetAndContact,
  existingFleet,
  vehicleDraft,
}: Props) {
  // ── Resolver datos del cliente / contacto / empresa ──────────────────────────
  const customerData = existingCustomer ?? customerDraft;
  const isFleetMode  = mode === "fleet";

  // ── Estados de completitud para mostrar el check ────────────────────────────
  const modeDone     = mode !== null;
  const ownerDone    = isFleetMode
    ? !!(fleetAndContact?.existingFleetId || fleetAndContact?.fleet)
    : !!customerData;
  const vehicleDone  = !!vehicleDraft;

  return (
    <aside className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden lg:sticky lg:top-6 self-start">
      {/* Header */}
      <div className="px-5 py-4 bg-[#041627] text-white flex items-center gap-2">
        <ClipboardList className="w-4 h-4 text-[#fea520]" />
        <div>
          <p className="text-sm font-bold leading-none">Resumen de la orden</p>
          <p className="text-[10px] text-white/60 mt-0.5">Se va completando con cada paso</p>
        </div>
      </div>

      <div className="divide-y divide-[#c4c6cd]/40">
        {/* ── Tipo de ingreso ─────────────────────────────────────────── */}
        <SummarySection
          title="Tipo de ingreso"
          done={modeDone}
          icon={isFleetMode ? Building2 : User}
        >
          {!modeDone ? (
            <SkeletonLines count={1} />
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#fea520]/10 text-[#865300] border border-[#fea520]/30">
              {isFleetMode ? "Flota / Empresa" : "Particular"}
            </span>
          )}
        </SummarySection>

        {/* ── Cliente / Empresa ───────────────────────────────────────── */}
        <SummarySection
          title={isFleetMode ? "Empresa" : "Cliente"}
          done={ownerDone}
          icon={isFleetMode ? Building2 : User}
        >
          {!ownerDone ? (
            <SkeletonLines count={3} />
          ) : isFleetMode ? (
            <FleetSummary fleet={fleetAndContact} existingFleet={existingFleet} />
          ) : (
            <CustomerSummary customer={customerData!} />
          )}
        </SummarySection>

        {/* ── Vehículo ────────────────────────────────────────────────── */}
        <SummarySection title="Vehículo" done={vehicleDone} icon={Car}>
          {!vehicleDone ? (
            <SkeletonLines count={3} />
          ) : (
            <VehicleSummary vehicle={vehicleDraft!} />
          )}
        </SummarySection>
      </div>
    </aside>
  );
}

// ─── Subcomponentes ──────────────────────────────────────────────────────────

function SummarySection({
  title,
  done,
  icon: Icon,
  children,
}: {
  title: string;
  done: boolean;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <Icon className={`w-3.5 h-3.5 ${done ? "text-[#041627]" : "text-[#c4c6cd]"}`} />
          <p className={`text-[10px] font-bold uppercase tracking-widest ${done ? "text-[#041627]" : "text-[#44474c]/50"}`}>
            {title}
          </p>
        </div>
        {done && (
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-100">
            <Check className="w-2.5 h-2.5 text-green-700" strokeWidth={3} />
          </span>
        )}
      </div>
      <div className="text-sm text-[#041627]">{children}</div>
    </div>
  );
}

function SkeletonLines({ count }: { count: number }) {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-2.5 rounded bg-[#c4c6cd]/30"
          style={{ width: `${100 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

function CustomerSummary({ customer }: { customer: Customer | CustomerDraft }) {
  return (
    <dl className="space-y-1 text-xs">
      <p className="text-sm font-semibold text-[#041627]">
        {customer.firstName} {customer.lastName}
      </p>
      <p className="font-mono text-[#44474c]">
        {DocumentTypeLabel[customer.documentType as DocumentType]} {customer.documentNumber}
      </p>
      {customer.email && <p className="text-[#44474c] truncate">{customer.email}</p>}
      {customer.phone && <p className="text-[#44474c]">{customer.phone}</p>}
    </dl>
  );
}

function FleetSummary({
  fleet,
  existingFleet,
}: {
  fleet: FleetAndContactDraft | undefined;
  existingFleet?: Fleet;
}) {
  if (!fleet) return null;

  // Tomamos los datos de la flota nueva (`fleet.fleet`) o de la flota existente
  // fetched (`existingFleet`). Si ninguno está disponible aún, mostramos hint.
  const fleetData = fleet.fleet ?? existingFleet;

  if (!fleetData) {
    return (
      <p className="text-xs text-[#44474c]">
        Flota existente seleccionada.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <dl className="space-y-1 text-xs">
        <p className="text-sm font-semibold text-[#041627]">{fleetData.companyName}</p>
        {fleetData.taxId && <p className="font-mono text-[#44474c]">CUIT {fleetData.taxId}</p>}
        {fleetData.phone && <p className="text-[#44474c]">{fleetData.phone}</p>}
        {fleetData.email && <p className="text-[#44474c] truncate">{fleetData.email}</p>}
      </dl>

      {fleet.contact && (
        <div className="pt-2 mt-2 border-t border-[#c4c6cd]/40">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70 mb-1">
            Contacto
          </p>
          <p className="text-xs font-semibold text-[#041627]">
            {fleet.contact.firstName} {fleet.contact.lastName}
          </p>
          <p className="text-[11px] font-mono text-[#44474c]">
            {DocumentTypeLabel[fleet.contact.documentType as DocumentType]} {fleet.contact.documentNumber}
          </p>
        </div>
      )}
    </div>
  );
}

function VehicleSummary({ vehicle }: { vehicle: VehicleDraft }) {
  return (
    <dl className="space-y-1 text-xs">
      <p className="text-sm font-semibold text-[#041627]">
        {vehicle.brand} {vehicle.model}
        {vehicle.year ? <span className="font-normal text-[#44474c]"> ({vehicle.year})</span> : null}
      </p>
      {vehicle.licensePlate && (
        <p className="font-mono text-[#44474c]">Patente {vehicle.licensePlate.toUpperCase()}</p>
      )}
      <div className="flex flex-wrap gap-1 mt-1.5">
        {vehicle.fuelType !== undefined && (
          <Chip>{FuelTypeLabel[vehicle.fuelType]}</Chip>
        )}
        {vehicle.vehicleBodyType !== undefined && (
          <Chip>{VehicleBodyTypeLabel[vehicle.vehicleBodyType]}</Chip>
        )}
        {vehicle.vehicleUseType !== undefined && (
          <Chip>{VehicleUseTypeLabel[vehicle.vehicleUseType]}</Chip>
        )}
      </div>
      {vehicle.color && <p className="text-[11px] text-[#44474c]/80 pt-1">Color: {vehicle.color}</p>}
      {!!vehicle.currentMileage && (
        <p className="text-[11px] text-[#44474c]/80">
          {vehicle.currentMileage.toLocaleString("es-AR")} km
        </p>
      )}
    </dl>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#eefcfd] text-[#44474c] border border-[#c4c6cd]/60">
      {children}
    </span>
  );
}
