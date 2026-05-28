import {
  DocumentType,
  FuelType,
  PhotoType,
  QuoteItemApprovalStatus,
  VehicleBodyType,
  VehicleDocumentType,
  VehicleTripStatus,
  VehicleUseType,
  WorkOrderPartTier,
  WorkOrderServiceAssignmentStatus,
  WorkOrderStatus,
} from "@/lib/enums";

// ─── Auth ──────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  role: string;
  userId: string;
  email?: string;
  fullName?: string;
  expiresAt?: string;
  customerId?: string;
  fleetId?: string;
  mechanicId?: string;
}

export interface MeResponse {
  userId: string;
  email: string;
  role: string;
  customerId?: string;
  fleetId?: string;
  mechanicId?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ─── Customer ─────────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  documentType: DocumentType;
  documentNumber: string;
  phone?: string | null;
  email: string;
  applicationUserId: string;
  fleetId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  documentType: DocumentType;
  documentNumber: string;
  fleetId?: string;
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {}

// ─── Fleet ────────────────────────────────────────────────────────────────────

export interface Fleet {
  id: string;
  companyName: string;
  taxId?: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
}

export interface FleetContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  documentType: DocumentType;
  documentNumber: string;
}

export interface FleetVehicleSummary {
  id: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
}

export interface FleetDetail extends Fleet {
  contacts: FleetContact[];
  vehicles: FleetVehicleSummary[];
}

export interface CreateFleetRequest {
  companyName: string;
  taxId: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface UpdateFleetRequest extends Partial<CreateFleetRequest> {}

// ─── Vehicle ──────────────────────────────────────────────────────────────────

export interface Vehicle {
  id: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  vin?: string | null;
  engineNumber?: string | null;
  fuelType: FuelType;
  vehicleBodyType: VehicleBodyType;
  vehicleUseType: VehicleUseType;
  color?: string | null;
  currentMileage: number;
  // Titular registral
  registrationHolderFirstName: string;
  registrationHolderLastName: string;
  registrationHolderDocumentType: DocumentType;
  registrationHolderDocumentNumber: string;
  registrationCertificateNumber?: string | null;
  // Propietario en el sistema
  customerId?: string | null;
  fleetId?: string | null;
  /** Token público de la estación de viajes (QR). Solo para flota. */
  tripToken?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleRequest {
  customerId?: string;
  fleetId?: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  vin?: string;
  engineNumber?: string;
  fuelType: FuelType;
  vehicleBodyType: VehicleBodyType;
  vehicleUseType: VehicleUseType;
  color?: string;
  currentMileage?: number;
  registrationHolderFirstName: string;
  registrationHolderLastName: string;
  registrationHolderDocumentType: DocumentType;
  registrationHolderDocumentNumber: string;
  registrationCertificateNumber?: string;
}

export interface UpdateVehicleRequest extends Partial<CreateVehicleRequest> {}

// ─── Catalog Service ──────────────────────────────────────────────────────────

export interface CatalogService {
  id: string;
  name: string;
  description?: string;
  defaultPrice: number;
  estimatedDurationMinutes: number;
}

export interface CreateCatalogServiceRequest {
  name: string;
  description: string;
  defaultPrice: number;
  estimatedDurationMinutes: number;
}

export interface UpdateCatalogServiceRequest
  extends Partial<CreateCatalogServiceRequest> {}

// ─── Work Order ───────────────────────────────────────────────────────────────

export interface WorkOrderService {
  id: string;
  /** Null cuando es un servicio ad-hoc (puntual, no del catálogo). */
  catalogServiceId: string | null;
  nameSnapshot: string;
  descriptionSnapshot?: string;
  priceSnapshot: number;
  quantity: number;
  subtotal: number;

  /**
   * Duración estimada del servicio (por unidad) según el catálogo actual.
   * Se usa para calcular el ETA total de la orden en el panel del cliente.
   */
  estimatedDurationMinutes: number;

  // Asignación al mecánico
  assignedMechanicId?: string | null;
  assignedMechanicName?: string | null;
  assignmentStatus: WorkOrderServiceAssignmentStatus;
  acceptedAt?: string | null;
  completedAt?: string | null;
  mechanicNotes?: string | null;
  mechanicFindings?: string | null;

  /** Área del taller a la que pertenece. Para emparejar foto antes/después por área. */
  areaId?: string | null;
  areaName?: string | null;

  // Cotización item-by-item (S4-04+)
  approvalStatus?: QuoteItemApprovalStatus;
  alternativeGroupId?: string | null;
  frozenAt?: string | null;
}

// ─── Area ─────────────────────────────────────────────────────────────────────

export interface Area {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateAreaRequest {
  name: string;
}

export interface UpdateAreaRequest {
  id: string;
  name: string;
  isActive: boolean;
}

export interface AssignAreasToMechanicRequest {
  areaIds: string[];
}

// ─── InspectionReport ─────────────────────────────────────────────────────────

export interface InspectionReportPhoto {
  id: string;
  url: string;
  caption?: string | null;
  takenAt: string;
}

export interface InspectionReportProposedService {
  id: string;
  name: string;
  description?: string | null;
  estimatedLaborCost: number;
  estimatedDays?: number | null;
}

export interface InspectionReportProposedPart {
  id: string;
  name: string;
  quantity: number;
  productCode?: string | null;
  estimatedUnitPrice?: number | null;
}

export interface ProposedServiceInput {
  name: string;
  description?: string | null;
  estimatedLaborCost: number;
  estimatedDays?: number | null;
}

export interface ProposedPartInput {
  name: string;
  quantity: number;
  productCode?: string | null;
  estimatedUnitPrice?: number | null;
}

export interface InspectionReport {
  id: string;
  workOrderId: string;
  areaId: string;
  areaName: string;
  mechanicId?: string | null;
  mechanicFullName?: string | null;
  findings?: string | null;
  hasIssue: boolean;
  /** true = el admin marcó el área como "sin hallazgos" (no hay reporte de mecánico) */
  isNoFindings: boolean;
  createdAt: string;
  updatedAt: string;
  photos: InspectionReportPhoto[];
  proposedServices: InspectionReportProposedService[];
  proposedParts: InspectionReportProposedPart[];
}

export interface CreateInspectionReportRequest {
  workOrderId: string;
  areaId: string;
  findings?: string;
  hasIssue: boolean;
  proposedServices?: ProposedServiceInput[];
  proposedParts?: ProposedPartInput[];
}

export interface UpdateInspectionReportRequest {
  id: string;
  findings?: string;
  hasIssue: boolean;
  proposedServices?: ProposedServiceInput[];
  proposedParts?: ProposedPartInput[];
}

export interface MarkAreaNoFindingsRequest {
  areaId: string;
}

// ─── PendingInspection (vista del mecánico) ───────────────────────────────────

export interface PendingInspectionArea {
  areaId: string;
  areaName: string;
}

export interface PendingInspection {
  workOrderId: string;
  workOrderCreatedAt: string;
  serviceReason?: string | null;
  vehicleId: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleLicensePlate: string;
  ownerName?: string | null;
  pendingAreas: PendingInspectionArea[];
}

// ─── Mechanic ─────────────────────────────────────────────────────────────────

export interface Mechanic {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  /** @deprecated Usar `areas` en su lugar. Se conserva por compatibilidad. */
  specialty?: string | null;
  isActive: boolean;
  applicationUserId: string;
  createdAt: string;
  updatedAt: string;
  /** Áreas de especialidad asignadas (M-a-N). Puede venir vacío si el admin no las asignó. */
  areas: Area[];
}

export interface CreateMechanicRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialty?: string;
}

export interface UpdateMechanicRequest extends Partial<CreateMechanicRequest> {
  isActive?: boolean;
}

// ─── Receptionist ─────────────────────────────────────────────────────────────

export interface Receptionist {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  applicationUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReceptionistRequest {
  firstName: string;
  lastName: string;
  email: string;
}

export interface UpdateReceptionistRequest {
  id: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
}

export interface MechanicTask {
  workOrderServiceId: string;
  workOrderId: string;
  vehicleId: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleLicensePlate: string;

  /**
   * Estado actual de la WorkOrder padre. El mecánico solo puede aceptar/completar
   * cuando vale `InProgress`. El back hace la validación final; el front la usa
   * para deshabilitar el botón en otros estados.
   */
  workOrderCurrentStatus: WorkOrderStatus;

  serviceName: string;
  serviceDescription: string;
  quantity: number;

  assignmentStatus: WorkOrderServiceAssignmentStatus;
  acceptedAt?: string | null;
  completedAt?: string | null;

  customerNote?: string | null;
  technicianNote?: string | null;
  mechanicNotes?: string | null;
  mechanicFindings?: string | null;

  updatedAt: string;
}

export interface CompleteServiceRequest {
  notes: string;
  findings?: string;
}

/**
 * Un servicio del pool de trabajos disponibles para el mecánico.
 * Se devuelve desde GET /api/mechanics/me/available-services y se usa en
 * la pantalla /mecanico/disponibles para que el mecánico se auto-asigne.
 */
export interface AvailableService {
  workOrderServiceId: string;
  workOrderId: string;

  serviceName: string;
  serviceDescription?: string | null;
  quantity: number;
  priceSnapshot: number;
  estimatedDurationMinutes: number;

  createdAt: string;

  vehicleId: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleLicensePlate: string;

  ownerName?: string | null;
}

export interface WorkOrderPhoto {
  id: string;
  url: string;
  photoType: PhotoType;
  /** Texto libre que describe la foto. En las 6 fotos del intake = nombre del slot (Frente, Trasera, etc.). */
  caption: string | null;
  takenAt: string;
  /** Si está presente, la foto pertenece a un servicio puntual (subida por el mecánico al cerrar). */
  workOrderServiceId: string | null;
  /** Si está presente, la foto pertenece a un reporte de inspección. */
  inspectionReportId: string | null;
}

/** Entrada del timeline real del backend */
export interface WorkOrderTimelineEntry {
  id: string;
  fromStatus: WorkOrderStatus | null;  // null en la entrada inicial
  toStatus: WorkOrderStatus;
  changedAt: string;
  changedByUserId: string;
  note?: string | null;
}

export interface WorkOrder {
  id: string;
  vehicleId: string;
  // Campos enriquecidos presentes en la lista (pueden faltar en el detalle)
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleLicensePlate?: string;
  ownerName?: string | null;
  // Campos del backend
  customerIdAtEntry?: string | null;
  fleetIdAtEntry?: string | null;
  mileageAtEntry?: number;
  currentStatus: WorkOrderStatus;
  totalAmount: number;
  customerNote?: string | null;
  technicianNote?: string | null;
  /** Motivo por el que el cliente trae el vehículo (texto libre). Obligatorio a partir de S3-14. */
  serviceReason?: string | null;
  // Persona que trajo el vehículo (solo para flotas)
  contactPersonName?: string | null;
  contactPersonPhone?: string | null;
  services?: WorkOrderService[];
  parts?: WorkOrderPart[];
  photos?: WorkOrderPhoto[];
  timeline?: WorkOrderTimelineEntry[];
  /** Reports de inspección (vista liviana) — sirve para emparejar fotos por área. */
  inspectionReports?: WorkOrderInspectionReportLite[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrderInspectionReportLite {
  id: string;
  areaId: string;
  areaName: string;
  mechanicId?: string | null;
  mechanicFullName?: string | null;
  hasIssue: boolean;
}

// ─── Repuestos (parts) ────────────────────────────────────────────────────────

export interface WorkOrderPart {
  id: string;
  /** Código de proveedor en GestionPGB. Null = repuesto custom (no va al depósito). */
  productCode: string | null;
  name: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  tier: WorkOrderPartTier;
  /** Si tiene valor, este repuesto pertenece a un grupo de alternativas (cliente elige uno). */
  alternativeGroupId: string | null;
  approvalStatus: QuoteItemApprovalStatus;
  /** Si tiene valor, el repuesto fue congelado al enviar el presupuesto y no es editable. */
  frozenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AddWorkOrderPartRequest {
  workOrderId: string;
  productCode?: string;
  name: string;
  unitPrice: number;
  quantity: number;
  tier: WorkOrderPartTier;
  alternativeGroupId?: string;
}

export interface UpdateWorkOrderPartRequest {
  workOrderId: string;
  partId: string;
  productCode?: string;
  name: string;
  unitPrice: number;
  quantity: number;
  tier: WorkOrderPartTier;
  alternativeGroupId?: string;
}

export interface CreateWorkOrderRequest {
  vehicleId: string;
  mileageAtEntry?: number;
  customerNote?: string;
  /** Motivo por el que el cliente trae el vehículo. Opcional en BE hasta S3-14; el wizard lo enviará obligatorio. */
  serviceReason?: string;
  // Persona que trajo el vehículo (solo para flotas)
  contactPersonName?: string;
  contactPersonPhone?: string;
}

export interface UpdateWorkOrderStatusRequest {
  workOrderId: string;
  newStatus: WorkOrderStatus;
  note?: string;
}

export interface UpdateWorkOrderNotesRequest {
  workOrderId: string;
  customerNote?: string;
  technicianNote?: string;
}

export interface AddWorkOrderServiceRequest {
  workOrderId: string;
  catalogServiceId: string;
  quantity: number;
}

export interface AddAdHocWorkOrderServiceRequest {
  workOrderId: string;
  name: string;
  description: string;
  price: number;
  estimatedDurationMinutes: number;
  quantity: number;
}

// ─── Aprobación (público y cliente logueado) ──────────────────────────────────

export interface ApprovalServiceItem {
  id: string;
  name: string;
  description?: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  /** Si tiene valor: item pertenece a un grupo de alternativas (cliente elige exactamente uno). */
  alternativeGroupId?: string | null;
}

export interface ApprovalPartItem {
  id: string;
  name: string;
  productCode?: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  tier: WorkOrderPartTier;
  alternativeGroupId?: string | null;
}

export interface ApproveQuotePreview {
  workOrderId: string;
  vehicleLicensePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  customerName: string;
  totalAmount: number;
  services: ApprovalServiceItem[];
  parts: ApprovalPartItem[];
  expiresAt: string;
  isExpired: boolean;
}

/** Payload del POST de aprobación (público vía token o desde el panel logueado). */
export interface ApproveQuotePayload {
  approvedServiceIds: string[];
  approvedPartIds: string[];
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardRecentOrder {
  id: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleLicensePlate?: string;
  ownerName?: string | null;
  currentStatus: WorkOrderStatus;
  totalAmount: number;
  createdAt: string;
}

export interface DashboardOrdersByStatus {
  received: number;
  diagnosing: number;
  awaitingApproval: number;
  approved: number;
  inProgress: number;
  completed: number;
  delivered: number;
  cancelled: number;
}

export interface DashboardMechanicLoad {
  mechanicId: string;
  fullName: string;
  pendingTaskCount: number;
  pendingMinutes: number;
}

export interface DashboardWorkshopLoad {
  /** Vehículos físicamente asociados a órdenes activas. */
  vehiclesInShop: number;
  /** Capacidad física del taller (configurable en appsettings del back). */
  physicalCapacity: number;
  /** Total de minutos pendientes de trabajo en todo el taller. */
  totalPendingMinutes: number;
  /** Carga por mecánico activo, ordenado de menor a mayor. */
  mechanicsLoad: DashboardMechanicLoad[];
}

export interface DashboardExpiringApproval {
  workOrderId: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleLicensePlate: string;
  customerName?: string | null;
  expiresAt: string;
  hoursLeft: number;
}

export interface DashboardTopMechanic {
  mechanicId: string;
  fullName: string;
  completedCount: number;
}

export interface DashboardTopService {
  catalogServiceId: string;
  name: string;
  timesUsed: number;
}

export interface DashboardVehicleToPickup {
  workOrderId: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleLicensePlate: string;
  customerName: string;
  customerPhone?: string | null;
  completedAt: string;
  daysWaiting: number;
}

export interface DashboardStats {
  pendingApprovals: number;
  activeOrders: number;
  ordersByStatus: DashboardOrdersByStatus;
  /** Carga operativa del taller (capacidad, vehículos, mecánicos). */
  workshopLoad: DashboardWorkshopLoad;
  revenueToday: number;
  revenueThisMonth: number;
  ordersToday: number;
  ordersThisWeek: number;
  ordersThisMonth: number;
  recentOrders: DashboardRecentOrder[];
  /** Aprobaciones cuyo token vence en las próximas 24hs. */
  expiringApprovals: DashboardExpiringApproval[];
  /** Top 5 mecánicos por servicios finalizados en el mes. */
  topMechanics: DashboardTopMechanic[];
  /** Top 5 servicios más vendidos del mes. */
  topServices: DashboardTopService[];
  /** Vehículos en Completed esperando que el cliente los retire. */
  vehiclesToPickup: DashboardVehicleToPickup[];
}

// ─── Settings (configuración del taller) ─────────────────────────────────────

export interface WorkshopSettings {
  physicalCapacity: number;
}

export interface UpdateWorkshopSettingsRequest {
  physicalCapacity: number;
}

// ─── Errores RFC 7807 ─────────────────────────────────────────────────────────

export interface ProblemDetails {
  title: string;
  detail?: string;
  status: number;
  errors?: Record<string, string[]>;
}

// ─── Paginación (si el backend la usa) ───────────────────────────────────────

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  totalPages: number;
  page: number;       // el backend usa "page", no "pageNumber"
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ─── Calendario / Schedule ────────────────────────────────────────────────────

export interface ScheduleSlot {
  workOrderServiceId: string;
  workOrderId: string;
  serviceName: string;
  scheduledStart: string;       // ISO
  scheduledEnd: string;         // ISO
  estimatedDays?: number | null;
  areaId?: string | null;
  areaName?: string | null;
  mechanicId?: string | null;
  mechanicFullName?: string | null;
  vehicleId: string;
  vehicleLicensePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
}

// ─── Vehicle Documents (vencimientos) ─────────────────────────────────────────

export interface VehicleDocument {
  id: string;
  vehicleId: string;
  documentType: VehicleDocumentType;
  /** ISO date (YYYY-MM-DD) */
  expiresOn: string;
  notes?: string | null;
  issuingEntity?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleDocumentRequest {
  documentType: VehicleDocumentType;
  expiresOn: string; // YYYY-MM-DD
  notes?: string | null;
  issuingEntity?: string | null;
}

export interface UpdateVehicleDocumentRequest extends CreateVehicleDocumentRequest {}

export interface UpcomingExpiration {
  id: string;
  vehicleId: string;
  vehicleLicensePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  documentType: VehicleDocumentType;
  /** ISO date (YYYY-MM-DD) */
  expiresOn: string;
  daysUntilExpiration: number; // negativo si ya venció
}

// ─── Vehicle Trips (chofer escanea QR) ────────────────────────────────────────

export interface VehicleTrip {
  id: string;
  vehicleId: string;
  vehicleLicensePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  driverName: string;
  driverDocument: string;
  startKm: number;
  endKm?: number | null;
  startedAt: string;
  endedAt?: string | null;
  status: VehicleTripStatus;
}

export interface TripStation {
  vehicleId: string;
  licensePlate: string;
  brand: string;
  model: string;
  lastKnownKm: number;
  openTrip?: VehicleTrip | null;
}

export interface StartTripRequest {
  driverName: string;
  driverDocument: string;
  startKm: number;
}

export interface EndTripRequest {
  endKm: number;
}

export interface RegenerateTripTokenResponse {
  token: string;
}
