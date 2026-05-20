"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";

import { AxiosError } from "axios";

import { BackButton } from "@/components/shared/BackButton";
import { StepVehicle } from "@/components/intake/StepVehicle";
import { DocumentType } from "@/lib/enums";
import { useCustomer } from "@/hooks/useCustomers";
import { vehiclesService } from "@/services/vehicles.service";
import { workOrdersService } from "@/services/work-orders.service";
import { VehicleDraft } from "@/components/intake/types";
import { ProblemDetails } from "@/types/api.types";

export default function AddVehiclePage() {
  const { id: customerId } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: customer, isLoading, isError } = useCustomer(customerId);
  const [partialError, setPartialError] = useState<{ vehicleId: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(draft: VehicleDraft) {
    setSubmitting(true);
    setPartialError(null);

    let vehicleId: string;

    try {
      const vehicle = await vehiclesService.create({ ...draft, customerId });
      vehicleId = vehicle.id;
    } catch (err) {
      const detail = (err as AxiosError<ProblemDetails>).response?.data?.detail;
      const title  = (err as AxiosError<ProblemDetails>).response?.data?.title;
      toast.error(detail ?? title ?? "No se pudo registrar el vehículo.");
      setSubmitting(false);
      return;
    }

    try {
      const order = await workOrdersService.create({
        vehicleId,
        mileageAtEntry: draft.currentMileage,
        customerNote:   draft.customerNote?.trim() || undefined,
      });
      toast.success("Vehículo registrado y orden abierta");
      router.push(`/admin/work-orders/${order.id}`);
    } catch {
      setPartialError({ vehicleId });
      setSubmitting(false);
    }
  }

  if (isLoading) return (
    <div className="space-y-4 max-w-2xl">
      <BackButton href={`/admin/customers/${customerId}`} label="Volver al cliente" />
      <p className="text-sm text-[#44474c]">Cargando...</p>
    </div>
  );

  if (isError || !customer) return (
    <div className="space-y-4 max-w-2xl">
      <BackButton href={`/admin/customers/${customerId}`} label="Volver al cliente" />
      <p className="text-sm text-red-500">No se pudo cargar el cliente.</p>
    </div>
  );

  // Contacto de flota → los vehículos van asociados a la flota, no al customer
  if (customer.fleetId) return (
    <div className="max-w-2xl space-y-6">
      <BackButton href={`/admin/customers/${customerId}`} label={`${customer.firstName} ${customer.lastName}`} />
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-5 space-y-2">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Este cliente es contacto de flota</p>
            <p className="text-sm text-amber-700 mt-1">
              Los vehículos de flota deben registrarse desde el ingreso de flota, no desde el perfil del contacto.
              Usá <span className="font-semibold">Nuevo ingreso → Flota existente</span> para asociar el vehículo
              a la empresa correctamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <BackButton href={`/admin/customers/${customerId}`} label={`${customer.firstName} ${customer.lastName}`} />
        <h1 className="text-2xl font-bold text-[#041627] mt-3">Registrar vehículo</h1>
        <p className="text-sm text-[#44474c] mt-0.5">
          Para <span className="font-semibold">{customer.firstName} {customer.lastName}</span>
        </p>
      </div>

      {partialError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">Vehículo registrado sin orden</p>
              <p className="text-sm text-red-600 mt-0.5">
                El vehículo fue creado pero no se pudo abrir la orden de trabajo.
              </p>
            </div>
          </div>
          <Link
            href={`/admin/vehicles/${partialError.vehicleId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-red-200 text-sm font-semibold text-red-700 hover:bg-red-50 transition-colors"
          >
            Ir al vehículo para abrir orden
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm px-6 py-6">
        <StepVehicle
          ownerLabel={`${customer.firstName} ${customer.lastName}`}
          ownerKind="customer"
          customerDocumentType={customer.documentType as DocumentType}
          customerDocumentNumber={customer.documentNumber}
          onNext={handleSubmit}
          onBack={() => router.push(`/admin/customers/${customerId}`)}
        />
      </div>
    </div>
  );
}
