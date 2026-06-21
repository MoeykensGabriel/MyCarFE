import { MaintenanceAlertType } from "@/types/api.types";

/**
 * Presets de alertas de mantenimiento para el ingreso: intervalos sugeridos por tipo
 * (editables por el recepcionista) y cuáles vienen tildados por defecto. El sistema NO
 * calcula según motor/combustible — esto es solo un punto de partida razonable.
 */
export interface AlertPreset {
  type:           MaintenanceAlertType;
  defaultKm?:     number;
  defaultMonths?: number;
  /** Si arranca tildada (los 3 comunes) o el recepcionista la activa a mano. */
  defaultEnabled: boolean;
}

export const MAINTENANCE_ALERT_PRESETS: AlertPreset[] = [
  { type: MaintenanceAlertType.Oil,              defaultKm: 10_000, defaultMonths: 6,  defaultEnabled: true  },
  { type: MaintenanceAlertType.Tires,            defaultKm: 50_000,                    defaultEnabled: true  },
  { type: MaintenanceAlertType.Battery,                             defaultMonths: 36, defaultEnabled: true  },
  { type: MaintenanceAlertType.TimingKit,        defaultKm: 60_000, defaultMonths: 48, defaultEnabled: false },
  { type: MaintenanceAlertType.Transmission,     defaultKm: 60_000,                    defaultEnabled: false },
  { type: MaintenanceAlertType.Differential,     defaultKm: 60_000,                    defaultEnabled: false },
  { type: MaintenanceAlertType.SparkPlugs,       defaultKm: 40_000,                    defaultEnabled: false },
  { type: MaintenanceAlertType.InjectorCleaning, defaultKm: 30_000, defaultMonths: 24, defaultEnabled: false },
];
