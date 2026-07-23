/**
 * Puente para las credenciales del cliente entre el paso de confirmación del
 * intake y la pantalla de "orden creada", que son rutas distintas.
 *
 * Va por sessionStorage y NO por query param: la contraseña no debe quedar en la
 * URL, ni en el historial del browser, ni en los logs del server. sessionStorage
 * además muere con la pestaña, así que no queda dando vueltas entre clientes.
 */

export interface IntakeCredentials {
  firstName: string;
  /** Usuario de acceso — el mail de contacto que dejó el cliente. */
  email: string;
  phone?: string;
  password: string;
}

const KEY_PREFIX = "intake-credentials:";

const keyFor = (orderId: string) => `${KEY_PREFIX}${orderId}`;

/**
 * Guarda las credenciales recién generadas para la orden.
 * Si el storage falla (modo privado, cuota llena) no rompe el ingreso: la clave
 * siempre se puede regenerar desde la ficha del cliente.
 */
export function stashIntakeCredentials(orderId: string, credentials: IntakeCredentials): void {
  try {
    sessionStorage.setItem(keyFor(orderId), JSON.stringify(credentials));
  } catch (err) {
    console.error("No se pudieron guardar las credenciales para la pantalla siguiente:", err);
  }
}

/** Devuelve las credenciales de la orden, o null si no hay (o si el dato quedó corrupto). */
export function readIntakeCredentials(orderId: string): IntakeCredentials | null {
  try {
    const raw = sessionStorage.getItem(keyFor(orderId));
    return raw ? (JSON.parse(raw) as IntakeCredentials) : null;
  } catch {
    return null;
  }
}

/** Borra las credenciales una vez que ya se las pasaron al cliente. */
export function clearIntakeCredentials(orderId: string): void {
  try {
    sessionStorage.removeItem(keyFor(orderId));
  } catch {
    // Nada que hacer: igual desaparecen al cerrar la pestaña.
  }
}
