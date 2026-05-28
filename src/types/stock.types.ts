import { StockRequestItemStatus, StockRequestStatus } from "@/lib/enums";

export interface StockRequestItem {
  id:              string;
  workOrderPartId: string;
  productCode:     string;
  name:            string;
  quantity:        number;
  status:          StockRequestItemStatus;
  notes:           string | null;
  updatedAt:       string;
}

export interface StockRequest {
  id:                string;
  workOrderId:       string;
  licensePlate:      string;
  externalReference: string | null;
  status:            StockRequestStatus;
  createdAt:         string;
  updatedAt:         string;
  vehicleBrand:      string | null;
  vehicleModel:      string | null;
  items:             StockRequestItem[];
}

export interface StockRequestsParams {
  status?:       StockRequestStatus;
  licensePlate?: string;
}

export interface UpdateStockItemPayload {
  status: StockRequestItemStatus;
  notes?: string;
}
