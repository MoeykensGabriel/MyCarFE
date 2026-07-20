"use client";

import { useState } from "react";
import { X, ClipboardPlus, Gauge } from "lucide-react";
import { SkippedInspectionsAlert } from "@/components/inspections/SkippedInspectionsAlert";

interface OpenOrderModalProps {
  /** Ej: "Toyota Hilux · ABC123" */
  vehicleLabel: string;
  /** Si se pasa, muestra el aviso de áreas postergadas en la última visita del vehículo. */
  vehicleId?: string;
  initialMileage?: number;
  initialContactName?: string;
  initialContactPhone?: string;
  onConfirm: (data: {
    mileageAtEntry: number;
    serviceReason: string;
    customerNote: string;
    contactPersonName?: string;
    contactPersonPhone?: string;
  }) => Promise<void>;
  onClose: () => void;
}

export function OpenOrderModal({
  vehicleLabel,
  vehicleId,
  initialMileage = 0,
  initialContactName = "",
  initialContactPhone = "",
  onConfirm,
  onClose,
}: OpenOrderModalProps) {
  const [mileage,       setMileage]       = useState(initialMileage);
  const [serviceReason, setServiceReason] = useState("");
  const [reasonError,   setReasonError]   = useState<string | null>(null);
  const [note,          setNote]          = useState("");
  const [contactName,   setContactName]   = useState(initialContactName);
  const [contactPhone,  setContactPhone]  = useState(initialContactPhone);
  const [loading,       setLoading]       = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // El motivo de visita es obligatorio en el backend (guía la inspección).
    if (!serviceReason.trim()) {
      setReasonError("Indicá por qué viene el vehículo");
      return;
    }
    setLoading(true);
    try {
      await onConfirm({
        mileageAtEntry: mileage,
        serviceReason: serviceReason.trim(),
        customerNote: note.trim(),
        contactPersonName: contactName.trim() || undefined,
        contactPersonPhone: contactPhone.trim() || undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-[#c4c6cd]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#c4c6cd]/60">
          <div>
            <h2 className="text-base font-bold text-[#041627]">Abrir orden de trabajo</h2>
            <p className="text-xs text-[#44474c] mt-0.5 font-mono">{vehicleLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#44474c] hover:bg-[#eefcfd] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">

          {/* Áreas postergadas en la última visita — para que la postergación no se pierda */}
          <SkippedInspectionsAlert vehicleId={vehicleId} />

          {/* Kilometraje */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[#041627]">
              Kilometraje de entrada
            </label>
            <div className="relative">
              <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#44474c]/40 pointer-events-none" />
              <input
                type="number"
                min={0}
                value={mileage}
                onChange={(e) => setMileage(Number(e.target.value))}
                className="w-full pl-9 pr-12 py-2 text-sm rounded-lg border border-[#c4c6cd] focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all"
                disabled={loading}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#44474c]/50 pointer-events-none">
                km
              </span>
            </div>
          </div>

          {/* Motivo de visita (obligatorio) — guía la inspección colectiva */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[#041627]">
              ¿Por qué trae el vehículo? <span className="text-red-500 normal-case">*</span>
            </label>
            <textarea
              rows={3}
              value={serviceReason}
              onChange={(e) => {
                setServiceReason(e.target.value);
                if (reasonError) setReasonError(null);
              }}
              placeholder="Ej: Escuché un ruido en el motor al arrancar en frío..."
              className={`w-full px-3 py-2.5 text-sm rounded-lg border text-[#041627] placeholder:text-[#44474c]/40 focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] resize-none transition-all ${
                reasonError ? "border-red-400 focus:ring-red-200" : "border-[#c4c6cd]"
              }`}
              disabled={loading}
            />
            {reasonError && <p className="text-xs text-red-500">{reasonError}</p>}
            <p className="text-[10px] text-[#44474c]/60">
              Este texto guía a los mecánicos durante la inspección colectiva.
            </p>
          </div>

          {/* Nota adicional (opcional) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[#041627]">
              Nota adicional{" "}
              <span className="font-normal normal-case tracking-normal text-[#44474c]/50">
                (opcional)
              </span>
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Comentarios internos, observaciones del cliente, etc."
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#c4c6cd] text-[#041627] placeholder:text-[#44474c]/40 focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] resize-none transition-all"
              disabled={loading}
            />
          </div>

          {/* Quién trae el vehículo */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[#041627]">
              Nombre de quien trae el vehículo{" "}
              <span className="font-normal normal-case tracking-normal text-[#44474c]/50">
                (opcional)
              </span>
            </label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#c4c6cd] focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all"
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[#041627]">
              Teléfono de contacto{" "}
              <span className="font-normal normal-case tracking-normal text-[#44474c]/50">
                (opcional)
              </span>
            </label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="1123456789"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#c4c6cd] focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all"
              disabled={loading}
            />
          </div>

          {/* Acciones */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2 rounded-lg text-sm font-semibold text-[#041627] border border-[#c4c6cd] hover:bg-[#eefcfd] transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold text-[#041627] bg-[#fea520] hover:bg-[#865300] hover:text-white transition-all disabled:opacity-50"
            >
              <ClipboardPlus className="w-4 h-4" />
              {loading ? "Abriendo..." : "Abrir orden"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
