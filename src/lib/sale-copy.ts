import { Sale, SaleItem } from "@/types/sales.types";

/**
 * Arma filas TSV de los ítems de una venta para pegar en la planilla de comisiones.
 * Cada fila es autocontenida (lleva fecha/vendedor/comprador) para que el dueño sepa
 * quién vendió, a quién, qué y cuánto.
 *
 * Columnas: Fecha · Vendedor · Comprador · Código · Descripción · Cantidad · Precio unit. · Subtotal
 */

/** Número listo para Excel es-AR: coma decimal, sin separador de miles. */
function num(n: number): string {
  return String(n).replace(".", ",");
}

/** Saca tabs/saltos de línea para no romper las columnas al pegar. */
function clean(s: string | null | undefined): string {
  return (s ?? "").replace(/[\t\n\r]+/g, " ").trim();
}

/** Fecha (sin hora) en formato es-AR, que Excel parsea como fecha. */
function dateOnly(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("es-AR");
}

export function saleItemToRow(sale: Sale, item: SaleItem): string {
  return [
    dateOnly(sale.createdAt),
    clean(sale.sellerName),
    clean(sale.buyerName),
    clean(item.productCode),
    clean(item.name),
    String(item.quantity),
    num(item.unitPrice),
    num(item.subtotal),
  ].join("\t");
}

/** Todos los ítems de la venta, una fila por línea. */
export function saleToRows(sale: Sale): string {
  return sale.items.map((i) => saleItemToRow(sale, i)).join("\n");
}
