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
