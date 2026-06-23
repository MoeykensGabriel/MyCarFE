"use client";

import { useState } from "react";
import { Lock, Package, Pencil, X } from "lucide-react";

import { WorkOrderPart } from "@/types/api.types";
import { formatCurrency } from "@/lib/format";
import {
  QuoteItemApprovalStatus,
  QuoteItemApprovalStatusLabel,
} from "@/lib/enums";
import { useRemoveWorkOrderPart, useUpdateWorkOrderPart } from "@/hooks/useWorkOrders";
import { EditPartDialog } from "./EditPartDialog";

interface PartsListProps {
  workOrderId: string;
  parts: WorkOrderPart[];
  /** Si true, permite editar precio/quitar repuestos (solo en Diagnosing). */
  editable?: boolean;
}

export function PartsList({ workOrderId, parts, editable = false }: PartsListProps) {
  const [editing, setEditing] = useState<WorkOrderPart | null>(null);
  const { mutate: removePart, isPending } = useRemoveWorkOrderPart(workOrderId);

  if (!parts.length) {
    return (
      <p className="text-sm text-muted-foreground">
        {editable
          ? "Aún no hay repuestos. Agregá los que correspondan al diagnóstico."
          : "Sin repuestos registrados."}
      </p>
    );
  }

  return (
    <>
      <div className="space-y-1">
        {parts.map((p) => (
          <PartRow
            key={p.id}
            workOrderId={workOrderId}
            part={p}
            editable={editable}
            onEdit={() => setEditing(p)}
            onRemove={() => removePart(p.id)}
            removing={isPending}
          />
        ))}
      </div>

      {editing && (
        <EditPartDialog
          workOrderId={workOrderId}
          part={editing}
          open={!!editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

// ─── Fila ─────────────────────────────────────────────────────────────────────

function PartRow({
  workOrderId,
  part,
  editable,
  onEdit,
  onRemove,
  removing,
}: {
  workOrderId: string;
  part: WorkOrderPart;
  editable: boolean;
  onEdit: () => void;
  onRemove: () => void;
  removing: boolean;
}) {
  const frozen = !!part.frozenAt;
  const canMutate = editable && !frozen;
  const isCustom = !part.productCode;

  return (
    <div className="py-2.5 border-b last:border-0">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Package className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <p className="text-sm font-medium text-gray-900">{part.name}</p>
            {isCustom && (
              <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                Custom
              </span>
            )}
            {frozen && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200"
                title="Congelado al enviar el presupuesto"
              >
                <Lock className="w-2.5 h-2.5" />
                Congelado
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 ml-5 text-xs text-muted-foreground">
            {part.productCode && <span className="font-mono">{part.productCode}</span>}
            {part.quantity > 1 && (
              <span>
                {part.quantity} × {formatCurrency(part.unitPrice)}
              </span>
            )}
            <ApprovalBadge status={part.approvalStatus} />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canMutate ? (
            <PartPriceInput workOrderId={workOrderId} part={part} />
          ) : (
            <span
              className={`text-sm font-medium tabular-nums ${
                part.approvalStatus === QuoteItemApprovalStatus.Rejected
                  ? "text-gray-400 line-through"
                  : "text-gray-900"
              }`}
            >
              {formatCurrency(part.subtotal)}
            </span>
          )}
          {canMutate && (
            <>
              <button
                onClick={onEdit}
                className="text-muted-foreground hover:text-blue-600 transition-colors"
                title="Editar repuesto (nombre, código, cantidad)"
                aria-label="Editar repuesto"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onRemove}
                disabled={removing}
                className="text-muted-foreground hover:text-red-500 disabled:opacity-40 transition-colors"
                title="Quitar repuesto"
                aria-label="Quitar repuesto"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Precio editable inline ───────────────────────────────────────────────────
// Edita el precio de venta del repuesto sin abrir el diálogo. Guarda al salir/Enter
// reusando el update completo (preserva nombre, código y cantidad).

function PartPriceInput({ workOrderId, part }: { workOrderId: string; part: WorkOrderPart }) {
  const { mutate: updatePart, isPending } = useUpdateWorkOrderPart(workOrderId);
  const [value, setValue] = useState(String(part.unitPrice));

  function save() {
    const price = parseFloat(value);
    if (isNaN(price) || price < 0 || price === part.unitPrice) {
      setValue(String(part.unitPrice));
      return;
    }
    updatePart({
      partId: part.id,
      data: {
        workOrderId,
        partId:      part.id,
        productCode: part.productCode ?? undefined,
        name:        part.name,
        unitPrice:   price,
        quantity:    part.quantity,
      },
    });
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted-foreground">$</span>
      <input
        type="number"
        min={0}
        step={0.01}
        value={value}
        disabled={isPending}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        className="w-24 px-2 py-1 text-sm text-right rounded border border-[#c4c6cd] focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] tabular-nums disabled:opacity-50"
      />
    </div>
  );
}

function ApprovalBadge({ status }: { status: QuoteItemApprovalStatus }) {
  if (status === QuoteItemApprovalStatus.Pending) return null;
  const cls =
    status === QuoteItemApprovalStatus.Approved
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-red-50 text-red-700 border-red-200";
  return (
    <span
      className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${cls}`}
    >
      {QuoteItemApprovalStatusLabel[status]}
    </span>
  );
}
