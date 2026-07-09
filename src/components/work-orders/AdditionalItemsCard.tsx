"use client";

import { Check, PlusCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkOrder } from "@/types/api.types";
import { QuoteItemApprovalStatus } from "@/lib/enums";
import { formatCurrency } from "@/lib/format";
import { useDecideAdditionalItems } from "@/hooks/useWorkOrders";
import { AddServicePanel } from "./AddServicePanel";
import { AddPartPanel } from "./AddPartPanel";

interface Props {
  order: WorkOrder;
}

/**
 * Trabajo adicional que surgió DESPUÉS de aprobar el presupuesto original (orden
 * Approved/InProgress). Los items nuevos nacen Pending: no suman al total ni pueden
 * trabajarse hasta que el cliente los apruebe. La oficina consulta al cliente
 * (teléfono/WhatsApp) y registra la decisión item por item desde acá.
 */
export function AdditionalItemsCard({ order }: Props) {
  const { mutate: decide, isPending: deciding } = useDecideAdditionalItems(order.id);

  const pendingServices = (order.services ?? []).filter(
    (s) => Number(s.approvalStatus) === QuoteItemApprovalStatus.Pending,
  );
  const pendingParts = (order.parts ?? []).filter(
    (p) => Number(p.approvalStatus) === QuoteItemApprovalStatus.Pending,
  );
  const pendingCount = pendingServices.length + pendingParts.length;

  const decideService = (serviceId: string, approved: boolean) =>
    decide(approved ? { approvedServiceIds: [serviceId] } : { rejectedServiceIds: [serviceId] });

  const decidePart = (partId: string, approved: boolean) =>
    decide(approved ? { approvedPartIds: [partId] } : { rejectedPartIds: [partId] });

  return (
    <Card className={pendingCount > 0 ? "border-amber-300 bg-amber-50/40" : undefined}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <CardTitle className="text-base">
            Trabajo adicional
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-[11px] font-bold align-middle">
                {pendingCount} pendiente{pendingCount > 1 ? "s" : ""} de aprobación
              </span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Lo que surge durante la reparación se carga acá: no suma al total ni se trabaja
          hasta que el cliente lo apruebe. Consultalo y registrá su decisión.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Adicionales pendientes de decisión */}
        {pendingCount > 0 && (
          <ul className="space-y-2">
            {pendingServices.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-white px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {s.nameSnapshot}
                    {s.quantity > 1 ? ` ×${s.quantity}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatCurrency(s.priceSnapshot * s.quantity)} · servicio
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={deciding}
                    onClick={() => decideService(s.id, false)}
                    className="text-red-600 border-red-200 hover:bg-red-50 font-semibold"
                  >
                    <X className="w-3.5 h-3.5 mr-1" />
                    Rechazar
                  </Button>
                  <Button
                    size="sm"
                    disabled={deciding}
                    onClick={() => decideService(s.id, true)}
                    className="bg-emerald-600 hover:bg-emerald-700 font-semibold"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Aprobar
                  </Button>
                </div>
              </li>
            ))}
            {pendingParts.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-white px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {p.name}
                    {p.quantity > 1 ? ` ×${p.quantity}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatCurrency(p.subtotal)} · repuesto
                    {p.productCode ? ` · ${p.productCode}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={deciding}
                    onClick={() => decidePart(p.id, false)}
                    className="text-red-600 border-red-200 hover:bg-red-50 font-semibold"
                  >
                    <X className="w-3.5 h-3.5 mr-1" />
                    Rechazar
                  </Button>
                  <Button
                    size="sm"
                    disabled={deciding}
                    onClick={() => decidePart(p.id, true)}
                    className="bg-emerald-600 hover:bg-emerald-700 font-semibold"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Aprobar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Alta de nuevos adicionales (nacen Pending) */}
        <div className={pendingCount > 0 ? "border-t pt-1" : "pt-0"}>
          <AddServicePanel workOrderId={order.id} />
          <AddPartPanel workOrderId={order.id} />
        </div>
      </CardContent>
    </Card>
  );
}
