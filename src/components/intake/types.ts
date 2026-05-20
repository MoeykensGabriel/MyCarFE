import { CreateCustomerRequest } from "@/services/customers.service";
import { CreateFleetRequest, CreateVehicleRequest } from "@/types/api.types";

export type IntakeMode    = "particular" | "fleet";
export type CustomerDraft = CreateCustomerRequest;
export type FleetDraft    = CreateFleetRequest;
export type VehicleDraft  = Omit<CreateVehicleRequest, "customerId" | "fleetId"> & {
  customerNote?:       string;
  contactPersonName?:  string;
  contactPersonPhone?: string;
};

export interface FleetAndContactDraft {
  fleet?:            FleetDraft;    // nueva flota
  existingFleetId?:  string;        // flota existente seleccionada
  contact?:          CustomerDraft; // nuevo contacto (solo para flotas nuevas)
}
