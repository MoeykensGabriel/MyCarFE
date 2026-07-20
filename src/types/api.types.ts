import {
  BatteryStatus,
  BatteryTerminalSide,
  DocumentType,
  FuelType,
  OilServiceStatus,
  PhotoType,
  QuoteItemApprovalStatus,
  SaleCondition,
  TirePosition,
  TireStatus,
  VehicleBodyType,
  VehicleDocumentType,
  VehicleTripStatus,
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
  /** Token público de la estación de viajes (QR). Solo para flota. */
  tripToken?: string | null;
  /** Última lectura de km registrada (cualquier fuente). Null = nunca. */
  mileageUpdatedAt?: string | null;
  /** Días desde la última lectura de km. Null = nunca hubo una. */
  daysSinceMileageUpdate?: number | null;
  /** True si toca actualizar el kilometraje (umbral del taller superado o sin lecturas). */
  mileageUpdateDue?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Lecturas de kilometraje ──────────────────────────────────────────────────

export enum MileageReadingSource {
  WorkshopIntake = 0,
  CustomerReport = 1,
  TripStation = 2,
  AdminAdjustment = 3,
}

export interface VehicleMileageReading {
  id: string;
  mileage: number;
  source: MileageReadingSource;
  createdAt: string;
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
  frozenAt?: string | null;
}

// ─── Area ─────────────────────────────────────────────────────────────────────

export interface Area {
  id: string;
  name: string;
  isActive: boolean;
  /** true = área de cubiertas: el reporte puede incluir datos/mediciones de cubiertas. */
  isTireArea: boolean;
  /** true = área de batería: el reporte puede incluir el estado de la batería. */
  isBatteryArea: boolean;
  /** true = área de aceite: el reporte puede registrar el cambio de aceite/filtros. */
  isOilArea: boolean;
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
  estimatedDurationMinutes?: number | null;
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
  estimatedDurationMinutes?: number | null;
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
  /** true = la oficina omitió la inspección del área — nadie la revisó; queda para la próxima visita */
  isSkipped: boolean;
  /** Motivo de la omisión (obligatorio cuando isSkipped=true) */
  skipReason?: string | null;
  createdAt: string;
  updatedAt: string;
  photos: InspectionReportPhoto[];
  proposedServices: InspectionReportProposedService[];
  proposedParts: InspectionReportProposedPart[];
}

/**
 * Datos de una cubierta cargados por el mecánico del área de cubiertas durante la
 * inspección inicial. Una entrada por posición revisada. Solo aplica si el área
 * tiene isTireArea=true.
 */
export interface TireInspectionInput {
  position: TirePosition;
  innerDepthMm: number;
  centerDepthMm: number;
  outerDepthMm: number;
  brand?: string | null;
  model?: string | null;
  sizeSpec?: string | null;
  initialTreadDepthMm?: number | null;
  expectedLifeKm?: number | null;
  notes?: string | null;
}

/**
 * Estado de batería cargado por el mecánico del área de batería. El estado lo define
 * el mecánico (no se calcula). Solo aplica cuando el área tiene isBatteryArea=true.
 */
export interface BatteryInspectionInput {
  status: BatteryStatus;
  voltage?: number | null;
  remainingPercentage?: number | null; // 0–100
  brand?: string | null;
  installedOn?: string | null; // ISO date (yyyy-MM-dd) — de acá sale la garantía
  notes?: string | null;
  // Specs físicas del repuesto (opcionales).
  capacityAh?: number | null;
  boxWidthCm?: number | null;
  boxLengthCm?: number | null;
  boxHeightCm?: number | null;
  positiveTerminalSide?: BatteryTerminalSide | null;
}

/**
 * Cambio de aceite/filtros cargado por el mecánico del área de aceite (o un generalista).
 * Todo opcional: km/fecha caen a los de ingreso/inspección; intervalos a 10.000 km / 6 meses.
 * Solo aplica cuando el área tiene isOilArea=true.
 */
export interface OilInspectionInput {
  changedAtKm?: number | null;
  changedOn?: string | null; // ISO date (yyyy-MM-dd)
  intervalKm?: number | null;
  intervalMonths?: number | null;
  oilType?: string | null;
  oilBrand?: string | null;
  filterChanged?: boolean | null;
  notes?: string | null;
}

export interface CreateInspectionReportRequest {
  workOrderId: string;
  areaId: string;
  findings?: string;
  hasIssue: boolean;
  proposedServices?: ProposedServiceInput[];
  proposedParts?: ProposedPartInput[];
  tires?: TireInspectionInput[];
  battery?: BatteryInspectionInput;
  oil?: OilInspectionInput;
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

export interface MarkAreaSkippedRequest {
  areaId: string;
  reason: string;
}

/** Área omitida en la última visita de un vehículo (aviso "quedó sin inspeccionar"). */
export interface SkippedInspectionArea {
  workOrderId: string;
  workOrderCreatedAt: string;
  areaId: string;
  areaName: string;
  skipReason: string;
  skippedAt: string;
}

// ─── PendingInspection (vista del mecánico) ───────────────────────────────────

export interface PendingInspectionArea {
  areaId: string;
  areaName: string;
  /** true = área de cubiertas: el reporte puede incluir datos/mediciones de cubiertas. */
  isTireArea: boolean;
  /** true = área de batería: el reporte puede incluir el estado de la batería. */
  isBatteryArea: boolean;
  /** true = área de aceite: el reporte puede registrar el cambio de aceite/filtros. */
  isOilArea: boolean;
}

export interface PendingInspection {
  workOrderId: string;
  workOrderCreatedAt: string;
  serviceReason?: string | null;
  /** Km del vehículo al ingreso. Línea base del cambio de aceite (no editable por el mecánico). */
  mileageAtEntry: number;
  vehicleId: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleLicensePlate: string;
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
  /** true = generalista: puede reportar/trabajar en TODAS las áreas activas. */
  isGeneralist: boolean;
}

export interface CreateMechanicRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialty?: string;
  isGeneralist?: boolean;
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
  /** Agendado del vehículo (ocupación de bahía). Null si no está agendado. */
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  /** Duración total estimada de los servicios (mecánico ?? catálogo) × cantidad, en minutos. */
  totalEstimatedMinutes?: number;
  /** Vencimiento del presupuesto (14 días desde el envío). Null si aún no se envió. */
  quoteExpiresAt?: string | null;
  /**
   * Condición de venta para los repuestos (CC / OC / Contado). La carga la oficina
   * antes de aprobar; viaja al depósito con el pedido. OC → purchaseOrderNumber;
   * Contado → depositAmount (seña, puede ser 0 = "sin seña").
   */
  saleCondition?: SaleCondition | null;
  purchaseOrderNumber?: string | null;
  depositAmount?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface SetSaleConditionRequest {
  condition: SaleCondition | null;
  purchaseOrderNumber?: string | null;
  depositAmount?: number | null;
}

export interface WorkOrderInspectionReportLite {
  id: string;
  areaId: string;
  areaName: string;
  mechanicId?: string | null;
  mechanicFullName?: string | null;
  hasIssue: boolean;
  /** Novedades que reportó el mecánico (visible para el cliente). */
  findings?: string | null;
  createdAt: string;
}

// ─── Repuestos (parts) ────────────────────────────────────────────────────────

export interface WorkOrderPart {
  id: string;
  /** Código de proveedor en GestionPGB. Null = repuesto custom (no va al depósito). */
  productCode: string | null;
  name: string;
  /** Precio de venta unitario (lo que ve y paga el cliente). Lo fija la oficina/admin. */
  unitPrice: number;
  quantity: number;
  /** Subtotal (unitPrice × quantity) — lo que va al PDF y al total. */
  subtotal: number;  approvalStatus: QuoteItemApprovalStatus;
  /** Si tiene valor, el repuesto fue congelado al enviar el presupuesto y no es editable. */
  frozenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AddWorkOrderPartRequest {
  workOrderId: string;
  productCode?: string;
  name: string;
  /** Precio de venta unitario. */
  unitPrice: number;
  quantity: number;}

export interface UpdateWorkOrderPartRequest {
  workOrderId: string;
  partId: string;
  productCode?: string;
  name: string;
  /** Precio de venta unitario. */
  unitPrice: number;
  quantity: number;}

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
}

export interface ApprovalPartItem {
  id: string;
  name: string;
  productCode?: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;}

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
  /** Bahías ocupadas: vehículos presentes (en trabajo o esperando retiro) = InProgress + Completed. */
  vehiclesInShop: number;
  /** Subconjunto: vehículos Completed esperando retiro (ya sin trabajo activo). */
  vehiclesAwaitingPickup: number;
  /** Capacidad física del taller (configurable en datos de la empresa). */
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

// ─── Cubiertas ───────────────────────────────────────────────────────────────

export interface TireWearEstimation {
  currentAverageDepthMm: number;
  status: TireStatus;
  /** mm por km. null si todavía no hay info suficiente para proyectar. */
  wearRateMmPerKm: number | null;
  /** km restantes hasta 3mm (planificar cambio). null si no se puede proyectar. */
  kmRemainingToReplaceSoon: number | null;
  /** km restantes hasta 1.6mm (urgente/ilegal). null si no se puede proyectar. */
  kmRemainingToUrgent: number | null;
  hasIrregularWear: boolean;
  lastMeasuredOn: string | null;
  lastMeasurementId: string | null;
}

export interface VehicleTireMeasurement {
  id: string;
  vehicleTireId: string;
  measuredOn: string;
  vehicleMileageAtMeasurement: number;
  innerDepthMm: number;
  centerDepthMm: number;
  outerDepthMm: number;
  averageDepthMm: number;
  spreadMm: number;
  notes: string | null;
  measuredByUserId: string | null;
  workOrderId: string | null;
  createdAt: string;
}

export interface VehicleTire {
  id: string;
  vehicleId: string;
  position: TirePosition;
  brand: string;
  model: string;
  sizeSpec: string;
  installedOn: string;
  installedAtKm: number;
  initialTreadDepthMm: number;
  expectedLifeKm: number;
  isActive: boolean;
  replacedOn: string | null;
  replacedAtKm: number | null;
  createdAt: string;
  updatedAt: string;
  measurements: VehicleTireMeasurement[];
  estimation: TireWearEstimation;
}

export interface CreateVehicleTireRequest {
  position: TirePosition;
  brand: string;
  model: string;
  sizeSpec: string;
  installedOn: string;       // YYYY-MM-DD
  installedAtKm: number;
  initialTreadDepthMm: number;
  expectedLifeKm: number;
}

export interface AddTireMeasurementRequest {
  measuredOn: string;        // ISO date-time
  vehicleMileageAtMeasurement: number;
  innerDepthMm: number;
  centerDepthMm: number;
  outerDepthMm: number;
  notes?: string | null;
  workOrderId?: string | null;
}

export interface ReplaceTireRequest {
  replacedOn: string;        // YYYY-MM-DD
  replacedAtKm: number;
  newBrand: string;
  newModel: string;
  newSizeSpec: string;
  newInitialTreadDepthMm: number;
  newExpectedLifeKm: number;
}

// ─── Batería ─────────────────────────────────────────────────────────────────

export interface VehicleBatteryCheck {
  id: string;
  vehicleBatteryId: string;
  checkedOn: string;
  vehicleMileageAtCheck: number;
  status: BatteryStatus;
  voltage: number | null;
  remainingPercentage: number | null;
  notes: string | null;
  checkedByUserId: string | null;
  workOrderId: string | null;
  createdAt: string;
}

export interface VehicleBattery {
  id: string;
  vehicleId: string;
  brand: string | null;
  capacityAh: number | null;
  boxWidthCm: number | null;
  boxLengthCm: number | null;
  boxHeightCm: number | null;
  positiveTerminalSide: BatteryTerminalSide | null;
  installedOn: string;
  installedAtKm: number;
  isActive: boolean;
  replacedOn: string | null;
  replacedAtKm: number | null;
  createdAt: string;
  updatedAt: string;
  checks: VehicleBatteryCheck[];
  /** Estado actual derivado del último chequeo (null si no hay chequeos). */
  currentStatus: BatteryStatus | null;
  /** Remanencia (%) del último chequeo (null si no hay o no se cargó). */
  currentRemainingPercentage: number | null;
  lastCheckedOn: string | null;
}

/**
 * Estado del aceite del vehículo: el último cambio + la estimación del próximo service
 * por los dos contadores (km y tiempo). Los campos calculados los resuelve el backend
 * contra el km actual del vehículo y la fecha de hoy.
 */
export interface VehicleOilService {
  id: string;
  vehicleId: string;
  // Último cambio (línea base)
  changedOn: string;       // ISO date
  changedAtKm: number;
  intervalKm: number;
  intervalMonths: number;
  oilType: string | null;
  oilBrand: string | null;
  filterChanged: boolean;
  notes: string | null;
  // Próximo service (calculado)
  nextServiceKm: number;
  nextServiceOn: string;   // ISO date
  // Contexto actual + restantes (pueden ser negativos si está vencido)
  currentMileage: number;
  kmRemaining: number;
  daysRemaining: number;
  status: OilServiceStatus;
  createdAt: string;
}

// ─── Settings (configuración del taller) ─────────────────────────────────────

export interface WorkshopSettings {
  physicalCapacity: number;
  /** Cada cuántos días se recuerda al cliente actualizar el km de sus vehículos. */
  mileageReminderDays: number;
}

export interface UpdateWorkshopSettingsRequest {
  physicalCapacity: number;
  mileageReminderDays: number;
}

// ─── Resumen de mantenimiento (alertas del Inicio) ───────────────────────────

/**
 * Categoría del ítem de mantenimiento. El recepcionista configura, por vehículo,
 * cada cuántos km y/o meses dispara la alerta. Espeja 1:1 al enum del backend.
 */
export enum MaintenanceAlertType {
  Oil = 0,              // Aceite
  Tires = 1,            // Cubiertas
  Battery = 2,          // Batería
  TimingKit = 3,        // Kit de distribución
  Transmission = 4,     // Transmisión
  Differential = 5,     // Diferenciales
  SparkPlugs = 6,       // Bujías
  InjectorCleaning = 7, // Limpieza de inyectores
  Other = 8,            // Otro
}

export const MaintenanceAlertTypeLabel: Record<MaintenanceAlertType, string> = {
  [MaintenanceAlertType.Oil]:              "Aceite",
  [MaintenanceAlertType.Tires]:            "Cubiertas",
  [MaintenanceAlertType.Battery]:          "Batería",
  [MaintenanceAlertType.TimingKit]:        "Kit de distribución",
  [MaintenanceAlertType.Transmission]:     "Transmisión",
  [MaintenanceAlertType.Differential]:     "Diferenciales",
  [MaintenanceAlertType.SparkPlugs]:       "Bujías",
  [MaintenanceAlertType.InjectorCleaning]: "Limpieza de inyectores",
  [MaintenanceAlertType.Other]:            "Otro",
};

export enum MaintenanceAlertSeverity {
  Warning = 0,
  Critical = 1,
}

export interface MaintenanceAlert {
  id: string;
  type: MaintenanceAlertType;
  severity: MaintenanceAlertSeverity;
  vehicleId: string;
  licensePlate: string;
  brand: string;
  model: string;
  /** Etiqueta corta del sistema, ej. "Cubiertas". */
  title: string;
  /** Frase accionable, ej. "Próximo en 1.000 km". */
  detail: string;
}

/** Item de entrada para configurar/editar alertas (PUT). id null = nueva. */
export interface MaintenanceAlertItemInput {
  id?: string | null;
  itemType: MaintenanceAlertType;
  title?: string | null;
  description?: string | null;
  intervalKm?: number | null;
  intervalMonths?: number | null;
  /**
   * Km del último cambio, si el recepcionista lo sabe (override de la línea base al crear
   * una alerta "desde fábrica"). Null = el sistema la infiere alineando al múltiplo de
   * fábrica. Solo aplica al crear, no al editar. Ver lib/maintenance-baseline.
   */
  lastServiceMileage?: number | null;
}

/** Alerta configurada de un vehículo (GET/PUT/reset), con estado calculado. */
export interface MaintenanceAlertConfig {
  id: string;
  itemType: MaintenanceAlertType;
  title: string;
  description?: string | null;
  intervalKm?: number | null;
  intervalMonths?: number | null;
  baselineMileage: number;
  baselineDate: string;
  kmRemaining?: number | null;
  daysRemaining?: number | null;
  severity?: MaintenanceAlertSeverity | null;
  /** Motivo cuando la salud medida manda sobre el contador (ej. batería). Reemplaza al texto de km/tiempo. */
  statusReason?: string | null;
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
  estimatedDurationMinutes?: number | null;
  areaId?: string | null;
  areaName?: string | null;
  mechanicId?: string | null;
  mechanicFullName?: string | null;
  vehicleId: string;
  vehicleLicensePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
}

/** Área (servicio) que necesita un vehículo agendado. */
export interface OccupancyArea {
  areaId: string | null;
  areaName: string | null;
}

/** Una orden (vehículo) ocupando bahía en el calendario de ocupación. */
export interface OccupancySlot {
  workOrderId: string;
  scheduledStart: string;        // ISO
  scheduledEnd: string;          // ISO
  status: WorkOrderStatus;
  vehicleId: string;
  vehicleLicensePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  ownerName?: string | null;
  /** Áreas distintas de los servicios del vehículo (para el tablero por día → servicio). */
  areas: OccupancyArea[];
}

/** Ocupación del taller en un rango: slots por vehículo + capacidad física configurable. */
export interface Occupancy {
  physicalCapacity: number;
  slots: OccupancySlot[];
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
