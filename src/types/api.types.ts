import {
  DocumentType,
  FuelType,
  PhotoType,
  VehicleBodyType,
  VehicleUseType,
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
}

// ─── Mechanic ─────────────────────────────────────────────────────────────────

export interface Mechanic {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  specialty?: string | null;
  isActive: boolean;
  applicationUserId: string;
  createdAt: string;
  updatedAt: string;
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

export interface WorkOrderPhoto {
  id: string;
  url: string;
  photoType: PhotoType;
  uploadedAt: string;
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
  // Persona que trajo el vehículo (solo para flotas)
  contactPersonName?: string | null;
  contactPersonPhone?: string | null;
  services?: WorkOrderService[];
  photos?: WorkOrderPhoto[];
  timeline?: WorkOrderTimelineEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkOrderRequest {
  vehicleId: string;
  mileageAtEntry?: number;
  customerNote?: string;
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

// ─── Aprobación (público) ─────────────────────────────────────────────────────

export interface ApprovalServiceItem {
  id: string;
  name: string;
  description?: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
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
  expiresAt: string;
  isExpired: boolean;
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
