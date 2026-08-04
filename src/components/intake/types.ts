import { CreateCustomerRequest } from "@/services/customers.service";
import { CreateFleetRequest, CreateVehicleRequest } from "@/types/api.types";

export type IntakeMode    = "particular" | "fleet";
export type CustomerDraft = CreateCustomerRequest;
export type FleetDraft    = CreateFleetRequest;
export type VehicleDraft  = Omit<CreateVehicleRequest, "customerId" | "fleetId"> & {
  customerNote?:       string;
  contactPersonName?:  string;
  contactPersonPhone?: string;
  /** Motivo por el que el cliente trae el vehículo. Obligatorio en S3-14. */
  serviceReason:       string;
  /**
   * El cliente solo quiere saber qué tiene el vehículo: se inspecciona y se le entrega el
   * resultado, sin presupuestar ni arreglar. Si después acepta, la orden se promueve.
   */
  isInspectionOnly?:   boolean;
};

export interface FleetAndContactDraft {
  fleet?:            FleetDraft;    // nueva flota
  existingFleetId?:  string;        // flota existente seleccionada
  contact?:          CustomerDraft; // nuevo contacto (solo para flotas nuevas)
}
