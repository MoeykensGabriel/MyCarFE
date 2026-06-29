import { MaintenanceAlertType } from "@/types/api.types";

/**
 * Espejo en el front de la lógica de línea base del backend
 * (MaintenanceAlertMappings.IsFactoryMilestone / ResolveBaselineMileage). Sirve para
 * mostrarle al recepcionista, ANTES de guardar, en qué km va a avisar una alerta nueva.
 * El cálculo real lo hace igual el backend; esto es solo para explicar y prevenir sorpresas.
 */

/**
 * Ítems cuyo intervalo de km se cuenta "desde fábrica" (desde 0 km), no desde el último
 * service: transmisión, distribución, diferenciales, bujías. Para estos, al crear la
 * alerta sin saber el último cambio, la línea base se alinea al múltiplo de fábrica más
 * cercano por abajo, así avisa en el próximo hito real.
 */
export function isFactoryMilestone(type: MaintenanceAlertType): boolean {
  return (
    type === MaintenanceAlertType.TimingKit ||
    type === MaintenanceAlertType.Transmission ||
    type === MaintenanceAlertType.Differential ||
    type === MaintenanceAlertType.SparkPlugs
  );
}

/** Múltiplo de fábrica más cercano por abajo del km actual (el "factor de corrección"). */
export function factoryAlignedBaseline(currentMileage: number, intervalKm: number): number {
  if (intervalKm <= 0) return currentMileage;
  return Math.floor(currentMileage / intervalKm) * intervalKm;
}

export interface NextDuePreview {
  /** Km que el sistema tomará como línea base (último cambio o múltiplo de fábrica). */
  baselineKm: number;
  /** Km en el que disparará la alerta. */
  nextDueKm: number;
  /** Km que faltan desde el km actual (≤ 0 = ya corresponde el cambio). */
  kmRemaining: number;
  /** Si la línea base vino del múltiplo de fábrica (true) o del último cambio cargado (false). */
  fromFactory: boolean;
}

/**
 * Próximo km de aviso para una alerta NUEVA de tipo "desde fábrica". Devuelve null si no
 * aplica (no es desde fábrica o no tiene intervalo de km).
 */
export function previewFactoryNextDue(
  type: MaintenanceAlertType,
  intervalKm: number | null | undefined,
  currentMileage: number,
  lastServiceMileage: number | null | undefined,
): NextDuePreview | null {
  if (!isFactoryMilestone(type) || intervalKm == null || intervalKm <= 0) return null;

  const fromFactory = lastServiceMileage == null;
  const baselineKm = fromFactory
    ? factoryAlignedBaseline(currentMileage, intervalKm)
    : lastServiceMileage!;
  const nextDueKm = baselineKm + intervalKm;

  return { baselineKm, nextDueKm, kmRemaining: nextDueKm - currentMileage, fromFactory };
}
