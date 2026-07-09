"use client";

import { useState } from "react";
import { HandCoins } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SaleCondition, SaleConditionLabel, WorkOrderStatus } from "@/lib/enums";
import { WorkOrder } from "@/types/api.types";
import { useSetSaleCondition } from "@/hooks/useWorkOrders";
import { formatCurrency } from "@/lib/format";

/**
 * Condición de venta de los repuestos (CC / OC + número / Contado + seña).
 * La define la oficina antes de la aprobación; al aprobar viaja al depósito
 * (GestionPGB) junto con el pedido — es el criterio del depósito para comprar:
 * CC pide directo, OC muestra el número, Contado muestra la seña (0 = sin seña,
 * o sea: no pedir en vano).
 */
export function SaleConditionCard({ order, status }: { order: WorkOrder; status: WorkOrderStatus }) {
  // Editable mientras la orden está viva: los pedidos ya enviados al depósito llevan su
  // snapshot congelado; editar acá afecta solo pedidos FUTUROS (adicionales aprobados
  // en Approved/InProgress). Espeja EditableStatuses del BE (SetSaleCondition).
  const editable =
    status === WorkOrderStatus.Received ||
    status === WorkOrderStatus.UnderInspection ||
    status === WorkOrderStatus.Diagnosing ||
    status === WorkOrderStatus.AwaitingApproval ||
    status === WorkOrderStatus.Approved ||
    status === WorkOrderStatus.InProgress;

  // Falta la condición y hay repuestos de depósito: sin ella el presupuesto no se puede
  // enviar (ni aprobar adicionales de depósito) — alerta visual para que nunca se olvide.
  const hasDepotParts  = (order.parts ?? []).some((p) => !!p.productCode);
  const needsCondition = editable && hasDepotParts && order.saleCondition == null;

  const { mutate: save, isPending } = useSetSaleCondition(order.id);

  const [condition, setCondition] = useState<string>(
    order.saleCondition != null ? String(order.saleCondition) : "",
  );
  const [ocNumber, setOcNumber] = useState(order.purchaseOrderNumber ?? "");
  const [deposit, setDeposit] = useState<string>(
    order.depositAmount != null ? String(order.depositAmount) : "",
  );

  const parsed = condition === "" ? null : (Number(condition) as SaleCondition);
  const isOc = parsed === SaleCondition.OrdenDeCompra;
  const isContado = parsed === SaleCondition.Contado;

  const canSave =
    !isPending &&
    parsed != null &&
    (!isOc || ocNumber.trim().length > 0) &&
    (!isContado || (deposit !== "" && Number(deposit) >= 0));

  // Cerrada la ventana de edición: solo lectura (o nada si nunca se cargó).
  if (!editable) {
    if (order.saleCondition == null) return null;
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <HandCoins className="w-4 h-4 text-[#fea520]" />
            Condición de venta
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p className="font-medium text-gray-900">
            {SaleConditionLabel[order.saleCondition]}
          </p>
          {order.saleCondition === SaleCondition.OrdenDeCompra && (
            <p className="text-gray-700 font-mono text-xs">OC {order.purchaseOrderNumber}</p>
          )}
          {order.saleCondition === SaleCondition.Contado && (
            <p className="text-gray-700">
              Seña: {order.depositAmount ? formatCurrency(order.depositAmount) : "sin seña"}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground">Enviada al depósito con el pedido de repuestos.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={needsCondition ? "border-red-300 bg-red-50/40" : undefined}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 flex-wrap">
          <HandCoins className={`w-4 h-4 ${needsCondition ? "text-red-600" : "text-[#fea520]"}`} />
          Condición de venta
          {needsCondition && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 border border-red-300 text-red-800 text-[11px] font-bold whitespace-nowrap">
              Falta cargar
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {needsCondition ? (
          <p className="text-[11px] text-red-700 leading-relaxed font-medium">
            Hay repuestos de depósito y la condición no está cargada: sin ella no se puede
            enviar el presupuesto ni aprobar adicionales — GestionPGB la necesita para
            decidir la compra.
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Viaja al depósito al aprobar el presupuesto — es su criterio para pedir los
            repuestos al proveedor.
          </p>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs">Condición</Label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isPending}
          >
            <option value="">— sin definir —</option>
            <option value={SaleCondition.CuentaCorriente}>Cuenta corriente</option>
            <option value={SaleCondition.OrdenDeCompra}>Orden de compra</option>
            <option value={SaleCondition.Contado}>Contado</option>
          </select>
        </div>

        {isOc && (
          <div className="space-y-1.5">
            <Label className="text-xs">
              Número de OC <span className="text-red-500">*</span>
            </Label>
            <Input
              value={ocNumber}
              onChange={(e) => setOcNumber(e.target.value)}
              placeholder="Ej: OC-2026-0412"
              maxLength={100}
              className="font-mono text-sm"
            />
          </div>
        )}

        {isContado && (
          <div className="space-y-1.5">
            <Label className="text-xs">
              Seña del cliente ($) <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
              placeholder="0.00"
            />
            <p className="text-[11px] text-muted-foreground">
              Poné 0 si no dejó seña — el depósito lo ve y decide no pedir en vano.
            </p>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <Button
            size="sm"
            disabled={!canSave}
            onClick={() =>
              save({
                condition: parsed,
                purchaseOrderNumber: isOc ? ocNumber.trim() : null,
                depositAmount: isContado ? Number(deposit) : null,
              })
            }
          >
            {isPending ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
