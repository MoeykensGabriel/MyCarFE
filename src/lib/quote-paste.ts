/**
 * Parser de ítems del presupuesto pegados DESDE la planilla del dueño (repuestos y servicios).
 *
 * Regla del taller: al armar el presupuesto NO se tipea código/descripción/precio (ahí se
 * cometen errores, sobre todo con el precio). Se copia una o varias filas de la planilla y se
 * pegan acá. Este módulo es puro (sin React ni red): convierte el texto pegado en filas
 * validadas para previsualizar antes de confirmar.
 *
 * Formato del dueño (una fila por ítem):
 *   - Repuesto: código · descripción · precio
 *   - Servicio: nombre  · descripción · precio
 * La cantidad NO viene en la planilla: arranca en 1 y se ajusta en el preview.
 *
 * Delimitador: al copiar celdas de Excel/Sheets el portapapeles trae las columnas separadas
 * por TAB (no por " - "). Priorizamos TAB y toleramos ";" y " - " como respaldo. El precio es
 * SIEMPRE la última columna y el identificador la primera; la descripción es lo del medio
 * (así una descripción con guiones no rompe el parseo).
 */

export type PasteKind = "part" | "service";

export interface ParsedPartRow {
  productCode: string; // código de proveedor (puede quedar vacío → repuesto custom)
  name: string;        // la "descripción" de la planilla es el nombre visible del repuesto
  unitPrice: number;
  quantity: number;
}

export interface ParsedServiceRow {
  name: string;
  description: string;
  price: number;
  quantity: number;
}

interface RowOk<T> {
  ok: true;
  raw: string;
  value: T;
}

interface RowError {
  ok: false;
  raw: string;
  error: string;
}

export type PartRowResult = RowOk<ParsedPartRow> | RowError;
export type ServiceRowResult = RowOk<ParsedServiceRow> | RowError;

/**
 * Parsea un precio en formato es-AR (coma decimal, punto de miles) y también tolera formatos
 * simples. Devuelve `null` si no se puede interpretar como número válido.
 *
 * Casos:
 *   "12.500,50" → 12500.5   (punto miles + coma decimal)
 *   "1.250.000" → 1250000   (varios puntos = miles)
 *   "12.500"    → 12500     (un punto con 3 decimales = miles, uso es-AR)
 *   "12,5"      → 12.5      (coma decimal)
 *   "12.5"      → 12.5      (un punto con 1-2 decimales = decimal)
 *   "$ 8.900"   → 8900      (saca símbolo y espacios)
 */
export function parsePastedPrice(raw: string): number | null {
  let s = (raw ?? "").trim();
  if (!s) return null;

  // Saca símbolos de moneda, espacios (incluye no-break space) y cualquier cosa que no
  // sea dígito, punto, coma o signo.
  s = s.replace(/[^0-9.,-]/g, "");
  if (!s || !/[0-9]/.test(s)) return null;

  const negative = s.startsWith("-");
  s = s.replace(/-/g, "");

  const commaCount = (s.match(/,/g) ?? []).length;
  const dotCount = (s.match(/\./g) ?? []).length;
  if (commaCount > 1 && dotCount === 0) return null; // "1,2,3" no es un número

  let normalized: string;

  if (commaCount > 0 && dotCount > 0) {
    // es-AR: puntos = miles, coma = decimal. Si hay más de una coma, es inválido.
    if (commaCount > 1) return null;
    normalized = s.replace(/\./g, "").replace(",", ".");
  } else if (commaCount > 0) {
    // Solo coma → separador decimal.
    normalized = s.replace(",", ".");
  } else if (dotCount > 0) {
    // Solo punto(s): decidir si es miles o decimal.
    const lastDot = s.lastIndexOf(".");
    const decimals = s.length - lastDot - 1;
    if (dotCount > 1 || decimals === 3) {
      normalized = s.replace(/\./g, ""); // miles: "1.250.000" / "12.500"
    } else {
      normalized = s; // decimal: "12.5" / "12.50"
    }
  } else {
    normalized = s; // solo dígitos
  }

  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  return negative ? -value : value;
}

/** Detecta el separador de columnas del bloque pegado. TAB primero (copia de planilla). */
function detectDelimiter(text: string): string {
  if (text.includes("\t")) return "\t";
  if (text.includes(";")) return ";";
  if (text.includes(" - ")) return " - ";
  return "\t"; // sin separador → una sola columna, cae en error de "faltan columnas"
}

/** Filas no vacías del bloque pegado. */
function splitRows(text: string): string[] {
  return (text ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

/**
 * Descompone una fila en [identificador, descripción, precioRaw]. El precio es la última
 * columna; el identificador la primera; la descripción, lo del medio unido por espacio.
 * Devuelve null si no hay al menos 2 columnas (identificador/nombre + precio).
 */
function splitFields(
  line: string,
  delimiter: string,
): { first: string; middle: string; priceRaw: string } | null {
  const parts = line.split(delimiter).map((p) => p.trim());
  if (parts.length < 2) return null;

  const first = parts[0];
  const priceRaw = parts[parts.length - 1];
  const middle = parts.slice(1, -1).join(" ").trim();
  return { first, middle, priceRaw };
}

export function parseQuoteParts(text: string): PartRowResult[] {
  const delimiter = detectDelimiter(text);
  return splitRows(text).map((raw): PartRowResult => {
    const fields = splitFields(raw, delimiter);
    if (!fields) {
      return { ok: false, raw, error: "Faltan columnas (esperado: código · descripción · precio)" };
    }
    // Repuesto: código = 1ª columna, descripción (= nombre visible) = 2ª, precio = última.
    const productCode = fields.first;
    const name = fields.middle;
    const price = parsePastedPrice(fields.priceRaw);

    if (name.length === 0) return { ok: false, raw, error: "Falta la descripción del repuesto" };
    if (price === null) return { ok: false, raw, error: `Precio inválido: "${fields.priceRaw}"` };
    if (price < 0) return { ok: false, raw, error: "El precio no puede ser negativo" };

    return {
      ok: true,
      raw,
      value: { productCode, name, unitPrice: price, quantity: 1 },
    };
  });
}

export function parseQuoteServices(text: string): ServiceRowResult[] {
  const delimiter = detectDelimiter(text);
  return splitRows(text).map((raw): ServiceRowResult => {
    const fields = splitFields(raw, delimiter);
    if (!fields) {
      return { ok: false, raw, error: "Faltan columnas (esperado: nombre · descripción · precio)" };
    }
    // Servicio: nombre = 1ª columna, descripción = 2ª, precio = última.
    const name = fields.first;
    const description = fields.middle;
    const price = parsePastedPrice(fields.priceRaw);

    if (name.length === 0) return { ok: false, raw, error: "Falta el nombre del servicio" };
    if (price === null) return { ok: false, raw, error: `Precio inválido: "${fields.priceRaw}"` };
    if (price < 0) return { ok: false, raw, error: "El precio no puede ser negativo" };

    return {
      ok: true,
      raw,
      value: { name, description, price, quantity: 1 },
    };
  });
}
