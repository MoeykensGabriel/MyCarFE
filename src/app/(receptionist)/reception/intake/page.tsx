"use client";

import { useState } from "react";
import { DocumentType } from "@/lib/enums";
import { StepIndicator } from "@/components/intake/StepIndicator";
import { Step0Mode }     from "@/components/intake/Step0Mode";
import { StepCustomer }  from "@/components/intake/StepCustomer";
import { StepFleet }     from "@/components/intake/StepFleet";
import { StepVehicle }   from "@/components/intake/StepVehicle";
import { StepConfirm }   from "@/components/intake/StepConfirm";
import { StepMaintenanceAlerts } from "@/components/intake/StepMaintenanceAlerts";
import { IntakeSummaryPanel } from "@/components/intake/IntakeSummaryPanel";
import { useFleet } from "@/hooks/useFleets";
import { Customer, MaintenanceAlertItemInput } from "@/types/api.types";
import {
  IntakeMode,
  CustomerDraft,
  FleetAndContactDraft,
  VehicleDraft,
} from "@/components/intake/types";

const STEP_TITLES = [
  "¿Qué tipo de ingreso es?",
  "",
  "Datos del vehículo",
  "Alertas de mantenimiento",
  "Revisión final",
];

export default function ReceptionIntakePage() {
  const [mode, setMode] = useState<IntakeMode | null>(null);
  const [step, setStep] = useState(0);

  const [customerDraft,    setCustomerDraft]    = useState<CustomerDraft | undefined>();
  const [existingCustomer, setExistingCustomer] = useState<Customer | undefined>();
  const [fleetAndContact,  setFleetAndContact]  = useState<FleetAndContactDraft | undefined>();
  const [vehicleDraft,     setVehicleDraft]     = useState<VehicleDraft | undefined>();
  const [alertsDraft,      setAlertsDraft]      = useState<MaintenanceAlertItemInput[] | undefined>();

  const steps = mode === "fleet"
    ? ["Empresa", "Vehículo", "Mantenimiento", "Confirmar"]
    : ["Cliente",  "Vehículo", "Mantenimiento", "Confirmar"];

  const stepTitle =
    step === 1
      ? mode === "fleet" ? "Empresa y contacto" : "Datos del cliente"
      : STEP_TITLES[step] ?? "";

  const { data: existingFleet } = useFleet(fleetAndContact?.existingFleetId ?? "");

  let ownerLabel          = "";
  let ownerDocumentType: DocumentType | undefined = undefined;
  let ownerDocumentNumber = "";
  let ownerKind: "customer" | "company" = "customer";

  if (mode === "fleet") {
    ownerKind = "company";
    const fleet = fleetAndContact?.fleet ?? existingFleet;
    ownerLabel          = fleet?.companyName ?? "";
    ownerDocumentType   = fleet ? DocumentType.CUIT : undefined;
    ownerDocumentNumber = fleet?.taxId ?? "";
  } else if (mode === "particular") {
    ownerKind = "customer";
    const customer = existingCustomer ?? customerDraft;
    ownerLabel          = customer
      ? `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim()
      : "";
    ownerDocumentType   = customer ? (customer.documentType as DocumentType) : undefined;
    ownerDocumentNumber = customer?.documentNumber ?? "";
  }

  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#041627]">Nuevo ingreso</h1>
        <p className="text-sm text-[#44474c]/80 mt-1">
          Registrá el cliente, vehículo y abrí la orden de trabajo.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-8 items-start">
        <div className="min-w-0">
          <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden">
            <div className="border-b border-[#c4c6cd]/60 px-6 py-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-[#041627]">{stepTitle}</h2>
                {step > 0 && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70 bg-[#eefcfd] border border-[#c4c6cd] rounded-full px-2.5 py-0.5 shrink-0">
                    Paso {step} de {steps.length}
                  </span>
                )}
              </div>
              {step > 0 && <StepIndicator steps={steps} current={step} />}
            </div>
            <div className="px-6 py-6">
              {step === 0 && (
                <Step0Mode onSelect={(m) => { setMode(m); setStep(1); }} />
              )}

              {step === 1 && mode === "particular" && (
                <StepCustomer
                  defaultValues={customerDraft}
                  onNext={(d) => { setCustomerDraft(d); setExistingCustomer(undefined); setStep(2); }}
                  onSelectExisting={(c) => { setExistingCustomer(c); setCustomerDraft(undefined); setStep(2); }}
                  onBack={() => { setMode(null); setStep(0); }}
                />
              )}

              {step === 1 && mode === "fleet" && (
                <StepFleet
                  defaultValues={fleetAndContact}
                  onNext={(d) => { setFleetAndContact(d); setStep(2); }}
                  onBack={() => { setMode(null); setStep(0); }}
                />
              )}

              {step === 2 && (
                <StepVehicle
                  ownerLabel={ownerLabel}
                  ownerKind={ownerKind}
                  customerDocumentType={ownerDocumentType}
                  customerDocumentNumber={ownerDocumentNumber}
                  defaultValues={vehicleDraft}
                  onNext={(d) => { setVehicleDraft(d); setStep(3); }}
                  onBack={() => setStep(1)}
                />
              )}

              {step === 3 && (
                <StepMaintenanceAlerts
                  ownerLabel={ownerLabel}
                  currentMileage={vehicleDraft?.currentMileage ?? 0}
                  defaultItems={alertsDraft}
                  onNext={(items) => { setAlertsDraft(items); setStep(4); }}
                  onBack={() => setStep(2)}
                />
              )}

              {step === 4 && vehicleDraft && mode && (
                <StepConfirm
                  mode={mode}
                  customerDraft={customerDraft}
                  existingCustomer={existingCustomer}
                  fleetAndContact={fleetAndContact}
                  vehicleDraft={vehicleDraft}
                  maintenanceAlerts={alertsDraft}
                  onBack={() => setStep(3)}
                  successHref={(orderId) => `/reception/intake/created/${orderId}`}
                />
              )}
            </div>
          </div>
        </div>

        <div className="hidden lg:block">
          <IntakeSummaryPanel
            mode={mode}
            customerDraft={customerDraft}
            existingCustomer={existingCustomer}
            fleetAndContact={fleetAndContact}
            existingFleet={existingFleet}
            vehicleDraft={vehicleDraft}
          />
        </div>
      </div>
    </div>
  );
}
