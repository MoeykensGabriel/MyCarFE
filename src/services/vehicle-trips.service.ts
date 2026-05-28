import apiClient from "@/lib/axios";
import type {
  EndTripRequest,
  RegenerateTripTokenResponse,
  StartTripRequest,
  TripStation,
  VehicleTrip,
} from "@/types/api.types";

// ── Endpoints públicos (chofer escanea QR, sin login) ────────────────────────

export const tripStationService = {
  get: async (token: string): Promise<TripStation> => {
    const r = await apiClient.get<TripStation>(`/api/public/trip-stations/${token}`);
    return r.data;
  },
  start: async (token: string, data: StartTripRequest): Promise<VehicleTrip> => {
    const r = await apiClient.post<VehicleTrip>(`/api/public/trip-stations/${token}/start`, data);
    return r.data;
  },
  end: async (token: string, data: EndTripRequest): Promise<VehicleTrip> => {
    const r = await apiClient.post<VehicleTrip>(`/api/public/trip-stations/${token}/end`, data);
    return r.data;
  },
};

// ── Endpoints privados (encargado / admin) ───────────────────────────────────

export const vehicleTripsService = {
  regenerateToken: async (vehicleId: string): Promise<RegenerateTripTokenResponse> => {
    const r = await apiClient.post<RegenerateTripTokenResponse>(
      `/api/vehicles/${vehicleId}/trip-token/regenerate`,
    );
    return r.data;
  },
  listByVehicle: async (vehicleId: string): Promise<VehicleTrip[]> => {
    const r = await apiClient.get<VehicleTrip[]>(`/api/vehicles/${vehicleId}/trips`);
    return r.data;
  },
  openForMyFleet: async (): Promise<VehicleTrip[]> => {
    const r = await apiClient.get<VehicleTrip[]>(`/api/fleets/mine/open-trips`);
    return r.data;
  },
  closeManually: async (tripId: string, endKm: number): Promise<VehicleTrip> => {
    const r = await apiClient.post<VehicleTrip>(`/api/trips/${tripId}/close`, { endKm });
    return r.data;
  },
};
