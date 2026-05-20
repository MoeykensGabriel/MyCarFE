"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ClipboardPlus } from "lucide-react";
import { toast } from "sonner";

import { BackButton } from "@/components/shared/BackButton";
import { OpenOrderModal } from "@/components/shared/OpenOrderModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DocumentTypeLabel,
  FuelTypeLabel,
  VehicleBodyTypeLabel,
  VehicleUseTypeLabel,
} from "@/lib/enums";
import { useParams } from "next/navigation";
import { useVehicle } from "@/hooks/useVehicles";
import { useCustomer } from "@/hooks/useCustomers";
import { workOrdersService } from "@/services/work-orders.service";

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-gray-900">{value ?? "—"}</p>
    </div>
  );
}

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const { data: vehicle, isLoading, isError } = useVehicle(id);

  // Solo para vehículos de cliente particular: pre-llenar el nombre en el modal
  const { data: customer } = useCustomer(vehicle?.customerId ?? "");

  const [showModal, setShowModal] = useState(false);

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
    if (!vehicle) return;
    try {
      const order = await workOrdersService.create({
        vehicleId: vehicle.id,
        mileageAtEntry,
        customerNote: customerNote || undefined,
        contactPersonName: contactPersonName || undefined,
        contactPersonPhone: contactPersonPhone || undefined,
      });
      toast.success("Orden de trabajo abierta");
      router.push(`/admin/work-orders/${order.id}`);
    } catch {
      toast.error("No se pudo abrir la orden de trabajo");
      throw new Error();
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <BackButton href="/admin/vehicles" label="Vehículos" />
        <p className="text-sm text-muted-foreground">Cargando vehículo...</p>
      </div>
    );
  }

  if (isError || !vehicle) {
    return (
      <div className="space-y-4">
        <BackButton href="/admin/vehicles" label="Vehículos" />
        <p className="text-sm text-red-500">No se pudo cargar el vehículo.</p>
      </div>
    );
  }

  const contactNameDefault = customer
    ? `${customer.firstName} ${customer.lastName}`.trim()
    : undefined;

  const contactPhoneDefault = customer?.phone ?? undefined;

  return (
    <div className="space-y-6">
      {showModal && (
        <OpenOrderModal
          vehicleLabel={`${vehicle.brand} ${vehicle.model} · ${vehicle.licensePlate}`}
          initialMileage={vehicle.currentMileage}
          initialContactName={contactNameDefault}
          initialContactPhone={contactPhoneDefault}
          onConfirm={handleConfirmOrder}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Header */}
      <div>
        <BackButton href="/admin/vehicles" label="Vehículos" />
        <div className="mt-2">
          <h1 className="text-2xl font-bold text-gray-900">
            {vehicle.brand} {vehicle.model}
          </h1>
          <p className="text-muted-foreground font-mono mt-0.5">
            {vehicle.licensePlate}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Columna izquierda — 2/3 */}
        <div className="col-span-2 space-y-6">

          {/* Datos del vehículo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos del vehículo</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow label="Marca" value={vehicle.brand} />
              <InfoRow label="Modelo" value={vehicle.model} />
              <InfoRow label="Año" value={String(vehicle.year)} />
              <InfoRow label="Color" value={vehicle.color} />
              <InfoRow label="Tipo de carrocería" value={VehicleBodyTypeLabel[vehicle.vehicleBodyType]} />
              <InfoRow label="Combustible" value={FuelTypeLabel[vehicle.fuelType]} />
              <InfoRow label="Uso" value={VehicleUseTypeLabel[vehicle.vehicleUseType]} />
              <InfoRow label="Kilometraje actual" value={vehicle.currentMileage.toLocaleString("es-AR") + " km"} />
              <InfoRow label="VIN" value={vehicle.vin} />
              <InfoRow label="N° de motor" value={vehicle.engineNumber} />
            </CardContent>
          </Card>

          {/* Titular registral */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Titular registral</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow
                label="Nombre"
                value={`${vehicle.registrationHolderFirstName} ${vehicle.registrationHolderLastName}`}
              />
              <InfoRow
                label="Documento"
                value={`${DocumentTypeLabel[vehicle.registrationHolderDocumentType]} ${vehicle.registrationHolderDocumentNumber}`}
              />
              <InfoRow
                label="N° de cédula verde"
                value={vehicle.registrationCertificateNumber}
              />
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha — 1/3 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Propietario</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {vehicle.customerId ? (
                <div>
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <Link
                    href={`/admin/customers/${vehicle.customerId}`}
                    className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline"
                  >
                    Ver cliente
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : vehicle.fleetId ? (
                <div>
                  <p className="text-xs text-muted-foreground">Flota</p>
                  <Link
                    href={`/admin/fleets/${vehicle.fleetId}`}
                    className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline"
                  >
                    Ver flota
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <p className="text-muted-foreground">Sin propietario asignado.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Órdenes de trabajo</CardTitle>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#fea520] text-[#041627] text-xs font-bold hover:bg-[#865300] hover:text-white transition-all"
              >
                <ClipboardPlus className="w-3.5 h-3.5" />
                Abrir orden
              </button>
            </CardHeader>
            <CardContent>
              <Link
                href={`/admin/work-orders?vehicleId=${vehicle.id}`}
                className="inline-flex items-center gap-1 text-sm text-[#041627] font-medium hover:text-[#fea520] transition-colors"
              >
                Ver órdenes de este vehículo
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
