"use client";

import { useState } from "react";
import { ClipboardList, Clock, Copy, PackageSearch, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkOrder } from "@/types/api.types";
import { WorkOrderStatus } from "@/lib/enums";
import { formatCurrency } from "@/lib/format";
import { copyText } from "@/lib/clipboard";
import { quoteItemsToRows } from "@/lib/quote-copy";
import { ServicesList } from "./ServicesList";
import { PartsList } from "./PartsList";
import { AddServiceDialog } from "./AddServiceDialog";
import { AddPartDialog } from "./AddPartDialog";
import { SaleConditionFields } from "./SaleConditionFields";
import { SendQuoteWhatsappButton } from "./SendQuoteWhatsappButton";

interface Props {
  order: WorkOrder;
  status: WorkOrderStatus;
  isDiagnosing: boolean;
  onConsultStock: () => void;
}

/**
 * Card unificada "Presupuesto": servicios + repuestos + total + condición de venta.
 *
 * Mientras la orden está en Diagnosing cada sección tiene su botón "Agregar", que
 * abre un modal con las opciones de alta. Los formularios viven en el modal a
 * propósito: la card muestra lo cargado, y el total y la condición de venta quedan
 * siempre a la vista sin scrollear.
 */
export function QuoteCard({ order, status, isDiagnosing, onConsultStock }: Props) {
  const [addServiceOpen, setAddServiceOpen] = useState(false);
  const [addPartOpen, setAddPartOpen] = useState(false);

  async function handleCopyAll() {
    const rows = quoteItemsToRows(order.services ?? [], order.parts ?? []);
    if (!rows) {
      toast.error("No hay ítems para copiar");
      return;
    }
    const ok = await copyText(rows);
    if (ok) toast.success("Ítems copiados — pegalos en tu planilla");
    else toast.error("No se pudo copiar");
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Presupuesto</CardTitle>
          {isDiagnosing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onConsultStock}
              className="font-semibold"
            >
              <PackageSearch className="w-4 h-4 mr-1.5" />
              Consultar stock
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAll}
              className="font-semibold"
            >
              <Copy className="w-4 h-4 mr-1.5" />
              Copiar todos
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Servicios */}
        <div className="space-y-2">
          <SectionHeader
            label="Servicios"
            count={order.services?.length ?? 0}
            onAdd={isDiagnosing ? () => setAddServiceOpen(true) : undefined}
          />
          <ServicesList
            workOrderId={order.id}
            services={order.services ?? []}
            editable={isDiagnosing}
            copyable={!isDiagnosing}
            workOrderStatus={status}
          />
        </div>

        {/* Repuestos */}
        <div className="space-y-2 border-t pt-4">
          <SectionHeader
            label="Repuestos"
            count={order.parts?.length ?? 0}
            onAdd={isDiagnosing ? () => setAddPartOpen(true) : undefined}
          />
          <PartsList
            workOrderId={order.id}
            parts={order.parts ?? []}
            editable={isDiagnosing}
            copyable={!isDiagnosing}
          />
        </div>

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

        {/* Condición de venta — se define junto con el presupuesto */}
        {isDiagnosing && (
          <div className="border-t pt-4">
            <SaleConditionFields order={order} />
          </div>
        )}

        {/* Esperando al cliente: acá se le vuelve a pasar el link de aprobación.
            Es el mismo link que ya tiene — reenviar no genera uno nuevo ni toca la orden. */}
        {status === WorkOrderStatus.AwaitingApproval && (
          <div className="border-t pt-4">
            <div className="rounded-lg border border-[#c4c6cd]/70 bg-gray-50/60 px-4 py-3.5 space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#fea520]" />
                <h3 className="text-sm font-bold text-[#041627]">
                  Esperando la aprobación del cliente
                </h3>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Si no lo recibió, pasale de nuevo el link por WhatsApp. Es el mismo de
                siempre: el que ya tenga sigue funcionando.
              </p>
              <SendQuoteWhatsappButton order={order} mode="resend" />
            </div>
          </div>
        )}
      </CardContent>

      {isDiagnosing && (
        <>
          <AddServiceDialog
            workOrderId={order.id}
            open={addServiceOpen}
            onClose={() => setAddServiceOpen(false)}
          />
          <AddPartDialog
            workOrderId={order.id}
            open={addPartOpen}
            onClose={() => setAddPartOpen(false)}
          />
        </>
      )}
    </Card>
  );
}

/** Título de sección con su contador y, si se puede editar, el botón de alta. */
function SectionHeader({
  label,
  count,
  onAdd,
}: {
  label: string;
  count: number;
  onAdd?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}{count > 0 ? ` (${count})` : ""}
      </p>
      {onAdd && (
        <Button size="sm" onClick={onAdd} className="font-bold">
          <Plus className="w-4 h-4 mr-1" />
          Agregar
        </Button>
      )}
    </div>
  );
}
