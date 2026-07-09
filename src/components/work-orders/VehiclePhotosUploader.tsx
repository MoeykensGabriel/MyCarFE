"use client";

import { useState } from "react";
import { Camera, CheckCircle2, Trash2, RefreshCw, Upload, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { workOrdersService } from "@/services/work-orders.service";
import { PhotoType } from "@/lib/enums";
import { resolveAssetUrl } from "@/lib/asset-url";
import type { WorkOrderPhoto } from "@/types/api.types";

type PhotoSlotId = "front" | "rear" | "left" | "right" | "interiorFront" | "interiorBack";

interface PhotoSlot {
  id: PhotoSlotId;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface Props {
  workOrderId: string;
  /** Todas las fotos de la WO (cualquier tipo y target). */
  allPhotos: WorkOrderPhoto[];
  /** Disparado cuando se sube o borra una foto para que el padre invalide la query. */
  onUploaded: () => void;
  /** Qué tanda documenta: ingreso (Before) o entrega (After). */
  photoType: PhotoType.Before | PhotoType.After;
  /** Título del header de la card. */
  title: string;
  /** Bajada explicativa del header. */
  description: string;
  /**
   * Prefijo para los IDs de los inputs nativos. Es OBLIGATORIO que sea único por instancia:
   * en estado Completed se montan a la vez el uploader de ingreso y el de entrega, y si
   * compartieran el id del input se dispararía el file picker equivocado.
   */
  inputIdPrefix: string;
}

const SLOTS: PhotoSlot[] = [
  {
    id: "front",
    label: "Frente / Delantera",
    description: "Paragolpes, patente y capot",
    icon: (
      <svg className="w-8 h-8 stroke-[1.25]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M6 10l2-4h8l2 4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 10h18v6H3z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="6" cy="13" r="1.5" />
        <circle cx="18" cy="13" r="1.5" />
        <path d="M9 13h6m-6 2h6" strokeLinecap="round" />
        <path d="M5 16v2m14-2v2" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: "rear",
    label: "Parte Trasera",
    description: "Ópticas, baúl y paragolpes trasero",
    icon: (
      <svg className="w-8 h-8 stroke-[1.25]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M6 10l2-4h8l2 4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 10h18v6H3z" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="5" y="12" width="3" height="1.5" rx="0.5" />
        <rect x="16" y="12" width="3" height="1.5" rx="0.5" />
        <rect x="10" y="12" width="4" height="2" rx="0.2" />
        <path d="M5 16v2m14-2v2" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: "left",
    label: "Lateral Izquierdo",
    description: "Costado del conductor, puertas y llantas",
    icon: (
      <svg className="w-8 h-8 stroke-[1.25]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M2 13h2l2-4h10l2 4h4v3H2z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="7" cy="16" r="2" />
        <circle cx="17" cy="16" r="2" />
        <path d="M12 9v7M8 9h6" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: "right",
    label: "Lateral Derecho",
    description: "Costado del acompañante, puertas y llantas",
    icon: (
      <svg className="w-8 h-8 stroke-[1.25]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M22 13h-2l-2-4H8l-2 4H2v3h20z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="17" cy="16" r="2" />
        <circle cx="7" cy="16" r="2" />
        <path d="M12 9v7M16 9H10" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: "interiorFront",
    label: "Interior Delantero",
    description: "Tablero, volante y tapizado delantero",
    icon: (
      <svg className="w-8 h-8 stroke-[1.25]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 8v8M8 12h8" strokeLinecap="round" />
        <path d="M3 18c3-3 6-4 9-4s6 1 9 4" strokeLinecap="round" />
        <path d="M5 14V8a2 2 0 012-2h1a2 2 0 012 2v6M14 14V8a2 2 0 012-2h1a2 2 0 012 2v6" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: "interiorBack",
    label: "Interior Trasero",
    description: "Asientos de atrás y alfombras",
    icon: (
      <svg className="w-8 h-8 stroke-[1.25]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M4 16h16v3H4z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 16V9a2 2 0 012-2h3a2 2 0 012 2v7M11 16V9a2 2 0 012-2h3a2 2 0 012 2v7" strokeLinecap="round" />
        <rect x="6.5" y="4" width="2" height="2" rx="0.5" />
        <rect x="13.5" y="4" width="2" height="2" rx="0.5" />
      </svg>
    )
  }
];

/**
 * Grilla de 6 fotos del estado cosmético del vehículo, con subida/cambio/borrado por slot.
 * Es el mismo registro fotográfico tanto para el ingreso (Before) como para la entrega
 * (After): se parametriza por `photoType` y los textos. El emparejamiento foto↔slot se hace
 * por `caption` (el mismo label que usa el ingreso), así que recupera las fotos ya cargadas.
 */
export function VehiclePhotosUploader({
  workOrderId,
  allPhotos,
  onUploaded,
  photoType,
  title,
  description,
  inputIdPrefix,
}: Props) {
  const [uploadingSlots, setUploadingSlots] = useState<Record<PhotoSlotId, boolean>>({
    front: false,
    rear: false,
    left: false,
    right: false,
    interiorFront: false,
    interiorBack: false,
  });

  const [deletingPhotos, setDeletingPhotos] = useState<Record<string, boolean>>({});

  // Solo fotos de esta tanda y del vehículo (sin servicio ni reporte de inspección asignado).
  const vehiclePhotos = allPhotos.filter(
    (p) =>
      Number(p.photoType) === photoType &&
      !p.workOrderServiceId &&
      !p.inspectionReportId
  );

  const getSlotPhoto = (label: string) => {
    return vehiclePhotos.find((p) => p.caption === label);
  };

  const extraPhotos = vehiclePhotos.filter(
    (p) => !SLOTS.some((s) => s.label === p.caption)
  );

  const uploadedCount = SLOTS.filter((s) => !!getSlotPhoto(s.label)).length;
  const isProgressComplete = uploadedCount === 6;
  const progressPercentage = (uploadedCount / 6) * 100;
  const hasEnough = vehiclePhotos.length > 0;

  const handleFileChange = async (slotId: PhotoSlotId, label: string, file: File | null) => {
    if (!file) return;

    setUploadingSlots((prev) => ({ ...prev, [slotId]: true }));
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("photoType", String(photoType));
      formData.append("caption", label);

      await workOrdersService.addPhoto(workOrderId, formData);
      toast.success(`Foto de "${label}" subida correctamente`);
      onUploaded();
    } catch (err) {
      console.error(err);
      toast.error(`Error al subir la foto de "${label}"`);
    } finally {
      setUploadingSlots((prev) => ({ ...prev, [slotId]: false }));
    }
  };

  const handleDelete = async (photoId: string, label: string) => {
    setDeletingPhotos((prev) => ({ ...prev, [photoId]: true }));
    try {
      await workOrdersService.removePhoto(workOrderId, photoId);
      toast.success(`Foto de "${label}" eliminada correctamente`);
      onUploaded();
    } catch (err) {
      console.error(err);
      toast.error(`Error al eliminar la foto de "${label}"`);
    } finally {
      setDeletingPhotos((prev) => ({ ...prev, [photoId]: false }));
    }
  };

  return (
    <section
      className={`rounded-xl border shadow-sm overflow-hidden transition-all duration-300 ${
        hasEnough ? "border-emerald-200 bg-emerald-50/10" : "border-amber-200 bg-amber-50/10"
      }`}
    >
      {/* Header */}
      <div className="px-5 py-4 bg-[#fcfdff] border-b border-[#041627]/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`p-1.5 rounded-lg shrink-0 ${hasEnough ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
              <Camera className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#041627]">
              {title}
            </h2>
          </div>
          <p className="text-xs text-[#44474c]/80 mt-1">
            {description}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            isProgressComplete
              ? "bg-emerald-100 text-emerald-800"
              : "bg-[#fea520]/10 text-[#041627]"
          }`}>
            Fotos: {uploadedCount} de 6
          </span>
          {isProgressComplete && (
            <Sparkles className="w-4 h-4 text-[#fea520] animate-pulse" />
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                isProgressComplete ? "bg-emerald-600" : "bg-[#fea520]"
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#44474c]/60">
            <span>Progreso de captura</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
        </div>

        {/* 6-Slot Photo Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {SLOTS.map((slot) => {
            const photo = getSlotPhoto(slot.label);
            const isUploading = uploadingSlots[slot.id];
            const isDeleting = photo ? deletingPhotos[photo.id] : false;

            return (
              <div
                key={slot.id}
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 transition-all overflow-hidden aspect-[4/3] group ${
                  photo
                    ? "border-emerald-500 bg-[#041627]"
                    : "border-dashed border-[#c4c6cd] hover:border-[#fea520] hover:bg-slate-50/50 bg-white"
                }`}
              >
                {photo ? (
                  <>
                    {/* Selected Image */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveAssetUrl(photo.url)}
                      alt={slot.label}
                      className="w-full h-full object-cover"
                    />

                    {/* Overlay Action Buttons */}
                    <div className="absolute inset-0 bg-[#041627]/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                      <span className="text-white text-[11px] font-bold text-center mb-1 drop-shadow-sm px-1 truncate w-full">
                        {slot.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isUploading || isDeleting}
                          onClick={() => {
                            const input = document.getElementById(`${inputIdPrefix}-${slot.id}`) as HTMLInputElement;
                            if (input) input.click();
                          }}
                          className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-lg transition-colors disabled:opacity-40"
                          title="Cambiar foto"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isUploading ? "animate-spin" : ""}`} />
                        </button>
                        <button
                          type="button"
                          disabled={isUploading || isDeleting}
                          onClick={() => handleDelete(photo.id, slot.label)}
                          className="p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-40"
                          title="Borrar foto"
                        >
                          <Trash2 className={`w-3.5 h-3.5 ${isDeleting ? "animate-pulse" : ""}`} />
                        </button>
                      </div>
                    </div>

                    {/* Corner badge */}
                    {isDeleting ? (
                      <span className="absolute bottom-1.5 right-1.5 bg-red-600 text-white text-[9px] font-extrabold px-1 rounded shadow animate-pulse">
                        ELIMINANDO
                      </span>
                    ) : (
                      <span className="absolute bottom-1.5 right-1.5 bg-emerald-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow inline-flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        GUARDADA
                      </span>
                    )}
                  </>
                ) : (
                  /* Empty Upload Slot */
                  <label
                    htmlFor={`${inputIdPrefix}-${slot.id}`}
                    className="w-full h-full flex flex-col items-center justify-center p-2.5 cursor-pointer text-center select-none"
                  >
                    <div className="text-slate-400 group-hover:text-[#fea520] transition-colors mb-1.5">
                      {isUploading ? (
                        <RefreshCw className="w-7 h-7 animate-spin text-[#fea520]" />
                      ) : (
                        slot.icon
                      )}
                    </div>
                    <span className="text-[11px] font-extrabold text-[#041627] block truncate max-w-full">
                      {isUploading ? "Subiendo..." : slot.label}
                    </span>
                    <span className="text-[9px] text-[#44474c]/70 block mt-0.5 leading-tight max-w-full truncate">
                      {slot.description}
                    </span>
                    {!isUploading && (
                      <div className="mt-1.5 inline-flex items-center gap-0.5 text-[9px] font-bold text-[#fea520] bg-[#fea520]/10 px-1.5 py-0.2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="w-2 h-2" />
                        Subir
                      </div>
                    )}
                  </label>
                )}

                {/* Hidden Input */}
                <input
                  id={`${inputIdPrefix}-${slot.id}`}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  disabled={isUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    handleFileChange(slot.id, slot.label, file);
                    e.target.value = ""; // Reset input
                  }}
                  className="hidden"
                />
              </div>
            );
          })}
        </div>

        {/* Retrocompatibility / Extra Photos */}
        {extraPhotos.length > 0 && (
          <div className="border-t border-[#c4c6cd]/30 pt-3 mt-1">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#44474c]/70 mb-2">
              Fotos adicionales cargadas
            </p>
            <div className="flex flex-wrap gap-2">
              {extraPhotos.map((p) => {
                const isDeleting = deletingPhotos[p.id];
                return (
                  <div key={p.id} className="relative group rounded-md overflow-hidden border bg-[#041627] h-16 w-16 shadow-2xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveAssetUrl(p.url)}
                      alt="Foto adicional"
                      className="h-full w-full object-cover group-hover:opacity-60 transition-opacity"
                    />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity bg-black/40">
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => handleDelete(p.id, "adicional")}
                        className="p-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-40"
                        title="Borrar foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {isDeleting && (
                      <span className="absolute inset-0 bg-red-600/70 flex items-center justify-center text-[7px] text-white font-extrabold">
                        BORRANDO
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
