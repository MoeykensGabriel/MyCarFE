import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { AxiosError } from "axios";

import { authService } from "@/services/auth.service";
import { ProblemDetails } from "@/types/api.types";

/**
 * Mutation reutilizable para que el Admin resetee la contraseña de un usuario
 * (Customer o Mechanic) sin saber la actual. Devuelve la nueva contraseña
 * temporal para que la UI la muestre y el admin la copie/comparta.
 *
 * No invalida queries: el reset no cambia ningún dato visible en listados.
 */
export function useAdminResetPassword() {
  return useMutation({
    mutationFn: (applicationUserId: string) =>
      authService.adminResetPassword(applicationUserId),
    onError: (err) => {
      const axiosErr = err as AxiosError<ProblemDetails>;
      toast.error(
        axiosErr.response?.data?.detail ??
          axiosErr.response?.data?.title ??
          "No se pudo resetear la contraseña"
      );
    },
  });
}
