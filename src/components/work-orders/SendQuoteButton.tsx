"use client";

import { useState } from "react";
import { Send, Mail, Lock, HandCoins } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { SaleCondition, WorkOrderStatus } from "@/lib/enums";
import { useSendQuote, useSetSaleCondition } from "@/hooks/useWorkOrders";
import { WorkOrder } from "@/types/api.types";

interface Props {
  order: WorkOrder;
}

/**
 * Botón "Enviar presupuesto" — visible solo en Diagnosing.
 * Abre un modal de confirmación con resumen (count de items + total + warning de congelado)
 * y dispara el POST /send-quote al confirmar.
 *
 * Si el presupuesto tiene repuestos de depósito y la condición de venta no está cargada,
 * el modal la exige acá mismo (el BE también la valida): el pedido a GestionPGB se genera
 * cuando el cliente aprueba, con el snapshot de la condición — sin ella el depósito no
 * sabe con qué criterio comprar.
 */
export function SendQuoteButton({ order }: Props) {
  const [open, setOpen] = useState(false);
  const { mutate: sendQuote, isPending } = useSendQuote(order.id);
  const { mutateAsync: saveCondition, isPending: savingCondition } =
    useSetSaleCondition(order.id);

  // Estado del mini-form de condición de venta (solo se usa si falta cargarla)
  const [condition, setCondition] = useState<string>("");
  const [ocNumber, setOcNumber] = useState("");
  const [deposit, setDeposit] = useState<string>("");

  const status = Number(order.currentStatus) as WorkOrderStatus;
  if (status !== WorkOrderStatus.Diagnosing) return null;

  const servicesCount = (order.services ?? []).filter((s) => !!s).length;
  const partsCount    = (order.parts    ?? []).filter((p) => !!p).length;
  const totalItems    = servicesCount + partsCount;

  const hasDepotParts  = (order.parts ?? []).some((p) => !!p.productCode);
  const needsCondition = hasDepotParts && order.saleCondition == null;

  const parsed    = condition === "" ? null : (Number(condition) as SaleCondition);
  const isOc      = parsed === SaleCondition.OrdenDeCompra;
  const isContado = parsed === SaleCondition.Contado;

  const conditionValid =
    !needsCondition ||
    (parsed != null &&
      (!isOc || ocNumber.trim().length > 0) &&
      (!isContado || (deposit !== "" && Number(deposit) >= 0)));

  const busy    = isPending || savingCondition;
  const canSend = totalItems > 0 && conditionValid && !busy;

  const handleSend = async () => {
    // Si la condición se cargó en este modal, se guarda primero; recién después se envía.
    if (needsCondition) {
      try {
        await saveCondition({
          condition: parsed,
          purchaseOrderNumber: isOc ? ocNumber.trim() : null,
          depositAmount: isContado ? Number(deposit) : null,
        });
      } catch {
        return; // el hook ya mostró el toast de error
      }
    }
    sendQuote(undefined, { onSuccess: () => setOpen(false) });
  };

  return (
    <>
      <Button
        size="sm"
        onClick={() => setOpen(true)}
        disabled={totalItems === 0}
        title={totalItems === 0 ? "Cargá servicios o repuestos antes de enviar" : ""}
      >
        <Send className="w-3.5 h-3.5 mr-1.5" />
        Enviar presupuesto
      </Button>

      <Dialog open={open} onOpenChange={(o) => !o && !busy && setOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar presupuesto al cliente</DialogTitle>
            <DialogDescription>
              Esto va a generar un link de aprobación de 30 días y enviarlo por email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* Resumen */}
            <div className="rounded-md border bg-gray-50 px-3 py-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Servicios</span>
                <span className="font-medium tabular-nums">{servicesCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Repuestos</span>
                <span className="font-medium tabular-nums">{partsCount}</span>
              </div>
              <div className="flex justify-between text-sm pt-1.5 border-t">
                <span className="font-semibold text-gray-900">Total estimado</span>
                <span className="font-bold text-gray-900 tabular-nums">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>

            {/* Condición de venta obligatoria: hay repuestos de depósito y no está cargada.
                Sin esto el pedido a GestionPGB saldría sin criterio de compra. */}
            {needsCondition && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2.5 space-y-2.5">
                <div className="flex items-start gap-2">
                  <HandCoins className="w-3.5 h-3.5 text-red-700 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-800 leading-relaxed">
                    Hay <strong>repuestos de depósito</strong> y falta la{" "}
                    <strong>condición de venta</strong> — es lo que GestionPGB usa para
                    decidir la compra. Cargala acá para poder enviar.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Condición <span className="text-red-500">*</span>
                  </Label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    disabled={busy}
                  >
                    <option value="">— elegir —</option>
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
                      className="font-mono text-sm bg-white"
                      disabled={busy}
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
                      className="bg-white"
                      disabled={busy}
                    />
                    <p className="text-[11px] text-red-700/70">
                      Poné 0 si no dejó seña — el depósito lo ve y decide no pedir en vano.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Warning: items quedan congelados */}
            <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2.5">
              <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                Al enviar, los items quedan <strong>congelados</strong> — no podrás editarlos
                ni agregarlos hasta que el cliente decida (o el presupuesto venza).
              </p>
            </div>

            {/* Warning: email */}
            <div className="flex items-start gap-2 rounded-md bg-blue-50 border border-blue-200 px-3 py-2.5">
              <Mail className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 leading-relaxed">
                Se enviará un email al cliente con el link de aprobación.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button
              onClick={handleSend}
              disabled={!canSend}
              title={!conditionValid ? "Cargá la condición de venta para poder enviar" : ""}
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              {busy ? "Enviando..." : "Enviar presupuesto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
