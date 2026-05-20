export enum WorkOrderStatus {
  Received = 0,
  Diagnosing = 1,
  AwaitingApproval = 2,
  InProgress = 3,
  Completed = 4,
  Delivered = 5,
  Cancelled = 6,
  /**
   * El cliente aprobó el presupuesto pero el vehículo todavía no llegó al taller
   * (o el trabajo no arrancó). Paso intermedio entre AwaitingApproval e InProgress.
   * Numerado al final para no romper datos existentes en BD.
   */
  Approved = 7,
}

export enum FuelType {
  Gasoline = 0,
  Diesel = 1,
  Electric = 2,
  Hybrid = 3,
  CNG = 4,
  LPG = 5,
}

export enum VehicleBodyType {
  Sedan = 0,
  Hatchback = 1,
  SUV = 2,
  Pickup = 3,
  Van = 4,
  Coupe = 5,
  Convertible = 6,
  Wagon = 7,
  Truck = 8,
  Motorcycle = 9,
  Other = 10,
}

export enum VehicleUseType {
  Personal = 0,
  Commercial = 1,
  Fleet = 2,
}

export enum DocumentType {
  DNI = 0,
  Passport = 1,
  CUIT = 2,
  CUIL = 3,
}

export enum PhotoType {
  Before = 0,
  After = 1,
}

export enum UserRole {
  Admin = "Admin",
  Customer = "Customer",
  Mechanic = "Mechanic",
  Receptionist = "Receptionist",
}

// ─── Asignación de servicio a mecánico ─────────────────────────────────────────
export enum WorkOrderServiceAssignmentStatus {
  Unassigned = 0,
  Pending    = 1,
  Accepted   = 2,
  Completed  = 3,
}

export const AssignmentStatusLabel: Record<WorkOrderServiceAssignmentStatus, string> = {
  [WorkOrderServiceAssignmentStatus.Unassigned]: "Sin asignar",
  [WorkOrderServiceAssignmentStatus.Pending]:    "Asignado",
  [WorkOrderServiceAssignmentStatus.Accepted]:   "En curso",
  [WorkOrderServiceAssignmentStatus.Completed]:  "Finalizado",
};

// ─── Labels de UI ──────────────────────────────────────────────────────────────

export const WorkOrderStatusConfig: Record<
  WorkOrderStatus,
  { label: string; color: string; customerHint?: string }
> = {
  [WorkOrderStatus.Received]: {
    label: "Recibido",
    color: "gray",
  },
  [WorkOrderStatus.Diagnosing]: {
    label: "En diagnóstico",
    color: "blue",
    customerHint:
      "Estamos revisando tu vehículo. Pronto recibirás un presupuesto por email.",
  },
  [WorkOrderStatus.AwaitingApproval]: {
    label: "Esperando aprobación",
    color: "yellow",
    customerHint: "Tu presupuesto está listo. Revisá tu email para aprobarlo.",
  },
  [WorkOrderStatus.Approved]: {
    label: "Aprobado",
    color: "purple",
    customerHint:
      "¡Aprobaste el presupuesto! Te avisaremos cuando comencemos a trabajar en el vehículo.",
  },
  [WorkOrderStatus.InProgress]: {
    label: "En progreso",
    color: "indigo",
  },
  [WorkOrderStatus.Completed]: {
    label: "Completado",
    color: "green",
  },
  [WorkOrderStatus.Delivered]: {
    label: "Entregado",
    color: "emerald",
  },
  [WorkOrderStatus.Cancelled]: {
    label: "Cancelado",
    color: "red",
  },
};

export const FuelTypeLabel: Record<FuelType, string> = {
  [FuelType.Gasoline]: "Nafta",
  [FuelType.Diesel]: "Diesel",
  [FuelType.Electric]: "Eléctrico",
  [FuelType.Hybrid]: "Híbrido",
  [FuelType.CNG]: "GNC",
  [FuelType.LPG]: "GLP",
};

export const VehicleBodyTypeLabel: Record<VehicleBodyType, string> = {
  [VehicleBodyType.Sedan]: "Sedán",
  [VehicleBodyType.Hatchback]: "Hatchback",
  [VehicleBodyType.SUV]: "SUV",
  [VehicleBodyType.Pickup]: "Pickup",
  [VehicleBodyType.Van]: "Van",
  [VehicleBodyType.Coupe]: "Coupé",
  [VehicleBodyType.Convertible]: "Convertible",
  [VehicleBodyType.Wagon]: "Wagon",
  [VehicleBodyType.Truck]: "Camión",
  [VehicleBodyType.Motorcycle]: "Moto",
  [VehicleBodyType.Other]: "Otro",
};

export const VehicleUseTypeLabel: Record<VehicleUseType, string> = {
  [VehicleUseType.Personal]: "Personal",
  [VehicleUseType.Commercial]: "Comercial",
  [VehicleUseType.Fleet]: "Flota",
};

export const DocumentTypeLabel: Record<DocumentType, string> = {
  [DocumentType.DNI]: "DNI",
  [DocumentType.Passport]: "Pasaporte",
  [DocumentType.CUIT]: "CUIT",
  [DocumentType.CUIL]: "CUIL",
};

export const PhotoTypeLabel: Record<PhotoType, string> = {
  [PhotoType.Before]: "Antes",
  [PhotoType.After]: "Después",
};

/** Transiciones válidas por estado — para deshabilitar opciones en el modal */
export const ValidTransitions: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  [WorkOrderStatus.Received]: [
    WorkOrderStatus.Diagnosing,
    WorkOrderStatus.Cancelled,
  ],
  [WorkOrderStatus.Diagnosing]: [
    WorkOrderStatus.AwaitingApproval,
    WorkOrderStatus.Cancelled,
  ],
  [WorkOrderStatus.AwaitingApproval]: [
    WorkOrderStatus.Approved,
    WorkOrderStatus.InProgress,
    WorkOrderStatus.Cancelled,
  ],
  [WorkOrderStatus.Approved]: [
    WorkOrderStatus.InProgress,
    WorkOrderStatus.Cancelled,
  ],
  [WorkOrderStatus.InProgress]: [
    WorkOrderStatus.Completed,
    WorkOrderStatus.Cancelled,
  ],
  [WorkOrderStatus.Completed]: [
    WorkOrderStatus.Delivered,
    WorkOrderStatus.Cancelled,
  ],
  [WorkOrderStatus.Delivered]: [],
  [WorkOrderStatus.Cancelled]: [],
};

/**
 * Devuelve la config de un status normalizando el valor a número.
 * Útil cuando el backend devuelve el enum como string en el JSON.
 */
export function getWorkOrderStatusConfig(status: WorkOrderStatus | number | string) {
  return (
    WorkOrderStatusConfig[Number(status) as WorkOrderStatus] ??
    WorkOrderStatusConfig[WorkOrderStatus.Received]
  );
}

/** Normaliza un valor de status a WorkOrderStatus numérico */
export function toWorkOrderStatus(value: unknown): WorkOrderStatus {
  return Number(value) as WorkOrderStatus;
}
