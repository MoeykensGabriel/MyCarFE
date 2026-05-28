"use client";

import { useState } from "react";
import { X } from "lucide-react";

import {
  useCreateVehicleDocument,
  useUpdateVehicleDocument,
} from "@/hooks/useVehicleDocuments";
import { VehicleDocumentType, VehicleDocumentTypeLabel } from "@/lib/enums";
import type { VehicleDocument } from "@/types/api.types";

type Props = {
  vehicleId: string;
  onClose: () => void;
} & (
  | { mode: "create"; document?: undefined }
  | { mode: "edit"; document: VehicleDocument }
);

/**
 * Modal sencillo para crear / editar un VehicleDocument.
 * Sin librería de form — useState directo. UI básica para iterar después.
 */
export function VehicleDocumentFormModal(props: Props) {
  const { vehicleId, onClose, mode } = props;
  const doc = mode === "edit" ? props.document : undefined;

  const create = useCreateVehicleDocument(vehicleId);
  const update = useUpdateVehicleDocument(vehicleId);
  const pending = create.isPending || update.isPending;

  const [documentType, setDocumentType] = useState<VehicleDocumentType>(
    doc?.documentType ?? VehicleDocumentType.TechnicalInspection,
  );
  const [expiresOn,    setExpiresOn]    = useState<string>(doc?.expiresOn ?? "");
  const [issuingEntity, setIssuingEntity] = useState<string>(doc?.issuingEntity ?? "");
  const [notes,         setNotes]         = useState<string>(doc?.notes ?? "");
  const [error,         setError]         = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!expiresOn) {
      setError("Ingresá una fecha de vencimiento.");
      return;
    }
    if (documentType === VehicleDocumentType.Other && !notes.trim()) {
      setError("Aclará en notas qué tipo de documento es.");
      return;
    }

    const payload = {
      documentType,
      expiresOn,
      notes:         notes.trim() || undefined,
      issuingEntity: issuingEntity.trim() || undefined,
    };

    const onDone = { onSuccess: () => onClose() };

    if (mode === "edit") update.mutate({ id: doc!.id, data: payload }, onDone);
    else                 create.mutate(payload, onDone);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#041627]/5">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#fea520] leading-none">
              {mode === "create" ? "Nuevo vencimiento" : "Editar vencimiento"}
            </p>
            <h2 className="text-sm font-black text-[#041627] mt-1">Documentación del vehículo</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-[#44474c] hover:bg-[#f4f6f8]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="px-5 py-5 space-y-4">
          {/* Tipo */}
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627] block mb-1.5">
              Tipo de documento *
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(Number(e.target.value) as VehicleDocumentType)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#041627]/10 text-sm bg-white"
              disabled={pending}
            >
              {Object.entries(VehicleDocumentTypeLabel).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627] block mb-1.5">
              Fecha de vencimiento *
            </label>
            <input
              type="date"
              value={expiresOn}
              onChange={(e) => setExpiresOn(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#041627]/10 text-sm bg-white"
              disabled={pending}
            />
          </div>

          {/* Aseguradora / entidad */}
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627] block mb-1.5">
              Aseguradora / Entidad emisora
            </label>
            <input
              type="text"
              value={issuingEntity}
              onChange={(e) => setIssuingEntity(e.target.value)}
              placeholder="Ej: La Caja, DNRPA"
              maxLength={200}
              className="w-full px-3 py-2.5 rounded-xl border border-[#041627]/10 text-sm bg-white"
              disabled={pending}
            />
          </div>

          {/* Notas */}
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627] block mb-1.5">
              Notas {documentType === VehicleDocumentType.Other && <span className="text-red-500 normal-case">*</span>}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder={
                documentType === VehicleDocumentType.Other
                  ? "Aclará qué documento es"
                  : "Nº de póliza, observaciones..."
              }
              className="w-full px-3 py-2.5 rounded-xl border border-[#041627]/10 text-sm bg-white resize-none"
              disabled={pending}
            />
          </div>

          {error && (
            <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-2 border-t border-[#041627]/5">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider border border-[#041627]/10 text-[#041627] hover:bg-[#f4f6f8]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#fea520] to-[#fec15d] text-[#041627] hover:shadow-md disabled:opacity-50"
            >
              {pending ? "Guardando..." : mode === "create" ? "Crear" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
