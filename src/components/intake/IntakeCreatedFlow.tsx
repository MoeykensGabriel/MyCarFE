"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Printer, Plus, AlertCircle, Camera, Trash2, RefreshCw, Upload, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { WorkOrder } from "@/types/api.types";
import { workOrdersService } from "@/services/work-orders.service";
import { PhotoType } from "@/lib/enums";

type PhotoSlotId = "front" | "rear" | "left" | "right" | "interiorFront" | "interiorBack";

interface PhotoSlot {
  id: PhotoSlotId;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface IntakeCreatedFlowProps {
  order: WorkOrder | null;
  loading: boolean;
  error: string | null;
  role: "admin" | "receptionist";
}

export function IntakeCreatedFlow({ order, loading, error, role }: IntakeCreatedFlowProps) {
  // Photo States
  const [photos, setPhotos] = useState<Record<PhotoSlotId, File | null>>({
    front: null,
    rear: null,
    left: null,
    right: null,
    interiorFront: null,
    interiorBack: null
  });

  const [previews, setPreviews] = useState<Record<PhotoSlotId, string | null>>({
    front: null,
    rear: null,
    left: null,
    right: null,
    interiorFront: null,
    interiorBack: null
  });

  const [photoStep, setPhotoStep] = useState<"photos" | "completed" | "skipped">("photos");
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  /** Slots que fallaron en el último intento de subida — habilita reintento puntual. */
  const [failedSlots, setFailedSlots] = useState<Set<PhotoSlotId>>(new Set());
  /** Slots que ya están persistidos en el backend — no se re-suben en un retry. */
  const [uploadedSlots, setUploadedSlots] = useState<Set<PhotoSlotId>>(new Set());

  // Clean up Object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      Object.values(previews).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [previews]);

  const handleFileChange = (slot: PhotoSlotId, file: File | null) => {
    setPhotos(prev => ({ ...prev, [slot]: file }));
    setPreviews(prev => {
      if (prev[slot]) {
        URL.revokeObjectURL(prev[slot]!);
      }
      return {
        ...prev,
        [slot]: file ? URL.createObjectURL(file) : null
      };
    });
    // Al cambiar/borrar la foto, sale del estado de "fallida"
    setFailedSlots(prev => {
      if (!prev.has(slot)) return prev;
      const next = new Set(prev);
      next.delete(slot);
      return next;
    });
  };

  /**
   * Sube las fotos cargadas al backend, una a una.
   * - Las marca como PhotoType.Before (fotos del ingreso).
   * - Usa el label del slot ("Frente / Delantera", etc.) como caption — eso permite
   *   ordenarlas y mostrarlas con su nombre en las pantallas posteriores.
   * - Si alguna falla, queda registrada en failedSlots para reintento puntual; las que
   *   sí subieron no se vuelven a subir.
   */
  const handleSavePhotos = async () => {
    if (!order) {
      toast.error("La orden no está disponible todavía. Esperá un momento y reintentá.");
      return;
    }

    // Solo subir las que tienen archivo Y no fueron ya subidas exitosamente.
    // Esto evita duplicados si el usuario reintenta tras una falla parcial.
    const toUpload = slots
      .filter(slot => photos[slot.id] !== null && !uploadedSlots.has(slot.id))
      .map(slot => ({ slot, file: photos[slot.id]! }));

    if (toUpload.length === 0) return;

    setIsSaving(true);
    setSaveProgress(0);
    setFailedSlots(new Set());

    const failed = new Set<PhotoSlotId>();
    const succeeded = new Set<PhotoSlotId>(uploadedSlots);
    let completedCount = 0;

    for (const { slot, file } of toUpload) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("photoType", String(PhotoType.Before));
        formData.append("caption", slot.label);

        await workOrdersService.addPhoto(order.id, formData);
        succeeded.add(slot.id);
      } catch (err) {
        console.error(`Falló la subida de ${slot.id}:`, err);
        failed.add(slot.id);
      } finally {
        completedCount++;
        setSaveProgress(Math.round((completedCount / toUpload.length) * 100));
      }
    }

    setUploadedSlots(succeeded);
    setIsSaving(false);

    if (failed.size === 0) {
      toast.success(`${toUpload.length} foto${toUpload.length === 1 ? "" : "s"} guardada${toUpload.length === 1 ? "" : "s"} correctamente`);
      setPhotoStep("completed");
    } else {
      setFailedSlots(failed);
      const successCount = toUpload.length - failed.size;
      toast.error(
        successCount > 0
          ? `Se guardaron ${successCount} de ${toUpload.length}. ${failed.size} falló${failed.size === 1 ? "" : "n"} — revisá la conexión y reintentá.`
          : "No se pudo guardar ninguna foto. Revisá la conexión y reintentá."
      );
    }
  };

  const slots: PhotoSlot[] = [
    {
      id: "front",
      label: "Frente / Delantera",
      description: "Paragolpes, patente y capot",
      icon: (
        <svg className="w-10 h-10 stroke-[1.25]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
        <svg className="w-10 h-10 stroke-[1.25]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
        <svg className="w-10 h-10 stroke-[1.25]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
        <svg className="w-10 h-10 stroke-[1.25]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
        <svg className="w-10 h-10 stroke-[1.25]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
        <svg className="w-10 h-10 stroke-[1.25]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M4 16h16v3H4z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 16V9a2 2 0 012-2h3a2 2 0 012 2v7M11 16V9a2 2 0 012-2h3a2 2 0 012 2v7" strokeLinecap="round" />
          <rect x="6.5" y="4" width="2" height="2" rx="0.5" />
          <rect x="13.5" y="4" width="2" height="2" rx="0.5" />
        </svg>
      )
    }
  ];

  const uploadedCount = Object.values(photos).filter(Boolean).length;
  const isProgressComplete = uploadedCount === 6;
  const progressPercentage = (uploadedCount / 6) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Alert Header — verde si la orden cargó, rojo si falló */}
      <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden">
        {error && !order ? (
          <div className="bg-red-50 border-b border-red-100 px-6 py-5 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h1 className="text-lg font-bold text-red-900">
                No se pudo cargar la orden
              </h1>
              <p className="text-sm text-red-800/80 mt-0.5">{error}</p>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-5 flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h1 className="text-lg font-bold text-emerald-900">
                Orden creada correctamente
              </h1>
              <p className="text-sm text-emerald-800/80 mt-0.5">
                El cliente y vehículo quedaron registrados. El taller ya puede tomar el trabajo.
              </p>
            </div>
          </div>
        )}

        {/* Order Details */}
        <div className="px-6 py-5 space-y-4">
          {loading && (
            <p className="text-sm text-[#44474c]">Cargando detalle...</p>
          )}

          {order && (
            <div className="bg-[#f8f9fa] rounded-xl p-4 border border-[#c4c6cd]/50 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              <Row label="ID de orden"      value={order.id} mono />
              <Row label="Vehículo"         value={[order.vehicleBrand, order.vehicleModel].filter(Boolean).join(" ") || "—"} />
              <Row label="Patente"          value={order.vehicleLicensePlate ?? "—"} />
              <Row label="Propietario"      value={order.ownerName ?? "—"} />
              <Row label="Kilometraje"      value={order.mileageAtEntry != null ? `${order.mileageAtEntry.toLocaleString("es-AR")} km` : "—"} />
              {order.contactPersonName && (
                <Row label="Contacto"       value={`${order.contactPersonName}${order.contactPersonPhone ? " — " + order.contactPersonPhone : ""}`} />
              )}
              {order.customerNote && (
                <div className="md:col-span-2">
                  <Row label="Nota del cliente" value={order.customerNote} />
                </div>
              )}
              <div className="md:col-span-2 border-t border-[#c4c6cd]/30 pt-2 mt-1">
                <Row label="Creada"           value={new Date(order.createdAt).toLocaleString("es-AR")} />
              </div>
            </div>
          )}
        </div>

        {/* --- STEP 1: UPLOADING PHOTOS --- */}
        {/* Sin orden cargada no se puede subir nada: ocultamos el paso de fotos. */}
        {order && photoStep === "photos" && (
          <div className="border-t border-[#c4c6cd]/50 px-6 py-6 bg-[#fcfdff] space-y-6">
            {/* Reception Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#fea520]/10 text-[#fea520] p-1.5 rounded-lg">
                    <Camera className="w-5 h-5" />
                  </span>
                  <h2 className="text-base font-bold text-[#041627]">
                    Registro Fotográfico Obligatorio
                  </h2>
                </div>
                <p className="text-xs text-[#44474c]/80 mt-1">
                  Suba 6 fotos obligatorias para registrar el estado cosmético de ingreso del automóvil.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  isProgressComplete 
                    ? "bg-emerald-100 text-emerald-800" 
                    : "bg-[#fea520]/10 text-[#041627] font-bold"
                }`}>
                  Fotos: {uploadedCount} de 6
                </span>
                {isProgressComplete && (
                  <Sparkles className="w-4 h-4 text-[#fea520] animate-pulse" />
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
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

            {/* Photo Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {slots.map((slot) => {
                const preview = previews[slot.id];
                const hasFailed = failedSlots.has(slot.id);
                const isUploaded = uploadedSlots.has(slot.id);
                return (
                  <div
                    key={slot.id}
                    className={`relative flex flex-col items-center justify-center rounded-xl border-2 transition-all overflow-hidden aspect-[4/3] group ${
                      hasFailed
                        ? "border-red-500 bg-[#041627]"
                        : isUploaded
                          ? "border-emerald-500 bg-[#041627]"
                          : preview
                            ? "border-[#fea520]/60 bg-[#041627]"
                            : "border-dashed border-[#c4c6cd] hover:border-[#fea520] hover:bg-slate-50/50 bg-white"
                    }`}
                  >
                    {preview ? (
                      <>
                        {/* Selected Photo Image */}
                        <img 
                          src={preview} 
                          alt={slot.label} 
                          className="w-full h-full object-cover"
                        />
                        {/* Premium Overlay Actions */}
                        <div className="absolute inset-0 bg-[#041627]/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                          <span className="text-white text-xs font-semibold text-center mb-1 drop-shadow-sm px-1 truncate w-full">
                            {slot.label}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.getElementById(`input-${slot.id}`) as HTMLInputElement;
                                if (input) input.click();
                              }}
                              className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-lg transition-colors"
                              title="Cambiar foto"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFileChange(slot.id, null)}
                              className="p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-colors"
                              title="Borrar foto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {/* Small Corner Badge — error / guardada / lista para subir */}
                        {hasFailed ? (
                          <span className="absolute bottom-2 right-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            ERROR
                          </span>
                        ) : isUploaded ? (
                          <span className="absolute bottom-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            GUARDADA
                          </span>
                        ) : (
                          <span className="absolute bottom-2 right-2 bg-[#fea520] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                            LISTA
                          </span>
                        )}
                      </>
                    ) : (
                      /* Empty Upload Slot */
                      <label
                        htmlFor={`input-${slot.id}`}
                        className="w-full h-full flex flex-col items-center justify-center p-2 sm:p-3 cursor-pointer text-center select-none"
                      >
                        <div className="text-slate-400 group-hover:text-[#fea520] transition-colors mb-1.5 sm:mb-2 [&>svg]:w-8 [&>svg]:h-8 sm:[&>svg]:w-10 sm:[&>svg]:h-10">
                          {slot.icon}
                        </div>
                        <span className="text-xs font-bold text-[#041627] block max-w-full px-1 leading-tight">
                          {slot.label}
                        </span>
                        <span className="text-[10px] text-[#44474c]/70 hidden sm:block mt-0.5 leading-tight max-w-full truncate">
                          {slot.description}
                        </span>
                        <div className="mt-2.5 hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-[#fea520] bg-[#fea520]/10 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <Upload className="w-2.5 h-2.5" />
                          Subir
                        </div>
                      </label>
                    )}

                    {/* Hidden Native File Input with camera capture properties */}
                    <input 
                      id={`input-${slot.id}`}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        handleFileChange(slot.id, file);
                      }}
                      className="hidden"
                    />
                  </div>
                );
              })}
            </div>

            {/* Upload Step Actions */}
            <div className="pt-3 border-t border-[#c4c6cd]/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setPhotoStep("skipped")}
                className="w-full sm:w-auto text-xs font-bold text-[#44474c]/70 hover:text-red-600 px-4 py-2.5 rounded-lg border border-[#c4c6cd]/80 hover:border-red-200 transition-colors text-center order-2 sm:order-1"
              >
                Saltar este paso por ahora
              </button>

              <button
                type="button"
                disabled={uploadedCount === 0 || isSaving || !order}
                onClick={handleSavePhotos}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-bold disabled:opacity-40 transition-colors shadow-sm order-1 sm:order-2 ${
                  failedSlots.size > 0
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-[#041627] hover:bg-[#102d4d] text-white"
                }`}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Guardando ({saveProgress}%)</span>
                  </>
                ) : failedSlots.size > 0 ? (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Reintentar fotos fallidas ({failedSlots.size})</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#fea520]" />
                    <span>Confirmar y Guardar Registro</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 2A: PHOTO UPLOAD COMPLETED BANNER --- */}
        {photoStep === "completed" && (
          <div className="border-t border-[#c4c6cd]/50 px-6 py-6 bg-emerald-50/20 space-y-5">
            <div className="flex items-start gap-3 bg-emerald-50/60 border border-emerald-100 rounded-xl p-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-emerald-900">
                  ¡Registro cosmético guardado correctamente!
                </h3>
                <p className="text-xs text-emerald-800/80 mt-0.5">
                  Las 6 fotografías del vehículo fueron vinculadas a esta orden de ingreso. Quedarán archivadas como respaldo visual.
                </p>
              </div>
            </div>

            {/* Thumbnail Carousel / Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {slots.map((slot) => {
                const preview = previews[slot.id];
                return (
                  <div key={slot.id} className="relative rounded-lg overflow-hidden border border-[#c4c6cd]/60 aspect-square group shadow-sm bg-[#041627]">
                    {preview && (
                      <img 
                        src={preview} 
                        alt={slot.label} 
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-[#041627]/85 py-0.5 px-1 text-center">
                      <span className="text-[8px] font-bold text-white uppercase tracking-tight block truncate">
                        {slot.label.split(" ")[0]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- STEP 2B: PHOTO UPLOAD SKIPPED BANNER --- */}
        {photoStep === "skipped" && (
          <div className="border-t border-[#c4c6cd]/50 px-6 py-5 bg-amber-50/15 space-y-4">
            <div className="flex items-start gap-3 bg-amber-50/50 border border-amber-200/50 rounded-xl p-4">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  Registro fotográfico omitido
                </h3>
                <p className="text-xs text-amber-800/80 mt-0.5">
                  No se cargaron imágenes en esta ocasión. Podrá completar el registro fotográfico del estado de ingreso más adelante desde la ficha de la orden.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Final Classic Actions */}
        <div className="border-t border-[#c4c6cd]/60 px-6 py-4 flex flex-wrap gap-3 justify-between items-center bg-[#eefcfd]/40 print:hidden">
          <div>
            {photoStep === "photos" ? (
              <span className="text-xs font-medium text-[#44474c]/60">
                ⚠️ Por favor complete el paso fotográfico antes de imprimir.
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Paso fotográfico finalizado
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Tanto admin como recepción pueden entrar a la ficha (/admin/work-orders no es
                admin-only en el proxy). Es la vía para completar las fotos si se saltó el paso. */}
            {order && (
              <Link
                href={`/admin/work-orders/${order.id}`}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border border-[#041627] text-[#041627] hover:bg-slate-50 transition-colors ${
                  photoStep === "photos"
                    ? "opacity-40 cursor-not-allowed pointer-events-none"
                    : ""
                }`}
              >
                Ver Ficha de Orden
              </Link>
            )}
            <button
              onClick={() => window.print()}
              disabled={!order || photoStep === "photos"}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border border-[#c4c6cd] text-[#041627] hover:bg-white disabled:opacity-40 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir Ficha
            </button>
            <Link
              href={role === "admin" ? "/admin/intake" : "/reception/intake"}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${
                photoStep === "photos"
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed pointer-events-none"
                  : "bg-[#fea520] text-[#041627] hover:bg-[#865300] hover:text-white"
              }`}
            >
              <Plus className="w-4 h-4" />
              Cargar otra orden
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col sm:grid sm:grid-cols-[140px_1fr] gap-1 sm:gap-3 items-baseline py-1">
      <span className="text-xs font-bold uppercase tracking-wider text-[#44474c]/70">{label}</span>
      <span className={`text-sm text-[#041627] ${mono ? "font-mono bg-white px-2 py-0.5 rounded border border-[#c4c6cd]/50 shadow-2xs font-semibold" : "font-medium"}`}>{value}</span>
    </div>
  );
}
