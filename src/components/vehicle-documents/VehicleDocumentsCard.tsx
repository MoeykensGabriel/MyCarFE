"use client";

import { useState } from "react";
import { CalendarClock, Plus, Pencil, Trash2, ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";

import {
  useVehicleDocuments,
  useCreateVehicleDocument,
  useUpdateVehicleDocument,
  useDeleteVehicleDocument,
} from "@/hooks/useVehicleDocuments";
import { VehicleDocumentTypeLabel } from "@/lib/enums";
import type { VehicleDocument } from "@/types/api.types";
import { VehicleDocumentFormModal } from "./VehicleDocumentFormModal";

interface Props {
  vehicleId: string;
}

/**
 * Card que muestra los vencimientos de un vehículo (VTV, póliza, patente, etc.)
 * Cliente puede agregar/editar/borrar. Cada fila tiene semáforo según los días al vencimiento:
 *   - verde:    > 30 días
 *   - amarillo: 1-30 días
 *   - rojo:     ≤ 0 días (vencido)
 */
export function VehicleDocumentsCard({ vehicleId }: Props) {
  const { data: docs, isLoading } = useVehicleDocuments(vehicleId);
  const removeDoc = useDeleteVehicleDocument(vehicleId);

  const [editing, setEditing] = useState<VehicleDocument | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <section className="bg-white rounded-2xl border border-[#041627]/10 shadow-md overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#041627]/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#fea520]/10 flex items-center justify-center">
            <CalendarClock className="w-4 h-4 text-[#fea520]" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#fea520] leading-none">
              Documentación
            </p>
            <h3 className="text-sm font-black text-[#041627] mt-0.5">Vencimientos</h3>
          </div>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider bg-[#041627] text-[#fea520] hover:bg-[#0a2540] active:scale-[0.98] transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar
        </button>
      </div>

      {/* Body */}
      <div className="px-5 py-3">
        {isLoading ? (
          <div className="space-y-2 animate-pulse py-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-14 bg-[#c4c6cd]/20 rounded-lg" />
            ))}
          </div>
        ) : !docs || docs.length === 0 ? (
          <p className="text-xs text-[#44474c]/70 font-semibold py-6 text-center">
            Todavía no cargaste vencimientos. <br />
            <span className="text-[10px] text-[#44474c]/50">
              Sumá VTV, póliza, patente o cualquier otro documento para que te avisemos cuando se acerquen.
            </span>
          </p>
        ) : (
          <ul className="divide-y divide-[#041627]/5">
            {docs.map((doc) => (
              <DocRow
                key={doc.id}
                doc={doc}
                onEdit={() => setEditing(doc)}
                onDelete={() => {
                  if (confirm(`¿Eliminar "${VehicleDocumentTypeLabel[doc.documentType]}"?`)) {
                    removeDoc.mutate(doc.id);
                  }
                }}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Modals */}
      {creating && (
        <VehicleDocumentFormModal
          vehicleId={vehicleId}
          mode="create"
          onClose={() => setCreating(false)}
        />
      )}
      {editing && (
        <VehicleDocumentFormModal
          vehicleId={vehicleId}
          mode="edit"
          document={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}

// ─── Fila de un documento ────────────────────────────────────────────────────

function DocRow({
  doc,
  onEdit,
  onDelete,
}: {
  doc: VehicleDocument;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expires = new Date(doc.expiresOn + "T00:00:00");
  const days = Math.floor((expires.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const status = statusFromDays(days);

  return (
    <li className="py-3 flex items-start gap-3">
      <div
        className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center border ${status.bg} ${status.border}`}
      >
        <status.Icon className={`w-4 h-4 ${status.iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-extrabold text-[#041627] truncate">
            {VehicleDocumentTypeLabel[doc.documentType]}
          </p>
          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${status.pill}`}>
            {status.label}
          </span>
        </div>
        <p className="text-[11px] font-semibold text-[#44474c] mt-0.5">
          Vence:{" "}
          <strong>
            {expires.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}
          </strong>
          {days < 0 && <> · {Math.abs(days)} día{Math.abs(days) === 1 ? "" : "s"} vencido</>}
          {days >= 0 && <> · en {days} día{days === 1 ? "" : "s"}</>}
        </p>
        {doc.issuingEntity && (
          <p className="text-[10px] text-[#44474c]/70 mt-0.5 truncate">{doc.issuingEntity}</p>
        )}
        {doc.notes && (
          <p className="text-[10px] text-[#44474c]/80 mt-0.5 italic line-clamp-2">{doc.notes}</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5 shrink-0">
        <button
          onClick={onEdit}
          className="p-1.5 rounded-md text-[#44474c] hover:bg-[#f4f6f8]"
          aria-label="Editar"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-md text-red-500 hover:bg-red-50"
          aria-label="Eliminar"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </li>
  );
}

// ─── Semáforo según días al vencimiento ───────────────────────────────────────

function statusFromDays(days: number) {
  if (days < 0) {
    return {
      label: "Vencido",
      Icon: ShieldAlert,
      iconColor: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
      pill: "bg-red-100 text-red-800 border border-red-200",
    };
  }
  if (days <= 30) {
    return {
      label: "Próximo",
      Icon: AlertTriangle,
      iconColor: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      pill: "bg-amber-100 text-amber-800 border border-amber-200",
    };
  }
  return {
    label: "Al día",
    Icon: ShieldCheck,
    iconColor: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    pill: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  };
}
