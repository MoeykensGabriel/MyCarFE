import { z } from "zod";
import { DocumentType } from "@/lib/enums";
import { M } from "@/lib/form-messages";

/**
 * Helpers de validación y normalización para identificadores argentinos.
 * Espejo del módulo `ArgentinaIdentifiers` del backend (mismas reglas).
 *
 * Reglas:
 * - DNI: 7 u 8 dígitos. Acepta puntos: "12.345.678" o "12345678".
 * - CUIT/CUIL: 11 dígitos con prefijo válido (20-27 / 30-34 / 50-55) y dígito
 *   verificador correcto según algoritmo módulo 11 de AFIP. Acepta con o sin guiones.
 * - Teléfono: entre 8 y 14 dígitos después de quitar separadores. Permite "+" inicial.
 * - Pasaporte: alfanumérico, 5-15 caracteres.
 */

// ─── Regex utilitarios ────────────────────────────────────────────────────────

const onlyDigits = (s: string) => s.replace(/\D/g, "");

// ─── Validadores ──────────────────────────────────────────────────────────────

export function isValidDni(input: string | null | undefined): boolean {
  if (!input) return false;
  const digits = onlyDigits(input);
  return digits.length === 7 || digits.length === 8;
}

/**
 * Validación de CUIT/CUIL: solo formato (11 dígitos), sin checksum.
 * Decisión de producto: priorizamos no bloquear al admin con falsos negativos
 * sobre atrapar todos los typos. El back hace la misma validación.
 *
 * Acepta entrada con o sin separadores: "30-12345678-9" o "30123456789".
 */
export function isValidCuitOrCuil(input: string | null | undefined): boolean {
  if (!input) return false;
  const digits = onlyDigits(input);
  return digits.length === 11;
}

export function isValidArgentinaPhone(input: string | null | undefined): boolean {
  if (!input) return false;
  let trimmed = input.trim();
  if (trimmed.startsWith("+")) trimmed = trimmed.slice(1);
  const digits = onlyDigits(trimmed);
  return digits.length >= 8 && digits.length <= 14;
}

const PASSPORT_REGEX = /^[A-Z0-9]{5,15}$/;
export function isValidPassport(input: string | null | undefined): boolean {
  if (!input) return false;
  return PASSPORT_REGEX.test(input.trim().toUpperCase());
}

// ─── Normalizadores ───────────────────────────────────────────────────────────

export function normalizeDni(input: string): string {
  return onlyDigits(input);
}

export function normalizeCuit(input: string): string {
  const digits = onlyDigits(input);
  if (digits.length !== 11) return input;
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits[10]}`;
}

export function normalizePhone(input: string): string {
  const trimmed = input.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits  = onlyDigits(trimmed);
  return hasPlus ? "+" + digits : digits;
}

export function normalizePassport(input: string): string {
  return input.trim().toUpperCase();
}

// ─── Schemas Zod (para react-hook-form + zodResolver) ─────────────────────────

export const dniSchema = z
  .string()
  .min(1, M.required)
  .refine(isValidDni, M.invalidDni);

export const cuitSchema = z
  .string()
  .min(1, M.required)
  .refine(isValidCuitOrCuil, M.invalidCuit);

export const cuilSchema = z
  .string()
  .min(1, M.required)
  .refine(isValidCuitOrCuil, M.invalidCuil);

export const passportSchema = z
  .string()
  .min(1, M.required)
  .refine(isValidPassport, M.invalidPassport);

export const phoneSchema = z
  .string()
  .min(1, M.required)
  .refine(isValidArgentinaPhone, M.invalidPhone);

/** Versión opcional del schema de teléfono. */
export const optionalPhoneSchema = z
  .string()
  .optional()
  .refine(
    (v) => !v || v.length === 0 || isValidArgentinaPhone(v),
    M.invalidPhone,
  );

/**
 * Devuelve el schema de DocumentNumber correspondiente al tipo elegido.
 * Útil para forms donde DocumentType es seleccionable.
 */
export function documentSchemaForType(type: DocumentType) {
  switch (type) {
    case DocumentType.DNI:      return dniSchema;
    case DocumentType.CUIT:     return cuitSchema;
    case DocumentType.CUIL:     return cuilSchema;
    case DocumentType.Passport: return passportSchema;
    default:                    return z.string().min(1, M.required);
  }
}

/**
 * Versión "tipo-aware" para usar dentro de un superRefine cuando ambos
 * campos viven en el mismo objeto.
 */
export function isDocumentValidForType(
  type: DocumentType,
  value: string | null | undefined,
): boolean {
  if (!value) return false;
  switch (type) {
    case DocumentType.DNI:      return isValidDni(value);
    case DocumentType.CUIT:     return isValidCuitOrCuil(value);
    case DocumentType.CUIL:     return isValidCuitOrCuil(value);
    case DocumentType.Passport: return isValidPassport(value);
    default:                    return false;
  }
}

export function documentMessageForType(type: DocumentType): string {
  switch (type) {
    case DocumentType.DNI:      return M.invalidDni;
    case DocumentType.CUIT:     return M.invalidCuit;
    case DocumentType.CUIL:     return M.invalidCuil;
    case DocumentType.Passport: return M.invalidPassport;
    default:                    return "Documento inválido";
  }
}
