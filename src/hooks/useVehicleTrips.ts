import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { tripStationService, vehicleTripsService } from "@/services/vehicle-trips.service";

export const vehicleTripsKeys = {
  all:        ["vehicle-trips"] as const,
  station:    (token: string) => [...vehicleTripsKeys.all, "station", token] as const,
  byVehicle:  (vehicleId: string) => [...vehicleTripsKeys.all, "by-vehicle", vehicleId] as const,
  openFleet:  () => [...vehicleTripsKeys.all, "open-fleet"] as const,
};

// ── Pública (chofer) ─────────────────────────────────────────────────────────

export function useTripStation(token: string | undefined) {
  return useQuery({
    queryKey: vehicleTripsKeys.station(token ?? ""),
    queryFn:  () => tripStationService.get(token!),
    enabled:  !!token,
    retry:    false,
  });
}

export function useStartTrip(token: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { driverName: string; driverDocument: string; startKm: number }) =>
      tripStationService.start(token, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: vehicleTripsKeys.station(token) });
    },
  });
}

export function useEndTrip(token: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (endKm: number) => tripStationService.end(token, { endKm }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: vehicleTripsKeys.station(token) });
    },
  });
}

// ── Privadas (encargado / admin) ─────────────────────────────────────────────

export function useRegenerateTripToken(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => vehicleTripsService.regenerateToken(vehicleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles", "detail", vehicleId] });
      toast.success("Nuevo QR generado. Imprimilo y pegalo en el vehículo.");
    },
    onError: () => toast.error("No se pudo generar el QR"),
  });
}

export function useVehicleTrips(vehicleId: string | undefined) {
  return useQuery({
    queryKey: vehicleTripsKeys.byVehicle(vehicleId ?? ""),
    queryFn:  () => vehicleTripsService.listByVehicle(vehicleId!),
    enabled:  !!vehicleId,
  });
}

export function useOpenTripsForMyFleet() {
  return useQuery({
    queryKey: vehicleTripsKeys.openFleet(),
    queryFn:  () => vehicleTripsService.openForMyFleet(),
    refetchInterval: 60_000,
  });
}

export function useCloseTripManually() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tripId, endKm }: { tripId: string; endKm: number }) =>
      vehicleTripsService.closeManually(tripId, endKm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: vehicleTripsKeys.all });
      toast.success("Viaje cerrado");
    },
    onError: () => toast.error("No se pudo cerrar el viaje"),
  });
}
