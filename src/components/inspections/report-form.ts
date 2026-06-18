import { z } from "zod";

import { TirePosition, TirePositionLabel, BatteryStatus, BatteryTerminalSide } from "@/lib/enums";
import {
  TireInspectionInput,
  BatteryInspectionInput,
  OilInspectionInput,
} from "@/types/api.types";

/**
 * Schema, estado y armado de payloads del reporte de inspección del mecánico.
 * Es la única fuente de verdad del form — las secciones (cubiertas, batería,
 * aceite, propuestas) consumen estos tipos y helpers.
 */

// ─── Schema del form ──────────────────────────────────────────────────────────

const proposedServiceSchema = z.object({
  name: z.string().min(1, "Requerido").max(200),
  description: z.string().max(2000).optional(),
  estimatedLaborCost: z.coerce.number().min(0, "Debe ser >= 0"),
  // Duración estimada flexible: días + horas. Se combina a minutos al enviar
  // (1 día laboral = 8 hs = 480 min). Ambos opcionales.
  estimatedDays: z.coerce.number().int().min(0, "Debe ser >= 0").optional(),
  estimatedHours: z.coerce.number().int().min(0, "Debe ser >= 0").max(23, "0–23").optional(),
});

const proposedPartSchema = z.object({
  name: z.string().min(1, "Requerido").max(200),
  quantity: z.coerce.number().int().positive("Debe ser > 0"),
});

export const reportSchema = z
  .object({
    hasIssue: z.boolean(),
    findings: z.string().max(4000, "Máximo 4000 caracteres").optional(),
    proposedServices: z.array(proposedServiceSchema).default([]),
    proposedParts: z.array(proposedPartSchema).default([]),
  })
  .refine((d) => !d.hasIssue || (d.findings && d.findings.trim().length > 0), {
    message: "Describí lo que encontraste cuando marcás que hay un problema.",
    path: ["findings"],
  });

export type ReportFormInput  = z.input<typeof reportSchema>;
export type ReportFormOutput = z.output<typeof reportSchema>;

// ─── Estilos compartidos de campos (mismo look en todas las secciones) ────────

export const fieldLabelCls = "text-[9px] font-bold uppercase tracking-wider text-[#44474c]/70";
export const fieldInputCls = "w-full px-2 py-1.5 text-xs rounded border border-[#041627]/10 bg-white";

// ─── Helpers de conversión input string → número ──────────────────────────────

/** "" → null. Enteros (capacidad Ah, remanencia %, intervalos). */
function toIntOrNull(v: string): number | null {
  const t = v.trim();
  if (t === "") return null;
  const n = Math.round(Number(t));
  return Number.isFinite(n) ? n : null;
}

/** "" → null. Decimales (dimensiones de caja en cm). */
function toDecimalOrNull(v: string): number | null {
  const t = v.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

// ─── Control de cubiertas ──────────────────────────────────────────────────────

export const TIRE_POSITIONS: TirePosition[] = [
  TirePosition.FrontLeft,
  TirePosition.FrontRight,
  TirePosition.RearLeft,
  TirePosition.RearRight,
];

/** Fila editable de cubierta en el form. Campos como string para el input controlado. */
export type TireRow = {
  position: TirePosition;
  inner: string;
  center: string;
  outer: string;
  brand: string;
  model: string;
  sizeSpec: string;
  notes: string;
};

export function createTireRows(): TireRow[] {
  return TIRE_POSITIONS.map((position) => ({
    position,
    inner: "",
    center: "",
    outer: "",
    brand: "",
    model: "",
    sizeSpec: "",
    notes: "",
  }));
}

/**
 * Convierte las filas a payload, tomando solo las que tienen las 3 profundidades cargadas
 * (la medición de 3 puntos es lo mínimo del control). Devuelve un error de validación
 * si alguna fila tiene profundidades a medias.
 */
export function buildTirePayload(
  rows: TireRow[],
): { tires: TireInspectionInput[] } | { error: string } {
  const tires: TireInspectionInput[] = [];

  for (const row of rows) {
    const filled = [row.inner, row.center, row.outer].filter((v) => v.trim() !== "");
    if (filled.length === 0) continue; // posición no revisada → se omite
    if (filled.length < 3) {
      return {
        error: `Completá las 3 profundidades (interior, centro, exterior) de la cubierta ${TirePositionLabel[row.position]}.`,
      };
    }

    tires.push({
      position: row.position,
      innerDepthMm: Number(row.inner),
      centerDepthMm: Number(row.center),
      outerDepthMm: Number(row.outer),
      brand: row.brand.trim() || undefined,
      model: row.model.trim() || undefined,
      sizeSpec: row.sizeSpec.trim() || undefined,
      notes: row.notes.trim() || undefined,
    });
  }

  return { tires };
}

// ─── Control de batería ────────────────────────────────────────────────────────

export type BatteryFormState = {
  status: string;
  voltage: string;
  remainingPercentage: string;
  brand: string;
  installedOn: string;
  notes: string;
  capacityAh: string;
  boxWidthCm: string;
  boxLengthCm: string;
  boxHeightCm: string;
  positiveTerminalSide: string; // "" = sin especificar
};

/**
 * Deriva el estado de la batería a partir de la remanencia medida con tester.
 * Alineado con las bandas de color de la ficha del cliente y con los umbrales de
 * las alertas de mantenimiento: ≥75 Buena · 50–74 Regular · 25–49 Cambiar pronto · <25 Reemplazar.
 * Así el mecánico no puede guardar "Buena con 10%": el estado se fija desde la medición.
 */
export function batteryStatusFromPct(pct: number): BatteryStatus {
  const p = Math.max(0, Math.min(100, pct));
  if (p >= 75) return BatteryStatus.Good;
  if (p >= 50) return BatteryStatus.Fair;
  if (p >= 25) return BatteryStatus.ReplaceSoon;
  return BatteryStatus.Replace;
}

export function createBatteryState(): BatteryFormState {
  return {
    status: String(BatteryStatus.Good),
    voltage: "",
    remainingPercentage: "",
    brand: "",
    installedOn: "",
    notes: "",
    capacityAh: "",
    boxWidthCm: "",
    boxLengthCm: "",
    boxHeightCm: "",
    positiveTerminalSide: "",
  };
}

/**
 * Estado del form → payload. Convierte strings vacíos a null (mandar "" rompe el
 * binding del backend). Capacidad (Ah) y remanencia (%) son enteros; las dimensiones
 * de la caja pueden ser decimales (ej. 17.5 cm).
 */
export function buildBatteryPayload(battery: BatteryFormState): BatteryInspectionInput {
  return {
    status:              Number(battery.status) as BatteryStatus,
    voltage:             battery.voltage.trim() === "" ? null : Number(battery.voltage),
    remainingPercentage: toIntOrNull(battery.remainingPercentage),
    brand:               battery.brand.trim() || null,
    installedOn:         battery.installedOn || null,
    notes:               battery.notes.trim() || null,
    capacityAh:          toIntOrNull(battery.capacityAh),
    boxWidthCm:          toDecimalOrNull(battery.boxWidthCm),
    boxLengthCm:         toDecimalOrNull(battery.boxLengthCm),
    boxHeightCm:         toDecimalOrNull(battery.boxHeightCm),
    positiveTerminalSide: battery.positiveTerminalSide === ""
      ? null
      : (Number(battery.positiveTerminalSide) as BatteryTerminalSide),
  };
}

// ─── Control de aceite ─────────────────────────────────────────────────────────

export type OilFormState = {
  changedOn: string;
  intervalKm: string;
  intervalMonths: string;
  oilType: string;
  oilBrand: string;
  filterChanged: boolean;
  notes: string;
};

export function createOilState(): OilFormState {
  return {
    changedOn: "",
    intervalKm: "10000",
    intervalMonths: "6",
    oilType: "",
    oilBrand: "",
    filterChanged: true,
    notes: "",
  };
}

/**
 * Estado del form → payload. El km del cambio siempre es el del ingreso (línea base):
 * lo resuelve el backend desde MileageAtEntry. La fecha vacía también hereda la del ingreso.
 */
export function buildOilPayload(oil: OilFormState): OilInspectionInput {
  return {
    changedAtKm:    null,
    changedOn:      oil.changedOn || null,
    intervalKm:     toIntOrNull(oil.intervalKm),
    intervalMonths: toIntOrNull(oil.intervalMonths),
    oilType:        oil.oilType.trim() || null,
    oilBrand:       oil.oilBrand.trim() || null,
    filterChanged:  oil.filterChanged,
    notes:          oil.notes.trim() || null,
  };
}
