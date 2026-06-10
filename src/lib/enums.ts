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
  /**
   * Fase de inspección colectiva: mecánicos de cada área reportan sobre el vehículo.
   * Estado inicial de nuevas órdenes a partir de S3-06.
   */
  UnderInspection = 8,
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
  Inspection = 2,
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

// ─── Repuestos / Cotización item-por-item ──────────────────────────────────────

export enum WorkOrderPartTier {
  Generic     = 0,
  Aftermarket = 1,
  Original    = 2,
  Custom      = 3,
}

export const WorkOrderPartTierLabel: Record<WorkOrderPartTier, string> = {
  [WorkOrderPartTier.Generic]:     "Genérico",
  [WorkOrderPartTier.Aftermarket]: "Aftermarket",
  [WorkOrderPartTier.Original]:    "Original",
  [WorkOrderPartTier.Custom]:      "Custom",
};

export enum QuoteItemApprovalStatus {
  Pending  = 0,
  Approved = 1,
  Rejected = 2,
}

export const QuoteItemApprovalStatusLabel: Record<QuoteItemApprovalStatus, string> = {
  [QuoteItemApprovalStatus.Pending]:  "Pendiente",
  [QuoteItemApprovalStatus.Approved]: "Aprobado",
  [QuoteItemApprovalStatus.Rejected]: "Rechazado",
};

// ─── Integración con Sistema de Stock (GestionPGB) ──────────────────────────

export enum StockRequestStatus {
  PendingReview = 0,
  HasShortages  = 1,
  InProgress    = 2,
  Ready         = 3,
}

export const StockRequestStatusLabel: Record<StockRequestStatus, string> = {
  [StockRequestStatus.PendingReview]: "Pendiente de revisión",
  [StockRequestStatus.HasShortages]:  "Con faltantes",
  [StockRequestStatus.InProgress]:    "Comprado / En viaje",
  [StockRequestStatus.Ready]:         "Listo / Entregado",
};

export const StockRequestStatusColor: Record<StockRequestStatus, string> = {
  [StockRequestStatus.PendingReview]: "gray",
  [StockRequestStatus.HasShortages]:  "red",
  [StockRequestStatus.InProgress]:    "blue",
  [StockRequestStatus.Ready]:         "green",
};

export enum StockRequestItemStatus {
  PendingReview = 0,
  Available     = 1,
  Missing       = 2,
  InTransit     = 3,
  Delivered     = 4,
}

export const StockRequestItemStatusLabel: Record<StockRequestItemStatus, string> = {
  [StockRequestItemStatus.PendingReview]: "Pendiente de revisión",
  [StockRequestItemStatus.Available]:     "Disponible en depósito",
  [StockRequestItemStatus.Missing]:       "Falta — a comprar",
  [StockRequestItemStatus.InTransit]:     "En camino",
  [StockRequestItemStatus.Delivered]:     "Entregado al mecánico",
};

export const StockRequestItemStatusColor: Record<StockRequestItemStatus, string> = {
  [StockRequestItemStatus.PendingReview]: "gray",
  [StockRequestItemStatus.Available]:     "indigo",
  [StockRequestItemStatus.Missing]:       "red",
  [StockRequestItemStatus.InTransit]:     "yellow",
  [StockRequestItemStatus.Delivered]:     "green",
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
  [WorkOrderStatus.UnderInspection]: {
    label: "En inspección",
    color: "amber",
    customerHint:
      "Los mecánicos del taller están revisando tu vehículo por áreas. Pronto recibirás el detalle de lo encontrado.",
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
  [PhotoType.Inspection]: "Inspección",
};

/**
 * Transiciones válidas por estado — para el modal genérico de "Cambiar estado".
 *
 * Excepción importante: Diagnosing → AwaitingApproval NO aparece acá a propósito.
 * Esa transición debe ir vía POST /api/work-orders/{id}/send-quote (botón
 * "Enviar presupuesto") porque tiene side effects propios (congelar items,
 * setear QuoteExpiresAt, generar token, mandar email).
 */
export const ValidTransitions: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  [WorkOrderStatus.Received]: [
    WorkOrderStatus.Diagnosing,
    WorkOrderStatus.Cancelled,
  ],
  [WorkOrderStatus.Diagnosing]: [
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
  [WorkOrderStatus.UnderInspection]: [
    WorkOrderStatus.Diagnosing,
    WorkOrderStatus.Cancelled,
  ],
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

// ─── VehicleDocument ─────────────────────────────────────────────────────────

export enum VehicleDocumentType {
  TechnicalInspection = 0,
  Insurance           = 1,
  Registration        = 2,
  EmissionTest        = 3,
  Other               = 99,
}

export const VehicleDocumentTypeLabel: Record<VehicleDocumentType, string> = {
  [VehicleDocumentType.TechnicalInspection]: "VTV / Verificación técnica",
  [VehicleDocumentType.Insurance]:           "Seguro / Póliza",
  [VehicleDocumentType.Registration]:        "Patente / Impuesto automotor",
  [VehicleDocumentType.EmissionTest]:        "Revisión de emisiones",
  [VehicleDocumentType.Other]:               "Otro",
};

export const VehicleDocumentTypeShort: Record<VehicleDocumentType, string> = {
  [VehicleDocumentType.TechnicalInspection]: "VTV",
  [VehicleDocumentType.Insurance]:           "Seguro",
  [VehicleDocumentType.Registration]:        "Patente",
  [VehicleDocumentType.EmissionTest]:        "Emisiones",
  [VehicleDocumentType.Other]:               "Otro",
};

// ─── VehicleTrip ─────────────────────────────────────────────────────────────

export enum VehicleTripStatus {
  Open            = 0,
  Closed          = 1,
  AutoClosed      = 2,
  ClosedByContact = 3,
}

export const VehicleTripStatusLabel: Record<VehicleTripStatus, string> = {
  [VehicleTripStatus.Open]:            "En curso",
  [VehicleTripStatus.Closed]:          "Cerrado",
  [VehicleTripStatus.AutoClosed]:      "Cerrado automáticamente",
  [VehicleTripStatus.ClosedByContact]: "Cerrado por el encargado",
};

// ─── Cubiertas ───────────────────────────────────────────────────────────────

export enum TirePosition {
  FrontLeft  = 0,
  FrontRight = 1,
  RearLeft   = 2,
  RearRight  = 3,
}

export const TirePositionLabel: Record<TirePosition, string> = {
  [TirePosition.FrontLeft]:  "Delantera izquierda",
  [TirePosition.FrontRight]: "Delantera derecha",
  [TirePosition.RearLeft]:   "Trasera izquierda",
  [TirePosition.RearRight]:  "Trasera derecha",
};

/** Abreviatura para los slots posicionales. */
export const TirePositionShort: Record<TirePosition, string> = {
  [TirePosition.FrontLeft]:  "DI",
  [TirePosition.FrontRight]: "DD",
  [TirePosition.RearLeft]:   "TI",
  [TirePosition.RearRight]:  "TD",
};

/** Notación legible para el cliente: "Del. Izq.", "Tras. Der.", etc. */
export const TirePositionNotation: Record<TirePosition, string> = {
  [TirePosition.FrontLeft]:  "Del. Izq.",
  [TirePosition.FrontRight]: "Del. Der.",
  [TirePosition.RearLeft]:   "Tras. Izq.",
  [TirePosition.RearRight]:  "Tras. Der.",
};

export enum TireStatus {
  Healthy     = 0,
  Attention   = 1,
  ReplaceSoon = 2,
  Urgent      = 3,
}

export const TireStatusLabel: Record<TireStatus, string> = {
  [TireStatus.Healthy]:     "Saludable",
  [TireStatus.Attention]:   "Atención",
  [TireStatus.ReplaceSoon]: "Cambiar pronto",
  [TireStatus.Urgent]:      "Urgente",
};

// ─── Batería ─────────────────────────────────────────────────────────────────

export enum BatteryStatus {
  Good        = 0,
  Fair        = 1,
  ReplaceSoon = 2,
  Replace     = 3,
}

export const BatteryStatusLabel: Record<BatteryStatus, string> = {
  [BatteryStatus.Good]:        "Buena",
  [BatteryStatus.Fair]:        "Regular",
  [BatteryStatus.ReplaceSoon]: "Cambiar pronto",
  [BatteryStatus.Replace]:     "Reemplazar",
};

// ─── Aceite / próximo service ─────────────────────────────────────────────────

/** Estado del aceite respecto del próximo service (lo que llegue primero por km o tiempo). */
export enum OilServiceStatus {
  Ok      = 0,
  DueSoon = 1,
  Overdue = 2,
}

export const OilServiceStatusLabel: Record<OilServiceStatus, string> = {
  [OilServiceStatus.Ok]:      "Al día",
  [OilServiceStatus.DueSoon]: "Próximo",
  [OilServiceStatus.Overdue]: "Vencido",
};

/** Lado del borne positivo (+) mirando la batería de frente. */
export enum BatteryTerminalSide {
  Left  = 0,
  Right = 1,
}

export const BatteryTerminalSideLabel: Record<BatteryTerminalSide, string> = {
  [BatteryTerminalSide.Left]:  "Izquierda",
  [BatteryTerminalSide.Right]: "Derecha",
};
