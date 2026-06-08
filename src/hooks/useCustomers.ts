import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customersService, CustomersParams, CreateCustomerRequest } from "@/services/customers.service";
import { toast } from "sonner";

export const customerKeys = {
  all: ["customers"] as const,
  lists: () => [...customerKeys.all, "list"] as const,
  list: (params: CustomersParams) => [...customerKeys.lists(), params] as const,
  details: () => [...customerKeys.all, "detail"] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
};

export function useCustomers(params: CustomersParams = {}) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => customersService.getAll(params),
    staleTime: 30_000,
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customersService.getById(id),
    enabled: !!id,
  });
}


export function useSearchCustomers(search: string) {
  return useQuery({
    queryKey: customerKeys.list({ search, pageSize: 8 }),
    queryFn:  () => customersService.getAll({ search, pageSize: 8 }),
    enabled:  search.length >= 2,
    staleTime: 30_000,
  });
}

export function useCustomerMe() {
  return useQuery({
    queryKey: [...customerKeys.all, "me"] as const,
    queryFn: () => customersService.getMe(),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomerRequest) => customersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      toast.success("Cliente creado correctamente");
    },
    onError: () => {
      toast.error("No se pudo crear el cliente");
    },
  });
}
