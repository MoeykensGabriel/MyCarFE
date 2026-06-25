import { WorkOrderPart, WorkOrderService } from "@/types/api.types";
import { QuoteItemApprovalStatus } from "@/lib/enums";

/**
 * Arma filas separadas por tabs (TSV) de los ítems de un presupuesto, para que el dueño
 * las copie y pegue en su planilla de comisiones sin re-tipear (evita errores).
 *
 * Columnas: Tipo · Código · Descripción · Cantidad · Precio unit. · Subtotal · Mecánico
 *  - "Código" es el código de proveedor (barcode) del repuesto; vacío en servicios.
 *  - "Mecánico" es quién hizo el servicio; vacío en repuestos.
 */

/** Número listo para Excel es-AR: coma decimal, sin separador de miles. */
function num(n: number): string {
  return String(n).replace(".", ",");
}

/** Saca tabs/saltos de línea para no romper las columnas al pegar. */
function clean(s: string | null | undefined): string {
  return (s ?? "").replace(/[\t\n\r]+/g, " ").trim();
}

export function partToRow(p: WorkOrderPart): string {
  return [
    "Producto",
    clean(p.productCode),
    clean(p.name),
    String(p.quantity),
    num(p.unitPrice),
    num(p.subtotal),
    "",
  ].join("\t");
}

export function serviceToRow(s: WorkOrderService): string {
  return [
    "Servicio",
    "",
    clean(s.nameSnapshot),
    String(s.quantity),
    num(s.priceSnapshot),
    num(s.subtotal),
    clean(s.assignedMechanicName),
  ].join("\t");
}

/**
 * Todos los ítems de la orden (servicios primero, después repuestos), una fila por línea.
 * Excluye los rechazados por el cliente: no se vendieron, no entran en la comisión.
 */
export function quoteItemsToRows(
  services: WorkOrderService[],
  parts: WorkOrderPart[],
): string {
  const notRejected = (status?: QuoteItemApprovalStatus) =>
    status !== QuoteItemApprovalStatus.Rejected;

  return [
    ...services.filter((s) => notRejected(s.approvalStatus)).map(serviceToRow),
    ...parts.filter((p) => notRejected(p.approvalStatus)).map(partToRow),
  ].join("\n");
}
