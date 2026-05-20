/**
 * Mensajes de validación canónicos en español, en un único lugar para que
 * el tono sea consistente en toda la app.
 *
 * Reglas de redacción:
 * - Decir qué falta o qué está mal, no solo "inválido".
 * - Cuando se pueda, dar un ejemplo del formato esperado.
 * - Evitar jerga técnica ("regex", "pattern", etc.).
 * - Tutear al usuario (es la voz que ya usa el resto de la UI).
 */

export const M = {
  // ─── Genéricos ────────────────────────────────────────────────────────────
  required:       "Este campo es obligatorio",
  requiredField:  (field: string) => `${field} es obligatorio`,

  // ─── Strings con longitud ─────────────────────────────────────────────────
  tooShort: (min: number) => `Mínimo ${min} caracteres`,
  tooLong:  (max: number) => `Máximo ${max} caracteres`,

  // ─── Números ──────────────────────────────────────────────────────────────
  notNumber:      "Tiene que ser un número",
  numberTooSmall: (min: number) => `No puede ser menor a ${min}`,
  numberTooLarge: (max: number) => `No puede ser mayor a ${max.toLocaleString("es-AR")}`,
  negativeNotAllowed: "No puede ser negativo",

  // ─── Email ────────────────────────────────────────────────────────────────
  invalidEmail: "Ingresá un email válido. Ej: nombre@empresa.com",

  // ─── Password ─────────────────────────────────────────────────────────────
  passwordWeak:
    "La contraseña debe tener al menos 8 caracteres, 1 mayúscula y 1 número",
  passwordsDoNotMatch: "Las contraseñas no coinciden",
  currentPasswordRequired: "Ingresá tu contraseña actual",

  // ─── Documentos AR ────────────────────────────────────────────────────────
  invalidDni: "El DNI debe tener 7 u 8 dígitos. Ej: 12345678",
  invalidCuit: "El CUIT debe tener 11 dígitos. Ej: 30-12345678-9",
  invalidCuil: "El CUIL debe tener 11 dígitos. Ej: 27-12345678-3",
  invalidPassport:
    "El pasaporte debe ser alfanumérico, entre 5 y 15 caracteres",

  // ─── Teléfono ─────────────────────────────────────────────────────────────
  invalidPhone:
    "El teléfono no es válido. Ej: +54 9 11 1234 5678",

  // ─── Vehículo ────────────────────────────────────────────────────────────
  invalidLicensePlate:
    "Patente inválida. Usá el formato AB123CD (Mercosur) o ABC123 (Nacional)",
  invalidYear: (min: number, max: number) =>
    `El año debe estar entre ${min} y ${max}`,
  invalidMileage:
    "El kilometraje debe estar entre 0 y 9.999.999",
  invalidVin:
    "El VIN debe tener 17 caracteres alfanuméricos (sin las letras I, O ni Q)",
};
