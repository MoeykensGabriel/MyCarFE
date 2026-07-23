"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Info, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { AxiosError } from "axios";
import { DocumentType, DocumentTypeLabel } from "@/lib/enums";
import { Customer, MaintenanceAlertItemInput, ProblemDetails } from "@/types/api.types";

/** Saca el mensaje de error más útil de una respuesta del backend. */
function extractApiError(err: unknown): string | undefined {
  const axiosErr = err as AxiosError<ProblemDetails>;
  return (
    axiosErr.response?.data?.detail ??
    axiosErr.response?.data?.title ??
    (err instanceof Error ? err.message : undefined)
  );
}

/**
 * El intake usa X-Skip-Auth-Redirect para manejar fallos PARCIALES sin perder el
 * form — pero eso también silenciaba la sesión vencida (401), que terminaba como
 * error crudo en el resumen. Un 401 acá no es recuperable: avisamos y vamos al
 * login (misma limpieza que el interceptor global de axios).
 */
function redirectIfSessionExpired(err: unknown): boolean {
  if ((err as AxiosError).response?.status !== 401) return false;
  toast.error("Tu sesión expiró. Volvé a ingresar para continuar.");
  localStorage.removeItem("token");
  localStorage.removeItem("auth-storage");
  window.location.href = "/login";
  return true;
}
import { customersService } from "@/services/customers.service";
import { vehiclesService } from "@/services/vehicles.service";
import { fleetsService } from "@/services/fleets.service";
import { workOrdersService } from "@/services/work-orders.service";
import { maintenanceAlertsService } from "@/services/maintenance-alerts.service";
import { IntakeCredentials, stashIntakeCredentials } from "@/lib/intake-credentials";
import { StepNav, Tag, SummaryItem } from "./ui";
import { IntakeMode, CustomerDraft, FleetAndContactDraft, VehicleDraft } from "./types";

/** Datos de acceso del cliente recién creado, listos para pasárselos por WhatsApp. */
function buildCredentials(draft: CustomerDraft, password: string): IntakeCredentials {
  return {
    firstName: draft.firstName,
    email:     draft.email,
    phone:     draft.phone,
    password,
  };
}

interface Props {
  mode:              IntakeMode;
  customerDraft?:    CustomerDraft;
  existingCustomer?: Customer;
  fleetAndContact?:  FleetAndContactDraft;
  vehicleDraft:      VehicleDraft;
  /** Alertas de mantenimiento configuradas en el paso previo (se guardan tras crear el vehículo). */
  maintenanceAlerts?: MaintenanceAlertItemInput[];
  onBack:            () => void;
  /** Builder del href post-creación. Si no se provee, va al detalle de admin. */
  successHref?:      (orderId: string) => string;
}

export function StepConfirm({
  mode,
  customerDraft,
  existingCustomer,
  fleetAndContact,
  vehicleDraft,
  maintenanceAlerts,
  onBack,
  successHref,
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

    const skipAuthHeader = { headers: { "X-Skip-Auth-Redirect": "true" } };

    try {
      let vehicleOwner: { customerId?: string; fleetId?: string };
      let createdCustomerId: string | undefined;
      // Credenciales del usuario recién creado. Se muestran en la pantalla
      // siguiente para poder pasárselas al cliente por WhatsApp — el mail de
      // bienvenida sale igual, pero no siempre llega.
      let credentials: IntakeCredentials | undefined;

      // ── Paso 1: crear cliente / flota ──────────────────────────────────────
      // Si esto falla no hay nada que recuperar: lo maneja el catch general abajo.
      if (mode === "particular" && existingCustomer) {
        // Cliente ya existe: usar su ID directamente. No hay usuario nuevo,
        // así que tampoco hay credenciales para pasarle.
        createdCustomerId = existingCustomer.id;
        vehicleOwner      = { customerId: existingCustomer.id };
      } else if (mode === "particular") {
        const { customer, tempPassword } = await customersService.create(customerDraft!, skipAuthHeader);
        createdCustomerId  = customer.id;
        vehicleOwner       = { customerId: customer.id };
        credentials        = buildCredentials(customerDraft!, tempPassword);
      } else if (fleetAndContact!.existingFleetId && !fleetAndContact!.contact) {
        // Flota existente sin contacto nuevo: el vehículo va directo a la flota
        vehicleOwner = { fleetId: fleetAndContact!.existingFleetId };
      } else {
        // Flota nueva (o existente con contacto nuevo)
        const fleetId =
          fleetAndContact!.existingFleetId ??
          (await fleetsService.create(fleetAndContact!.fleet!, skipAuthHeader));
        const contactDraft = fleetAndContact!.contact!;
        const { customer, tempPassword } = await customersService.create({ ...contactDraft, fleetId }, skipAuthHeader);
        createdCustomerId  = customer.id;
        vehicleOwner       = { fleetId };
        credentials        = buildCredentials(contactDraft, tempPassword);
      }

      // ── Paso 2: crear vehículo ─────────────────────────────────────────────
      // El cliente/flota ya se creó: si el vehículo falla, ofrecemos retomarlo
      // desde la ficha del cliente en vez de perder lo hecho.
      let createdVehicleId: string;
      try {
        const vehicle    = await vehiclesService.create({ ...vehicleDraft, ...vehicleOwner }, skipAuthHeader);
        createdVehicleId = vehicle.id;
      } catch (err) {
        if (redirectIfSessionExpired(err)) return;
        console.error("Falló la creación del vehículo:", err);
        setPartialError({
          message:
            extractApiError(err) ??
            "El cliente se registró, pero no se pudo crear el vehículo. Podés agregarlo desde la ficha del cliente.",
          customerId: createdCustomerId,
        });
        return;
      }

      // ── Paso 3: crear orden ────────────────────────────────────────────────
      // Vehículo y cliente ya existen: si la orden falla, ofrecemos abrirla
      // desde la ficha del vehículo.
      let order: { id: string };
      try {
        order = await workOrdersService.create({
          vehicleId:          createdVehicleId,
          mileageAtEntry:     vehicleDraft.currentMileage,
          customerNote:       vehicleDraft.customerNote?.trim() || undefined,
          contactPersonName:  vehicleDraft.contactPersonName?.trim() || undefined,
          contactPersonPhone: vehicleDraft.contactPersonPhone?.trim() || undefined,
          serviceReason:      vehicleDraft.serviceReason?.trim() || undefined,
        }, skipAuthHeader);
      } catch (err) {
        if (redirectIfSessionExpired(err)) return;
        console.error("Falló la creación de la orden de trabajo:", err);
        setPartialError({
          message:
            extractApiError(err) ??
            "El cliente y el vehículo se registraron, pero no se pudo abrir la orden. Podés abrirla desde la ficha del vehículo.",
          vehicleId: createdVehicleId,
        });
        return;
      }

      toast.success("Orden de trabajo creada correctamente");

      // Las credenciales viajan por sessionStorage hasta la pantalla de "orden
      // creada", que es otra ruta. Nunca por la URL.
      if (credentials) stashIntakeCredentials(order.id, credentials);

      // Alertas de mantenimiento configuradas en el ingreso. No bloquean el flujo:
      // si fallan, se pueden cargar/editar después desde la ficha del vehículo.
      if (maintenanceAlerts && maintenanceAlerts.length > 0) {
        try {
          await maintenanceAlertsService.set(createdVehicleId, maintenanceAlerts, skipAuthHeader);
        } catch (err) {
          console.error("No se pudieron guardar las alertas de mantenimiento:", err);
          toast.error(
            "La orden se creó, pero no se pudieron guardar las alertas. Configuralas desde la ficha del vehículo.",
          );
        }
      }

      router.push(successHref ? successHref(order.id) : `/admin/work-orders/${order.id}`);
    } catch (err) {
      if (redirectIfSessionExpired(err)) return;
      // Falla en el paso 1 (cliente / flota) o algo inesperado: nada que recuperar.
      console.error("Falló el ingreso:", err);
      const message =
        extractApiError(err) ??
        "No se pudo completar el ingreso. Revisá los datos e intentá de nuevo.";
      toast.error(message);
      setPartialError({ message });
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        <div className="px-4 py-4 bg-white grid grid-cols-1 sm:grid-cols-2 gap-3">
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

      {/* Motivo de visita (obligatorio) */}
      {vehicleDraft.serviceReason?.trim() && (
        <div className="rounded-lg border border-[#c4c6cd] overflow-hidden">
          <div className="bg-[#041627] px-4 py-2.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/60">
              Motivo de visita
            </span>
          </div>
          <div className="px-4 py-4 bg-white">
            <p className="text-sm text-[#041627] whitespace-pre-wrap">{vehicleDraft.serviceReason}</p>
          </div>
        </div>
      )}

      {/* Nota adicional opcional */}
      {vehicleDraft.customerNote?.trim() && (
        <div className="rounded-lg border border-[#c4c6cd] overflow-hidden">
          <div className="bg-[#44474c] px-4 py-2.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/60">
              Nota adicional
            </span>
          </div>
          <div className="px-4 py-4 bg-white">
            <p className="text-sm text-[#041627] whitespace-pre-wrap">{vehicleDraft.customerNote}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 rounded-md bg-[#fea520]/8 border border-[#fea520]/20 px-4 py-3">
        <Info className="w-4 h-4 text-[#fea520] shrink-0" />
        <p className="text-sm text-[#44474c]">
          Al confirmar se crea todo de una vez. La orden quedará en estado{" "}
          <span className="font-semibold text-[#041627]">En inspección</span> y los mecánicos
          podrán reportar sobre sus áreas.
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
