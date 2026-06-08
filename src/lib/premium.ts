/**
 * Gating de funciones "plus" (premium) del portal del cliente.
 *
 * Hoy están BLOQUEADAS para todos. A futuro, ciertos usuarios las van a tener:
 * cuando exista el entitlement (ej. customer.isPremium / claim en el JWT), este es
 * el ÚNICO lugar a cambiar — devolver true para quienes corresponda.
 */
export type PremiumFeature = "vehicleDocuments" | "vehicleTrips";

export function useHasPremiumFeature(_feature: PremiumFeature): boolean {
  // TODO: reemplazar por el entitlement real por usuario (auth store / backend).
  return false;
}
