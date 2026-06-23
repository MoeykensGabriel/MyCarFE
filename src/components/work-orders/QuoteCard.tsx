"use client";

import { ClipboardList, PackageSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkOrder } from "@/types/api.types";
import { WorkOrderStatus } from "@/lib/enums";
import { formatCurrency } from "@/lib/format";
import { ServicesList } from "./ServicesList";
import { AddServicePanel } from "./AddServicePanel";
import { PartsList } from "./PartsList";
import { AddPartPanel } from "./AddPartPanel";

interface Props {
  order: WorkOrder;
  status: WorkOrderStatus;
  isDiagnosing: boolean;
  onConsultStock: () => void;
}

/**
 * Card unificada "Presupuesto": servicios + repuestos + total, con precios editables
 * (servicio y repuesto) mientras la orden está en Diagnosing.
 */
export function QuoteCard({ order, status, isDiagnosing, onConsultStock }: Props) {
  return (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">Presupuesto</CardTitle>
                  {isDiagnosing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onConsultStock}
                      className="font-semibold"
                    >
                      <PackageSearch className="w-4 h-4 mr-1.5" />
                      Consultar stock
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-5">

                {/* Servicios */}
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Servicios{(order.services?.length ?? 0) > 0 ? ` (${order.services!.length})` : ""}
                  </p>
                  <ServicesList
                    workOrderId={order.id}
                    services={order.services ?? []}
                    editable={isDiagnosing}
                    workOrderStatus={status}
                  />
                </div>

                {/* Repuestos */}
                <div className="space-y-2 border-t pt-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Repuestos{(order.parts?.length ?? 0) > 0 ? ` (${order.parts!.length})` : ""}
                  </p>
                  <PartsList
                    workOrderId={order.id}
                    parts={order.parts ?? []}
                    editable={isDiagnosing}
                  />
                </div>

                {/* Agregar items (solo Diagnosing) */}
                {isDiagnosing && (
                  <div className="border-t pt-1">
                    <AddServicePanel workOrderId={order.id} />
                    <AddPartPanel workOrderId={order.id} />
                  </div>
                )}

                {/* Total */}
                <div className="border-t pt-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-[#041627]/5 flex items-center justify-center shrink-0">
                      <ClipboardList className="w-4 h-4 text-[#fea520]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#041627]">Total presupuestado</h3>
                      <p className="text-[11px] text-muted-foreground">Suma de servicios y repuestos</p>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-[#041627] tabular-nums tracking-tight">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
              </CardContent>
            </Card>
  );
}
