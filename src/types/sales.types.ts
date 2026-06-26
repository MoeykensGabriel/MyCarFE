// Tipos de Ventas de repuestos "de mostrador" (sin orden ni vehículo).

export interface SaleItem {
  id: string;
  productCode: string | null;
  name: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  customerId: string | null;
  fleetId: string | null;
  buyerName: string;     // resuelto en el backend (cliente/flota)
  sellerUserId: string;
  sellerName: string;    // snapshot del vendedor
  totalAmount: number;
  createdAt: string;
  items: SaleItem[];
}

export interface CreateSaleItemInput {
  productCode?: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface CreateSalePayload {
  customerId?: string;   // cliente XOR flota
  fleetId?: string;
  items: CreateSaleItemInput[];
}

export interface SalesParams {
  customerId?: string;
  fleetId?: string;
  sellerUserId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}
