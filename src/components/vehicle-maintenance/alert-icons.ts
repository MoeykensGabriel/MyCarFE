import {
  Disc3, Droplet, BatteryWarning, Cog, Settings2, Wrench, Zap, Droplets, Bell,
  type LucideIcon,
} from "lucide-react";
import { MaintenanceAlertType } from "@/types/api.types";

/** Ícono por tipo de alerta de mantenimiento. Compartido entre el Inicio y la ficha. */
export const MAINTENANCE_TYPE_ICON: Record<MaintenanceAlertType, LucideIcon> = {
  [MaintenanceAlertType.Oil]:              Droplet,
  [MaintenanceAlertType.Tires]:            Disc3,
  [MaintenanceAlertType.Battery]:          BatteryWarning,
  [MaintenanceAlertType.TimingKit]:        Cog,
  [MaintenanceAlertType.Transmission]:     Settings2,
  [MaintenanceAlertType.Differential]:     Wrench,
  [MaintenanceAlertType.SparkPlugs]:       Zap,
  [MaintenanceAlertType.InjectorCleaning]: Droplets,
  [MaintenanceAlertType.Other]:            Bell,
};
