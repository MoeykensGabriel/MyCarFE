/**
 * Parseo de filas pegadas desde la planilla Excel del dueño.
 *
 * Formatos acordados (2026-07):
 *   Repuesto: código | descripción | precio
 *   Servicio: nombre | descripción | precio
 *
 * Excel copia las celdas separadas por TAB y las filas por salto de línea.
 * Los precios vienen en formato es-AR ("1.234,56", "$ 1.234,56") o crudos.
 */

/** Precio es-AR → number. Devuelve null si no se puede interpretar. */
export function parseEsArPrice(raw: string): number | null {
  let s = raw.trim().replace(/\$/g, "").replace(/ars/gi, "").replace(/\s/g, "");
  if (!s) return null;

  if (s.includes(",")) {
    // "1.234,56" → puntos = miles, coma = decimal
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (s.includes(".")) {
    // Sin coma: el punto puede ser decimal ("1234.56") o de miles ("12.345").
    // Grupos de exactamente 3 dígitos después de cada punto = separador de miles.
    const parts = s.split(".");
    const looksLikeThousands =
      parts.length > 2 || (parts.length === 2 && parts[1].length === 3);
    if (looksLikeThousands) s = parts.join("");
  }

  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Divide una fila pegada en columnas: TAB (Excel) o ";" como fallback. */
function splitColumns(row: string): string[] {
  if (row.includes("\t")) return row.split("\t").map((c) => c.trim());
  if (row.includes(";")) return row.split(";").map((c) => c.trim());
  return [row.trim()];
}

export interface ParsedPartRow {
  productCode: string | null;
  name: string;       // descripción del Excel — es lo que ve el cliente
  unitPrice: number;
}

export interface ParsedServiceRow {
  name: string;
  description: string;
  price: number;
}

export interface RowResult<T> {
  raw: string;
  data: T | null;
  error: string | null;
}

/** Fila de repuesto: código | descripción | precio (o descripción | precio sin código). */
export function parsePartRow(row: string): RowResult<ParsedPartRow> {
  const cols = splitColumns(row).filter((c) => c.length > 0);

  if (cols.length < 2)
    return { raw: row, data: null, error: "Se esperan al menos descripción y precio." };

  const price = parseEsArPrice(cols[cols.length - 1]);
  if (price === null)
    return { raw: row, data: null, error: `No se entiende el precio "${cols[cols.length - 1]}".` };

  // 3+ columnas: código | descripción | precio. 2 columnas: descripción | precio.
  const hasCode = cols.length >= 3;
  const name = hasCode ? cols.slice(1, -1).join(" ") : cols[0];
  if (!name)
    return { raw: row, data: null, error: "Falta la descripción del repuesto." };

  return {
    raw: row,
    data: { productCode: hasCode ? cols[0] : null, name, unitPrice: price },
    error: null,
  };
}

/** Fila de servicio: nombre | descripción | precio (o nombre | precio sin descripción). */
export function parseServiceRow(row: string): RowResult<ParsedServiceRow> {
  const cols = splitColumns(row).filter((c) => c.length > 0);

  if (cols.length < 2)
    return { raw: row, data: null, error: "Se esperan al menos nombre y precio." };

  const price = parseEsArPrice(cols[cols.length - 1]);
  if (price === null)
    return { raw: row, data: null, error: `No se entiende el precio "${cols[cols.length - 1]}".` };

  const name = cols[0];
  if (!name)
    return { raw: row, data: null, error: "Falta el nombre del servicio." };

  return {
    raw: row,
    data: {
      name,
      description: cols.length >= 3 ? cols.slice(1, -1).join(" ") : "",
      price,
    },
    error: null,
  };
}

/** Varias filas pegadas de una (para el alta en lote de repuestos). */
export function parsePartRows(text: string): RowResult<ParsedPartRow>[] {
  return text
    .split(/\r?\n/)
    .map((r) => r.trim())
    .filter((r) => r.length > 0)
    .map(parsePartRow);
}
