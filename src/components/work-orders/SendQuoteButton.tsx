"use client";

import { useMemo, useState } from "react";
import { Send, Mail, Lock, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format";
import { WorkOrderStatus } from "@/lib/enums";
import { useSendQuote } from "@/hooks/useWorkOrders";
import { WorkOrder } from "@/types/api.types";

interface Props {
  order: WorkOrder;
}

/**
 * Botón "Enviar presupuesto" — visible solo en Diagnosing.
 * Abre un modal de confirmación con resumen (count de items + total + warning de congelado)
 * y dispara el POST /send-quote al confirmar.
 */
export function SendQuoteButton({ order }: Props) {
  const [open, setOpen] = useState(false);
  const { mutate: sendQuote, isPending } = useSendQuote(order.id);

  // Detección defensiva: si hay un grupo con un solo item, el BE lo rechaza.
  // Mostramos un warning para que el admin lo corrija antes de intentar.
  // IMPORTANTE: este useMemo va ANTES del early return — si no, al pasar de
  // Diagnosing → AwaitingApproval React detecta menos hooks y crashea.
  const orphanGroup = useMemo(() => detectOrphanGroup(order), [order]);

  const status = Number(order.currentStatus) as WorkOrderStatus;
  if (status !== WorkOrderStatus.Diagnosing) return null;

  const servicesCount = (order.services ?? []).filter((s) => !!s).length;
  const partsCount    = (order.parts    ?? []).filter((p) => !!p).length;
  const totalItems    = servicesCount + partsCount;

  const canSend = totalItems > 0 && !orphanGroup;

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

      <Dialog open={open} onOpenChange={(o) => !o && !isPending && setOpen(false)}>
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

            {/* Error de grupo huérfano */}
            {orphanGroup && (
              <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-700 shrink-0 mt-0.5" />
                <p className="text-xs text-red-800 leading-relaxed">
                  Hay un grupo de alternativas con un solo item. Cada grupo necesita
                  al menos 2 opciones para que el cliente pueda elegir.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              onClick={() => sendQuote(undefined, { onSuccess: () => setOpen(false) })}
              disabled={!canSend || isPending}
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              {isPending ? "Enviando..." : "Enviar presupuesto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Devuelve true si hay algún AlternativeGroupId con un solo item.
 * El BE rechaza send-quote en ese caso — mejor avisar antes.
 */
function detectOrphanGroup(order: WorkOrder): boolean {
  const counts = new Map<string, number>();
  for (const s of order.services ?? []) {
    if (!s.alternativeGroupId) continue;
    counts.set(s.alternativeGroupId, (counts.get(s.alternativeGroupId) ?? 0) + 1);
  }
  for (const p of order.parts ?? []) {
    if (!p.alternativeGroupId) continue;
    counts.set(p.alternativeGroupId, (counts.get(p.alternativeGroupId) ?? 0) + 1);
  }
  return Array.from(counts.values()).some((c) => c < 2);
}
