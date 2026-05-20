"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Info, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { DocumentType, DocumentTypeLabel } from "@/lib/enums";
import { Customer } from "@/types/api.types";
import { customersService } from "@/services/customers.service";
import { vehiclesService } from "@/services/vehicles.service";
import { fleetsService } from "@/services/fleets.service";
import { workOrdersService } from "@/services/work-orders.service";
import { StepNav, Tag, SummaryItem } from "./ui";
import { IntakeMode, CustomerDraft, FleetAndContactDraft, VehicleDraft } from "./types";

interface Props {
  mode:              IntakeMode;
  customerDraft?:    CustomerDraft;
  existingCustomer?: Customer;
  fleetAndContact?:  FleetAndContactDraft;
  vehicleDraft:      VehicleDraft;
  onBack:            () => void;
}

export function StepConfirm({
  mode,
  customerDraft,
  existingCustomer,
  fleetAndContact,
  vehicleDraft,
  onBack,
}: Props) {
  const router  = useRouter();
  const [loading,      setLoading]      = useState(false);
  const [partialError, setPartialError] = useState<{
    message: string;
    customerId?: string;
    vehicleId?: string;
  } | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setPartialError(null);

    let createdCustomerId: string | undefined;
    let createdVehicleId:  string | undefined;

    try {
      let vehicleOwner: { customerId?: string; fleetId?: string };

      // ── Paso 1: crear cliente / flota ──────────────────────────────────────
      try {
        if (mode === "particular" && existingCustomer) {
          // Cliente ya existe: usar su ID directamente
          createdCustomerId = existingCustomer.id;
          vehicleOwner      = { customerId: existingCustomer.id };
        } else if (mode === "particular") {
          const { customer } = await customersService.create(customerDraft!);
          createdCustomerId  = customer.id;
          vehicleOwner       = { customerId: customer.id };
        } else if (fleetAndContact!.existingFleetId && !fleetAndContact!.contact) {
          // Flota existente sin contacto nuevo: el vehículo va directo a la flota
          vehicleOwner = { fleetId: fleetAndContact!.existingFleetId };
        } else {
          // Flota nueva (o existente con contacto nuevo)
          const fleetId =
            fleetAndContact!.existingFleetId ??
            (await fleetsService.create(fleetAndContact!.fleet!));
          const { customer } = await customersService.create({ ...fleetAndContact!.contact!, fleetId });
          createdCustomerId  = customer.id;
          vehicleOwner       = { fleetId };
        }
      } catch {
        setPartialError({ message: "No se pudo crear el cliente. No se creó nada." });
        return;
      }

      // ── Paso 2: crear vehículo ─────────────────────────────────────────────
      try {
        const vehicle     = await vehiclesService.create({ ...vehicleDraft, ...vehicleOwner });
        createdVehicleId  = vehicle.id;
      } catch {
        setPartialError({
          message: "El cliente fue creado pero no se pudo registrar el vehículo.",
          customerId: createdCustomerId,
        });
        return;
      }

      // ── Paso 3: crear orden ────────────────────────────────────────────────
      try {
        const order = await workOrdersService.create({
          vehicleId:          createdVehicleId,
          mileageAtEntry:     vehicleDraft.currentMileage,
          customerNote:       vehicleDraft.customerNote?.trim() || undefined,
          contactPersonName:  vehicleDraft.contactPersonName?.trim() || undefined,
          contactPersonPhone: vehicleDraft.contactPersonPhone?.trim() || undefined,
        });
        toast.success("Orden de trabajo creada correctamente");
        router.push(`/admin/work-orders/${order.id}`);
      } catch {
        setPartialError({
          message: "El vehículo fue registrado pero no se pudo abrir la orden de trabajo.",
          customerId: createdCustomerId,
          vehicleId:  createdVehicleId,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Propietario */}
      <div className="rounded-lg border border-[#c4c6cd] overflow-hidden">
        <div className="bg-[#041627] px-4 py-2.5">
          <span className="text-[11px] font-bold uppercase tracking-widest text-white/60">
            {mode === "fleet" ? "Empresa" : "Cliente"}
          </span>
        </div>
        <div className="px-4 py-4 bg-white">
          {mode === "particular" && existingCustomer && (
            <div className="grid grid-cols-2 gap-3">
              <SummaryItem
                label="Nombre"
                value={`${existingCustomer.firstName} ${existingCustomer.lastName}`}
              />
              <SummaryItem
                label="Documento"
                value={`${DocumentTypeLabel[existingCustomer.documentType as DocumentType]} ${existingCustomer.documentNumber}`}
              />
              <SummaryItem label="Email" value={existingCustomer.email} />
            </div>
          )}
          {mode === "particular" && customerDraft && !existingCustomer && (
            <div className="grid grid-cols-2 gap-3">
              <SummaryItem
                label="Nombre"
                value={`${customerDraft.firstName} ${customerDraft.lastName}`}
              />
              <SummaryItem
                label="Documento"
                value={`${DocumentTypeLabel[customerDraft.documentType as DocumentType]} ${customerDraft.documentNumber}`}
              />
              <SummaryItem label="Email"    value={customerDraft.email} />
              <SummaryItem label="Teléfono" value={customerDraft.phone} />
            </div>
          )}
          {mode === "fleet" && fleetAndContact && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Tag variant={fleetAndContact.existingFleetId ? "amber" : "navy"}>
                  {fleetAndContact.existingFleetId ? "Flota existente" : "Flota nueva"}
                </Tag>
                {fleetAndContact.fleet && (
                  <span className="font-semibold text-[#041627]">
                    {fleetAndContact.fleet.companyName}
                  </span>
                )}
              </div>
              {fleetAndContact.contact ? (
                <div className="grid grid-cols-2 gap-3">
                  <SummaryItem
                    label="Contacto"
                    value={`${fleetAndContact.contact.firstName} ${fleetAndContact.contact.lastName}`}
                  />
                  <SummaryItem label="Email" value={fleetAndContact.contact.email} />
                </div>
              ) : (
                <p className="text-xs text-[#44474c]">
                  Sin contacto nuevo — vehículo vinculado directamente a la flota.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Vehículo */}
      <div className="rounded-lg border border-[#c4c6cd] overflow-hidden">
        <div className="bg-[#041627] px-4 py-2.5">
          <span className="text-[11px] font-bold uppercase tracking-widest text-white/60">
            Vehículo
          </span>
        </div>
        <div className="px-4 py-4 bg-white grid grid-cols-2 gap-3">
          <SummaryItem
            label="Vehículo"
            value={`${vehicleDraft.brand} ${vehicleDraft.model} (${vehicleDraft.year})`}
          />
          <SummaryItem label="Patente" value={vehicleDraft.licensePlate} />
          {vehicleDraft.color && <SummaryItem label="Color" value={vehicleDraft.color} />}
          <SummaryItem
            label="Kilometraje"
            value={`${(vehicleDraft.currentMileage ?? 0).toLocaleString("es-AR")} km`}
          />
        </div>
      </div>

      {/* Motivo ingresado en el paso anterior */}
      {vehicleDraft.customerNote?.trim() && (
        <div className="rounded-lg border border-[#c4c6cd] overflow-hidden">
          <div className="bg-[#041627] px-4 py-2.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/60">
              Motivo de ingreso
            </span>
          </div>
          <div className="px-4 py-4 bg-white">
            <p className="text-sm text-[#041627]">{vehicleDraft.customerNote}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 rounded-md bg-[#fea520]/8 border border-[#fea520]/20 px-4 py-3">
        <Info className="w-4 h-4 text-[#fea520] shrink-0" />
        <p className="text-sm text-[#44474c]">
          Al confirmar se crea todo de una vez. La orden quedará en estado{" "}
          <span className="font-semibold text-[#041627]">Recibido</span>.
        </p>
      </div>

      {/* Banner de error parcial */}
      {partialError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">Ingreso incompleto</p>
              <p className="text-sm text-red-600 mt-0.5">{partialError.message}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {partialError.customerId && !partialError.vehicleId && (
              <Link
                href={`/admin/customers/${partialError.customerId}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-red-200 text-sm font-semibold text-red-700 hover:bg-red-50 transition-colors"
              >
                Ir al cliente para agregar vehículo
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
            {partialError.vehicleId && (
              <Link
                href={`/admin/vehicles/${partialError.vehicleId}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-red-200 text-sm font-semibold text-red-700 hover:bg-red-50 transition-colors"
              >
                Ir al vehículo para abrir orden
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}

      <StepNav
        onBack={onBack}
        onNext={handleConfirm}
        nextLabel="Confirmar y abrir orden"
        loading={loading}
      />
    </div>
  );
}
