import apiClient from "@/lib/axios";
import {
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
  MeResponse,
} from "@/types/api.types";

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(
      "/api/auth/login",
      data
    );
    return response.data;
  },

  me: async (): Promise<MeResponse> => {
    const response = await apiClient.get<MeResponse>("/api/auth/me");
    return response.data;
  },

  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await apiClient.post("/api/auth/change-password", data);
  },

  /**
   * Reset administrativo: el admin genera una nueva contraseña temporal para
   * el usuario indicado (el `userId` es el ApplicationUserId de Identity).
   * Devuelve la pass temporal en claro para que el admin la entregue.
   */
  adminResetPassword: async (
    applicationUserId: string
  ): Promise<{ tempPassword: string }> => {
    const response = await apiClient.post<{ tempPassword: string }>(
      `/api/auth/users/${applicationUserId}/reset-password`
    );
    return response.data;
  },
};
