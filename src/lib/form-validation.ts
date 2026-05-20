import { z } from "zod";
import { M } from "./form-messages";

/**
 * Schemas Zod reutilizables. Los identificadores AR viven en
 * `argentina-validation.ts`. Acá están los esquemas genéricos que
 * usan múltiples forms (email, password, año, kilometraje, VIN, patente).
 */

// ─── Email ────────────────────────────────────────────────────────────────────

export const emailSchema = z
  .string()
  .min(1, M.required)
  .email(M.invalidEmail)
  .max(150, M.tooLong(150))
  // Normalizamos a minúsculas en el cliente; el back también lo hace.
  .transform((s) => s.trim().toLowerCase());

/** Versión opcional (campo no requerido pero validado si se completa). */
export const optionalEmailSchema = z
  .string()
  .optional()
  .refine(
    (v) => !v || v.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    { message: M.invalidEmail },
  );

// ─── Contraseña ──────────────────────────────────────────────────────────────
// Reglas reflejadas del back (`AddIdentityCore` en DataLayerExtensions.cs):
//   RequiredLength = 8, RequireDigit = true, RequireUppercase = true.

const PASSWORD_RULES = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export const passwordSchema = z
  .string()
  .min(1, M.required)
  .refine((v) => PASSWORD_RULES.test(v), M.passwordWeak);

// ─── Año del vehículo ────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
export const VEHICLE_YEAR_MIN = 1900;
export const VEHICLE_YEAR_MAX = CURRENT_YEAR + 1;

export const yearSchema = z
  .number({ message: M.notNumber })
  .int(M.invalidYear(VEHICLE_YEAR_MIN, VEHICLE_YEAR_MAX))
  .min(VEHICLE_YEAR_MIN, M.invalidYear(VEHICLE_YEAR_MIN, VEHICLE_YEAR_MAX))
  .max(VEHICLE_YEAR_MAX, M.invalidYear(VEHICLE_YEAR_MIN, VEHICLE_YEAR_MAX));

// ─── Kilometraje ─────────────────────────────────────────────────────────────

export const MILEAGE_MAX = 9_999_999;

export const mileageSchema = z
  .number({ message: M.notNumber })
  .int(M.invalidMileage)
  .min(0, M.invalidMileage)
  .max(MILEAGE_MAX, M.invalidMileage);

// ─── VIN (estándar ISO 3779) ─────────────────────────────────────────────────
// 17 caracteres alfanuméricos, sin I, O ni Q.
const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;

export function isValidVin(value: string | null | undefined): boolean {
  if (!value) return false;
  return VIN_REGEX.test(value.trim());
}

export const vinSchema = z
  .string()
  .min(1, M.required)
  .refine(isValidVin, M.invalidVin);

/** Versión opcional: si está vacío pasa, si tiene contenido se valida. */
export const optionalVinSchema = z
  .string()
  .optional()
  .refine((v) => !v || v.length === 0 || isValidVin(v), M.invalidVin);

// ─── Patente (AR: Mercosur o Nacional) ───────────────────────────────────────

const MERCOSUR_REGEX = /^[A-Z]{2}\d{3}[A-Z]{2}$/;
const NACIONAL_REGEX = /^[A-Z]{3}\d{3}$/;

export function isValidLicensePlate(value: string | null | undefined): boolean {
  if (!value) return false;
  const normalized = value.replace(/\s+/g, "").toUpperCase();
  return MERCOSUR_REGEX.test(normalized) || NACIONAL_REGEX.test(normalized);
}

export const licensePlateSchema = z
  .string()
  .min(1, M.required)
  .refine(isValidLicensePlate, M.invalidLicensePlate);

// ─── Helpers de longitud para nombres / strings comunes ──────────────────────

/** Schema de string con min/max y mensaje opcional para el "requerido". */
export function shortStringSchema(opts: {
  min?: number;
  max: number;
  required?: boolean;
  requiredMessage?: string;
}) {
  const { min = 1, max, required = true, requiredMessage = M.required } = opts;
  let schema = z.string();
  if (required) schema = schema.min(min, requiredMessage);
  schema = schema.max(max, M.tooLong(max));
  return schema;
}
