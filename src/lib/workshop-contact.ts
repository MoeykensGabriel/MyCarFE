/**
 * Datos de contacto del taller y helpers para abrir WhatsApp / teléfono / email.
 * Los valores se leen de variables NEXT_PUBLIC_* expuestas al cliente.
 *
 * Si alguna variable está vacía, el helper correspondiente retorna `null`
 * para que la UI pueda decidir no mostrar el botón.
 */

const NAME     = process.env.NEXT_PUBLIC_WORKSHOP_NAME      ?? "";
const WHATSAPP = process.env.NEXT_PUBLIC_WORKSHOP_WHATSAPP ?? "";
const PHONE    = process.env.NEXT_PUBLIC_WORKSHOP_PHONE    ?? "";
const EMAIL    = process.env.NEXT_PUBLIC_WORKSHOP_EMAIL    ?? "";

export const workshop = {
  name:     NAME,
  whatsapp: WHATSAPP,
  phone:    PHONE,
  email:    EMAIL,

  hasWhatsapp: WHATSAPP.length > 0,
  hasPhone:    PHONE.length > 0,
  hasEmail:    EMAIL.length > 0,

  /** Tiene al menos un canal configurado. */
  get hasAnyChannel() {
    return this.hasWhatsapp || this.hasPhone || this.hasEmail;
  },
};

/**
 * Devuelve el link de WhatsApp con mensaje opcional pre-llenado.
 * @example whatsappUrl("Hola, quería consultar sobre mi orden #ABC123.")
 */
export function whatsappUrl(message?: string): string | null {
  if (!workshop.hasWhatsapp) return null;
  // wa.me requiere el número en formato internacional SIN "+"
  const base = `https://wa.me/${workshop.whatsapp}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

/** Link `tel:` para iniciar llamada. */
export function phoneUrl(): string | null {
  if (!workshop.hasPhone) return null;
  return `tel:${workshop.phone}`;
}

/** Link `mailto:` con subject opcional. */
export function emailUrl(subject?: string): string | null {
  if (!workshop.hasEmail) return null;
  const base = `mailto:${workshop.email}`;
  if (!subject) return base;
  return `${base}?subject=${encodeURIComponent(subject)}`;
}

/**
 * Arma un mensaje pre-llenado de WhatsApp para consultar sobre una orden
 * específica. El admin recibe contexto del cliente sin tener que preguntar.
 */
export function buildOrderInquiryMessage(orderId: string, vehicleLabel?: string): string {
  const orderShort = orderId.slice(0, 8).toUpperCase();
  const vehiclePart = vehicleLabel ? ` (${vehicleLabel})` : "";
  return `Hola${workshop.name ? ` ${workshop.name}` : ""}, quería consultar sobre mi orden #${orderShort}${vehiclePart}.`;
}
