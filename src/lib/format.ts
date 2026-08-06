export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(amount);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Minutos por jornada laboral. 1 día = 8 hs = 480 min. */
export const MINUTES_PER_WORKDAY = 480;

/**
 * ÚNICO formateador de duraciones de la app — cliente, oficina y mecánico ven lo mismo.
 *
 * Siempre días → horas → minutos, de mayor a menor, salteando lo que da cero:
 *   0    → ""  (el caller chequea y no muestra nada)
 *   45   → "45 min"
 *   120  → "2 h"
 *   150  → "2 h 30 min"
 *   540  → "1 día 1 h"
 *   1000 → "2 días 0 h 40 min" → en realidad "2 días 40 min" (la hora en cero se saltea)
 *
 * Nadie lee "1000 min" y entiende cuánto es. Antes había tres funciones distintas y una
 * redondeaba a "jornadas", así que la misma duración se leía distinto según la pantalla.
 */
export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return "";

  const days   = Math.floor(minutes / MINUTES_PER_WORKDAY);
  const hours  = Math.floor((minutes % MINUTES_PER_WORKDAY) / 60);
  const remMin = minutes % 60;

  const parts: string[] = [];
  if (days > 0)   parts.push(days === 1 ? "1 día" : `${days} días`);
  if (hours > 0)  parts.push(`${hours} h`);
  if (remMin > 0) parts.push(`${remMin} min`);

  return parts.join(" ");
}

/**
 * Etiqueta de la orden tal como la ve el cliente: "#1042".
 *
 * Es el ÚNICO lugar donde se decide cómo se muestra una orden — si mañana el formato
 * cambia (prefijo, año), se cambia acá y no en las seis pantallas que lo usan.
 *
 * El `id` es el fallback para respuestas cacheadas de antes de que existiera `number`.
 * No es el caso normal: un refresh de la página lo resuelve solo.
 */
export function formatOrderNumber(
  order: { number?: number; id?: string } | null | undefined
): string {
  if (!order) return "—";
  if (typeof order.number === "number" && order.number > 0) return `#${order.number}`;
  return order.id ? `#${order.id.slice(0, 8).toUpperCase()}` : "—";
}

