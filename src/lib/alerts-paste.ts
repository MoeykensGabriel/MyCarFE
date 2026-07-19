import { MaintenanceAlertType } from "@/types/api.types";

/**
 * Parseo de alertas de mantenimiento pegadas desde la planilla del dueño.
 *
 * Formato acordado (2026-07, puede evolucionar):
 *   nombre | kilometraje | tiempo de vencer
 *
 * Excel copia celdas separadas por TAB y filas por salto de línea. Reglas:
 *   - Nombre: si matchea un tipo conocido (aceite, cubiertas, batería...) se usa
 *     ese tipo (queda agrupado con los presets del ingreso); si no, va como
 *     "Otro" con el nombre como título libre.
 *   - Kilometraje: entero es-AR ("10.000" = 10000). Vacío/— = sin umbral por km.
 *   - Tiempo: en meses. Acepta "6", "6 meses", "6m", "2 años", "1 año", "2a".
 *     Vacío/— = sin umbral por tiempo.
 *   - Cada fila necesita al menos km o tiempo (regla del backend).
 */

export interface ParsedAlertRow {
  type: MaintenanceAlertType;
  /** Título libre — solo para type Other (los tipos conocidos usan su label). */
  title: string | null;
  intervalKm: number | null;
  intervalMonths: number | null;
}

export interface AlertRowResult {
  raw: string;
  data: ParsedAlertRow | null;
  error: string | null;
}

/** Divide una fila pegada en columnas: TAB (Excel) o ";" como fallback. */
function splitColumns(row: string): string[] {
  if (row.includes("\t")) return row.split("\t").map((c) => c.trim());
  if (row.includes(";")) return row.split(";").map((c) => c.trim());
  return [row.trim()];
}

/** minúsculas + sin acentos, para matchear nombres escritos de cualquier forma */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

/** Sinónimos de taller → tipo conocido. Lo que no matchea va como Other. */
const TYPE_SYNONYMS: [RegExp, MaintenanceAlertType][] = [
  [/aceite/, MaintenanceAlertType.Oil],
  [/cubierta|neumatic|goma|llanta/, MaintenanceAlertType.Tires],
  [/bateria/, MaintenanceAlertType.Battery],
  [/distribucion|correa|cadena/, MaintenanceAlertType.TimingKit],
  [/transmision|caja/, MaintenanceAlertType.Transmission],
  [/diferencial/, MaintenanceAlertType.Differential],
  [/bujia/, MaintenanceAlertType.SparkPlugs],
  [/inyector/, MaintenanceAlertType.InjectorCleaning],
];

function matchType(name: string): MaintenanceAlertType | null {
  const n = normalize(name);
  for (const [pattern, type] of TYPE_SYNONYMS) if (pattern.test(n)) return type;
  return null;
}

/** "10.000" / "10000" / "10 000" → 10000. Vacío o "—" → null. Inválido → NaN. */
function parseKm(raw: string): number | null {
  const s = raw.replace(/km/gi, "").replace(/[.\s]/g, "").replace(/[—–-]/g, "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : NaN;
}

/** "6" / "6 meses" / "6m" / "2 años" / "1 año" / "2a" → meses. Vacío/— → null. */
function parseMonths(raw: string): number | null {
  const s = normalize(raw).replace(/[—–]/g, "").trim();
  if (s === "" || s === "-") return null;

  const m = s.match(/^(\d+(?:[.,]\d+)?)\s*(a|año|años|anio|anios|m|mes|meses)?\.?$/);
  if (!m) return NaN;

  const value = Number(m[1].replace(",", "."));
  if (!Number.isFinite(value) || value <= 0) return NaN;

  const unit = m[2] ?? "m"; // sin unidad = meses
  const months = unit.startsWith("a") ? value * 12 : value;
  return Math.round(months);
}

export function parseAlertRows(text: string): AlertRowResult[] {
  return text
    .split(/\r?\n/)
    .map((r) => r.trim())
    .filter((r) => r.length > 0)
    .map((raw): AlertRowResult => {
      const cols = splitColumns(raw);
      const name = cols[0] ?? "";

      if (!name) return { raw, data: null, error: "Falta el nombre de la alerta." };

      const km = parseKm(cols[1] ?? "");
      if (Number.isNaN(km))
        return { raw, data: null, error: `Kilometraje inválido: "${cols[1]}".` };

      const months = parseMonths(cols[2] ?? "");
      if (Number.isNaN(months))
        return { raw, data: null, error: `Tiempo inválido: "${cols[2]}" (usá meses o años).` };

      if (km === null && months === null)
        return { raw, data: null, error: "Necesita al menos kilometraje o tiempo." };

      const type = matchType(name);
      return {
        raw,
        error: null,
        data: {
          type: type ?? MaintenanceAlertType.Other,
          title: type === null ? name.trim() : null,
          intervalKm: km,
          intervalMonths: months,
        },
      };
    });
}
