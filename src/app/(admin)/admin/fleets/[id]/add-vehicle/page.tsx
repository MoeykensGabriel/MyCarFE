"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { AxiosError } from "axios";
import Link from "next/link";

import { BackButton } from "@/components/shared/BackButton";
import { StepVehicle } from "@/components/intake/StepVehicle";
import { OpenOrderModal } from "@/components/shared/OpenOrderModal";
import { useFleet } from "@/hooks/useFleets";
import { DocumentType } from "@/lib/enums";
import { vehiclesService } from "@/services/vehicles.service";
import { workOrdersService } from "@/services/work-orders.service";
import { VehicleDraft } from "@/components/intake/types";
import { ProblemDetails } from "@/types/api.types";

export default function AddVehicleToFleetPage() {
  const { id: fleetId } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: fleet, isLoading, isError } = useFleet(fleetId);

  const [partialError,        setPartialError]        = useState<{ vehicleId: string } | null>(null);
  const [submitting,          setSubmitting]          = useState(false);
  const [pendingOrderVehicle, setPendingOrderVehicle] = useState<{
    id:    string;
    label: string;
    mileage: number;
    customerNote?: string;
  } | null>(null);

  async function handleVehicleSubmit(draft: VehicleDraft) {
    setSubmitting(true);
    setPartialError(null);

    try {
      const vehicle = await vehiclesService.create({ ...draft, fleetId });
      // En vez de crear la orden directo, mostrar el modal para capturar quién trae el vehículo
      setPendingOrderVehicle({
        id:           vehicle.id,
        label:        `${draft.brand} ${draft.model} · ${draft.licensePlate}`,
        mileage:      draft.currentMileage ?? 0,
        customerNote: draft.customerNote,
      });
    } catch (err) {
      const detail = (err as AxiosError<ProblemDetails>).response?.data?.detail;
      const title  = (err as AxiosError<ProblemDetails>).response?.data?.title;
      toast.error(detail ?? title ?? "No se pudo registrar el vehículo.");
    } finally {
      setSubmitting(false);
    }
  }

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
    if (!pendingOrderVehicle) return;
    try {
      const order = await workOrdersService.create({
        vehicleId:         pendingOrderVehicle.id,
        mileageAtEntry,
        customerNote:      customerNote || undefined,
        contactPersonName: contactPersonName || undefined,
        contactPersonPhone: contactPersonPhone || undefined,
      });
      toast.success("Vehículo registrado y orden abierta");
      router.push(`/admin/work-orders/${order.id}`);
    } catch {
      setPartialError({ vehicleId: pendingOrderVehicle.id });
      setPendingOrderVehicle(null);
      throw new Error();
    }
  }

  if (isLoading) return (
    <div className="space-y-4 max-w-2xl">
      <BackButton href={`/admin/fleets/${fleetId}`} label="Volver a la flota" />
      <p className="text-sm text-[#44474c]">Cargando...</p>
    </div>
  );

  if (isError || !fleet) return (
    <div className="space-y-4 max-w-2xl">
      <BackButton href={`/admin/fleets/${fleetId}`} label="Volver a la flota" />
      <p className="text-sm text-red-500">No se pudo cargar la flota.</p>
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">

      {/* Modal para capturar quién trae el vehículo */}
      {pendingOrderVehicle && (
        <OpenOrderModal
          vehicleLabel={pendingOrderVehicle.label}
          initialMileage={pendingOrderVehicle.mileage}
          onConfirm={handleConfirmOrder}
          onClose={() => {
            // Si cierra el modal, el vehículo ya fue creado — ir a su ficha
            toast.info("Vehículo registrado. Podés abrir la orden desde su ficha.");
            router.push(`/admin/vehicles/${pendingOrderVehicle.id}`);
          }}
        />
      )}

      <div>
        <BackButton href={`/admin/fleets/${fleetId}`} label={fleet.companyName} />
        <h1 className="text-2xl font-bold text-[#041627] mt-3">Registrar vehículo de flota</h1>
        <p className="text-sm text-[#44474c] mt-0.5">
          Para <span className="font-semibold">{fleet.companyName}</span>
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
          ownerLabel={fleet.companyName}
          ownerKind="company"
          customerDocumentType={DocumentType.CUIT}
          customerDocumentNumber={fleet.taxId}
          onNext={handleVehicleSubmit}
          onBack={() => router.push(`/admin/fleets/${fleetId}`)}
          loading={submitting}
        />
      </div>
    </div>
  );
}
