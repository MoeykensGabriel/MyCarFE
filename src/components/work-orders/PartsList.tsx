"use client";

import { useState } from "react";
import { Lock, Package, Pencil, X } from "lucide-react";

import { WorkOrderPart } from "@/types/api.types";
import { formatCurrency } from "@/lib/format";
import {
  QuoteItemApprovalStatus,
  QuoteItemApprovalStatusLabel,
  WorkOrderPartTier,
  WorkOrderPartTierLabel,
} from "@/lib/enums";
import { useRemoveWorkOrderPart } from "@/hooks/useWorkOrders";
import { EditPartDialog } from "./EditPartDialog";

interface PartsListProps {
  workOrderId: string;
  parts: WorkOrderPart[];
  /** Si true, permite editar/quitar repuestos (solo en Diagnosing). */
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

  // Agrupar visualmente por AlternativeGroupId — los del mismo grupo se muestran indentados
  const standalone = parts.filter((p) => !p.alternativeGroupId);
  const groupedMap = new Map<string, WorkOrderPart[]>();
  for (const p of parts) {
    if (!p.alternativeGroupId) continue;
    const arr = groupedMap.get(p.alternativeGroupId) ?? [];
    arr.push(p);
    groupedMap.set(p.alternativeGroupId, arr);
  }

  return (
    <>
      <div className="space-y-1">
        {standalone.map((p) => (
          <PartRow
            key={p.id}
            part={p}
            editable={editable}
            onEdit={() => setEditing(p)}
            onRemove={() => removePart(p.id)}
            removing={isPending}
          />
        ))}

        {Array.from(groupedMap.entries()).map(([groupId, groupParts], idx) => (
          <div
            key={groupId}
            className="border-l-2 border-amber-300 pl-3 ml-1 my-2 bg-amber-50/40 rounded-r-md"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700/90 pt-2">
              Alternativas (grupo {idx + 1}) — el cliente elige una
            </p>
            {groupParts.map((p) => (
              <PartRow
                key={p.id}
                part={p}
                editable={editable}
                onEdit={() => setEditing(p)}
                onRemove={() => removePart(p.id)}
                removing={isPending}
              />
            ))}
          </div>
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
  part,
  editable,
  onEdit,
  onRemove,
  removing,
}: {
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
            {part.productCode && (
              <span className="font-mono">{part.productCode}</span>
            )}
            <span>{WorkOrderPartTierLabel[part.tier]}</span>
            {part.quantity > 1 && (
              <span>
                {part.quantity} × {formatCurrency(part.unitPrice)}
              </span>
            )}
            <ApprovalBadge status={part.approvalStatus} />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-sm font-medium tabular-nums ${
              part.approvalStatus === QuoteItemApprovalStatus.Rejected
                ? "text-gray-400 line-through"
                : "text-gray-900"
            }`}
          >
            {formatCurrency(part.subtotal)}
          </span>
          {canMutate && (
            <>
              <button
                onClick={onEdit}
                className="text-muted-foreground hover:text-blue-600 transition-colors"
                title="Editar repuesto"
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
