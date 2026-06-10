import { z } from "zod";

import { optionalPhoneSchema } from "@/lib/argentina-validation";
import { Mechanic, UpdateMechanicRequest } from "@/types/api.types";

// ─── Schema del alta de mecánico ──────────────────────────────────────────────

export const mechanicSchema = z.object({
  firstName: z.string().min(1, "Ingresá el nombre"),
  lastName:  z.string().min(1, "Ingresá el apellido"),
  email:     z.string().min(1, "Ingresá el email").email("Ingresá un email válido. Ej: nombre@empresa.com"),
  phone:     optionalPhoneSchema,
  specialty: z.string().max(200, "Máximo 200 caracteres").optional(),
  isGeneralist: z.boolean().optional(),
});

export type MechanicForm = z.infer<typeof mechanicSchema>;

// Construye el payload completo de update (FirstName/LastName son obligatorios en el
// backend), aplicando overrides puntuales sobre los datos actuales del mecánico.
export function buildMechanicUpdate(
  m: Mechanic,
  overrides: Partial<UpdateMechanicRequest>,
): UpdateMechanicRequest {
  return {
    firstName:    m.firstName,
    lastName:     m.lastName,
    phone:        m.phone ?? undefined,
    specialty:    m.specialty ?? undefined,
    isActive:     m.isActive,
    isGeneralist: m.isGeneralist,
    ...overrides,
  };
}
