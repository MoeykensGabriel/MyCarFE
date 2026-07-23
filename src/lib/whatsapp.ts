/**
 * Helpers para abrir WhatsApp con un destinatario y un mensaje pre-llenado.
 *
 * Nada de esto manda un mensaje solo: arma el link `wa.me` y la persona confirma
 * el envío desde WhatsApp. Es el canal manual para pasarle las credenciales al
 * cliente mientras el envío automático por mail no sea confiable.
 *
 * Para el número del taller (no de un cliente) está `whatsappUrl` en
 * `workshop-contact.ts`, que lee la variable de entorno.
 */

import { workshop } from "./workshop-contact";

/** Nombre que se usa en los mensajes si no hay NEXT_PUBLIC_WORKSHOP_NAME configurado. */
const FALLBACK_WORKSHOP_NAME = "GB Service";

/**
 * Convierte un teléfono argentino al formato que pide wa.me: 54 + 9 + código de
 * área + abonado, sin "+", sin el 0 de larga distancia y sin el 15.
 *
 * El backend solo normaliza sacando los no-dígitos (ArgentinaIdentifiers
 * .NormalizePhone), así que acá llega cualquier cosa que haya tipeado el
 * mostrador: "0381 15-456-7890", "+54 9 381 4567890", "3814567890".
 *
 * Devuelve null si el número no se puede interpretar con confianza. Mandarle las
 * credenciales a un número inventado es peor que no ofrecer el botón.
 */
export function toWhatsappNumber(raw?: string | null): string | null {
  if (!raw) return null;

  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  // Prefijo de discado internacional: "00 54 ..."
  if (digits.startsWith("00")) digits = digits.slice(2);

  // Código de país, que puede venir con o sin el 9 de celular
  if (digits.startsWith("54")) {
    digits = digits.slice(2);
    if (digits.startsWith("9")) digits = digits.slice(1);
  }

  // 0 de larga distancia nacional
  if (digits.startsWith("0")) digits = digits.slice(1);

  // El 15 de celular va después del código de área (2, 3 o 4 dígitos). Como el
  // número nacional real son siempre 10 dígitos, con el 15 quedan exactamente
  // 12: si tenemos 12, hay un 15 para sacar y solo hay que ubicarlo.
  if (digits.length === 12) {
    const areaLength = [2, 3, 4].find((len) => digits.slice(len, len + 2) === "15");
    if (areaLength === undefined) return null;
    digits = digits.slice(0, areaLength) + digits.slice(areaLength + 2);
  }

  // Todo número nacional argentino son 10 dígitos (área + abonado)
  if (digits.length !== 10) return null;

  return `549${digits}`;
}

/**
 * Link de WhatsApp a un destinatario puntual con mensaje pre-llenado.
 * Devuelve null si el teléfono no se pudo interpretar — ver `toWhatsappNumber`.
 */
export function whatsappUrlTo(phone: string | null | undefined, message: string): string | null {
  const number = toWhatsappNumber(phone);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

interface CredentialsMessageOptions {
  /** Nombre de pila del cliente. Si falta, el saludo va sin nombre. */
  firstName?: string;
  /** Usuario de acceso — es el mail que dejó como contacto. */
  email: string;
  password: string;
  /** URL absoluta del login, ej: "https://armeniotuc.com/login". */
  loginUrl: string;
  /** true = la clave viene de un reseteo; false/undefined = cuenta recién creada. */
  isReset?: boolean;
}

/**
 * Arma el mensaje con las credenciales de acceso.
 *
 * Texto plano a propósito: sin emojis y sin los asteriscos de negrita de
 * WhatsApp. Siempre incluye el usuario, que además le recuerda al cliente con
 * qué correo quedó registrado.
 */
export function buildCredentialsMessage({
  firstName,
  email,
  password,
  loginUrl,
  isReset,
}: CredentialsMessageOptions): string {
  const name  = firstName?.trim();
  const greet = name ? `Hola ${name}, ¿cómo estás?` : "Hola, ¿cómo estás?";
  const brand = workshop.name || FALLBACK_WORKSHOP_NAME;

  const intro = isReset
    ? `Restablecimos la contraseña de tu cuenta en ${brand}.`
    : `Ya creamos tu cuenta en ${brand}, desde donde vas a poder seguir el estado de tu vehículo y ver los presupuestos.`;

  return [
    greet,
    "",
    intro,
    "",
    "Estos son tus datos de acceso:",
    `Usuario: ${email}`,
    `Contraseña: ${password}`,
    "",
    `El usuario es el correo que dejaste como contacto. Podés ingresar desde ${loginUrl} y te recomendamos cambiar la contraseña la primera vez que entres.`,
    "",
    "Cualquier consulta quedamos a disposición. Saludos.",
  ].join("\n");
}

interface QuoteMessageOptions {
  /** Nombre de pila de quien recibe. Si falta, el saludo va sin nombre. */
  firstName?: string;
  /** Ej: "Fiat Cronos". */
  vehicleLabel: string;
  licensePlate?: string | null;
  /** Link de aprobación (`/approve?token=...`). */
  approvalLink: string;
  /** true = el presupuesto ya se había mandado y esto es una insistencia. */
  isResend?: boolean;
  /** true = orden de flota: el mensaje va a la empresa, no al dueño del auto. */
  isFleet?: boolean;
}

/**
 * Aviso de que el presupuesto está listo, con el link para verlo y aprobarlo.
 *
 * A propósito NO lleva el total ni el detalle de ítems: el monto va en la página
 * de aprobación, al lado de los trabajos que lo justifican. Un número suelto en un
 * chat invita a discutir el precio sin ver qué incluye, y diez repuestos listados
 * hacen un mensaje ilegible.
 */
export function buildQuoteMessage({
  firstName,
  vehicleLabel,
  licensePlate,
  approvalLink,
  isResend,
  isFleet,
}: QuoteMessageOptions): string {
  const name  = firstName?.trim();
  const greet = name ? `Hola ${name}, ¿cómo estás?` : "Hola, ¿cómo estás?";

  // En flotas el mensaje va al contacto de la empresa, no al dueño del auto.
  const vehicle = [isFleet ? "el" : "tu", vehicleLabel].join(" ")
    + (licensePlate ? ` (${licensePlate})` : "");

  const intro = isResend
    ? `Te paso de nuevo el presupuesto para ${vehicle}, por si no te llegó.`
    : `Ya está listo el presupuesto para ${vehicle}.`;

  return [
    greet,
    "",
    intro,
    "",
    "Podés verlo en detalle y aprobarlo desde este link:",
    approvalLink,
    "",
    "En esa página vas a ver cada servicio y repuesto con su precio, y podés elegir cuáles autorizás.",
    "",
    "Cualquier consulta quedamos a disposición. Saludos.",
  ].join("\n");
}
