import apiClient from "@/lib/axios";
import { Customer, PagedResult } from "@/types/api.types";

export interface CustomersParams {
  search?: string;  // nombre, apellido, email, documento
  page?: number;
  pageSize?: number;
}

export interface CreateCustomerRequest {
  firstName: string;
  lastName: string;
  documentType: number;
  documentNumber: string;
  phone: string;
  email: string;
  fleetId?: string;
}


export interface CreateCustomerResponse {
  customer: Customer;
  tempPassword: string;
}

export const customersService = {
  getAll: async (params: CustomersParams = {}): Promise<PagedResult<Customer>> => {
    const response = await apiClient.get<PagedResult<Customer>>("/api/customers", {
      params: { page: 1, pageSize: 20, ...params },
    });
    return response.data;
  },

  getById: async (id: string): Promise<Customer> => {
    const response = await apiClient.get<Customer>(`/api/customers/${id}`);
    return response.data;
  },

  create: async (data: CreateCustomerRequest): Promise<CreateCustomerResponse> => {
    const response = await apiClient.post<CreateCustomerResponse>("/api/customers", data);
    return response.data;
  },

  getMe: async (): Promise<Customer> => {
    const response = await apiClient.get<Customer>("/api/customers/me");
    return response.data;
  },
};
