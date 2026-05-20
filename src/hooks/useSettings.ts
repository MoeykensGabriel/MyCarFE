import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AxiosError } from "axios";

import { settingsService } from "@/services/settings.service";
import {
  ProblemDetails,
  UpdateWorkshopSettingsRequest,
} from "@/types/api.types";

export const settingsKeys = {
  all:      ["settings"] as const,
  workshop: () => [...settingsKeys.all, "workshop"] as const,
};

export function useWorkshopSettings() {
  return useQuery({
    queryKey: settingsKeys.workshop(),
    queryFn:  () => settingsService.getWorkshop(),
  });
}

export function useUpdateWorkshopSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateWorkshopSettingsRequest) => settingsService.updateWorkshop(data),
    onSuccess: () => {
      // Refresca tanto la query de settings como el dashboard (que muestra capacidad)
      queryClient.invalidateQueries({ queryKey: settingsKeys.workshop() });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Configuración actualizada");
    },
    onError: (err) => {
      const axiosErr = err as AxiosError<ProblemDetails>;
      toast.error(
        axiosErr.response?.data?.detail ??
        axiosErr.response?.data?.title ??
        "No se pudo guardar la configuración",
      );
    },
  });
}
