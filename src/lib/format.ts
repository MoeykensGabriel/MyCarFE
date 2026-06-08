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

/**
 * Convierte minutos en una duración legible para el cliente.
 * Casos:
 *   - 0   → "" (el caller debe chequear y no mostrar nada)
 *   - <60 → "30 min"
 *   - múltiplo exacto de 60 → "2 hs"
 *   - mezcla → "1 hs 30 min"
 *
 * Para órdenes largas (>= 8 hs) lo simplificamos a "X jornadas" porque el
 * cliente no piensa en horas continuas y "12 hs" cuando son 2 días confunde.
 */
export function formatEstimatedDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return "";

  if (minutes >= 60 * 8) {
    const days = Math.ceil(minutes / (60 * 8));
    return days === 1 ? "Aprox. 1 jornada" : `Aprox. ${days} jornadas`;
  }

  if (minutes < 60) return `${minutes} min`;

  const hours    = Math.floor(minutes / 60);
  const remMin   = minutes % 60;
  const hoursStr = hours === 1 ? "1 h" : `${hours} hs`;

  return remMin === 0 ? hoursStr : `${hoursStr} ${remMin} min`;
}

/** Minutos por jornada laboral. 1 día = 8 hs = 480 min. */
export const MINUTES_PER_WORKDAY = 480;

/**
 * Formato preciso días + horas para uso interno (taller/admin/mecánico), a
 * diferencia de formatEstimatedDuration que redondea a "jornadas" para el cliente.
 * Ej: 480 → "1d", 960 → "2d", 240 → "4h", 540 → "1d 1h", 45 → "45 min".
 * Devuelve "" para 0/null.
 */
export function formatWorkDuration(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return "";

  const days  = Math.floor(minutes / MINUTES_PER_WORKDAY);
  const hours  = Math.floor((minutes % MINUTES_PER_WORKDAY) / 60);
  const remMin = minutes % 60;

  const parts: string[] = [];
  if (days > 0)  parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (remMin > 0) parts.push(`${remMin} min`);

  return parts.join(" ");
}
