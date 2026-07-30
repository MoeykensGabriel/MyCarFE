"use client";

import { useState } from "react";
import { AlertCircle, X, Check, AlertTriangle, Layers } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";

import { useCreateInspectionReport, useUpdateInspectionReport } from "@/hooks/useInspections";
import { workOrdersService } from "@/services/work-orders.service";
import { PhotoType } from "@/lib/enums";
import {
  TireInspectionInput,
  BatteryInspectionInput,
  InspectionReport,
  OilInspectionInput,
  PendingInspection,
  PendingInspectionArea,
  ProblemDetails,
} from "@/types/api.types";

import {
  reportSchema,
  ReportFormInput,
  ReportFormOutput,
  createTireRows,
  buildTirePayload,
  TireRow,
  createBatteryState,
  buildBatteryPayload,
  batteryStatusFromPct,
  BatteryFormState,
  createOilState,
  buildOilPayload,
  OilFormState,
} from "./report-form";
import { TiresSection } from "./TiresSection";
import { BatterySection } from "./BatterySection";
import { OilSection } from "./OilSection";
import { PhotosSection } from "./PhotosSection";
import { ProposalsSection } from "./ProposalsSection";

interface Props {
  inspection: PendingInspection;
  area: PendingInspectionArea;
  /**
   * Si viene, el modal entra en modo edición sobre ese reporte en vez de crear uno nuevo.
   * Solo se editan problema + novedades + propuestas: las mediciones (cubiertas, batería,
   * aceite) y las fotos son eventos históricos del vehículo, no parte editable del reporte,
   * y el endpoint de update ni siquiera los acepta.
   */
  existingReport?: InspectionReport;
  onClose: () => void;
}

/** Invierte el cálculo de minutos del submit: 1 día laboral = 480 min. */
function splitDuration(minutes?: number | null): { estimatedDays: number; estimatedHours: number } {
  const total = minutes ?? 0;
  return {
    estimatedDays:  Math.floor(total / 480),
    estimatedHours: Math.round((total % 480) / 60),
  };
}

/**
 * Modal del reporte de inspección por área. Orquesta el form base (problema +
 * novedades + propuestas) y las secciones específicas según el área del mecánico:
 * cubiertas, batería, aceite. Las fotos se suben después de crear el reporte.
 *
 * Con `existingReport` funciona como editor: el mecánico corrige lo suyo y el admin
 * corrige el de cualquiera, siempre que la orden siga en fase de inspección.
 */
export function ReportFormModal({ inspection, area, existingReport, onClose }: Props) {
  const isEditing = !!existingReport;

  const createReport = useCreateInspectionReport();
  const updateReport = useUpdateInspectionReport();
  const [serverError, setServerError] = useState<string | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const submitting = isEditing ? updateReport.isPending : createReport.isPending;

  // ── Estado de las secciones específicas por área ──────────────────────────────
  const [tireRows, setTireRows] = useState<TireRow[]>(createTireRows);
  const updateTireRow = (index: number, field: keyof TireRow, value: string) =>
    setTireRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );

  const [batteryEnabled, setBatteryEnabled] = useState(false);
  const [battery, setBattery] = useState<BatteryFormState>(createBatteryState);
  const updateBattery = (field: keyof BatteryFormState, value: string) =>
    setBattery((prev) => {
      const next = { ...prev, [field]: value };
      // Forzamos el estado según la remanencia medida con tester: evita la
      // inconsistencia de "Buena con 10%". Si se borra el %, el estado vuelve a
      // ser editable a mano (caso sin medición).
      if (field === "remainingPercentage" && value.trim() !== "") {
        const pct = Math.round(Number(value));
        if (Number.isFinite(pct)) {
          next.status = String(batteryStatusFromPct(pct));
        }
      }
      return next;
    });

  const [oilEnabled, setOilEnabled] = useState(false);
  const [oil, setOil] = useState<OilFormState>(createOilState);
  const updateOil = (field: keyof OilFormState, value: string | boolean) =>
    setOil((prev) => ({ ...prev, [field]: value }));

  // ── Form base ─────────────────────────────────────────────────────────────────
  const form = useForm<ReportFormInput, unknown, ReportFormOutput>({
    resolver: zodResolver(reportSchema),
    defaultValues: existingReport
      ? {
          hasIssue: existingReport.hasIssue,
          findings: existingReport.findings ?? "",
          proposedServices: existingReport.proposedServices.map((s) => ({
            name:               s.name,
            description:        s.description ?? "",
            estimatedLaborCost: s.estimatedLaborCost,
            ...splitDuration(s.estimatedDurationMinutes),
          })),
          proposedParts: existingReport.proposedParts.map((p) => ({
            name:     p.name,
            quantity: p.quantity,
          })),
        }
      : { hasIssue: false, findings: "", proposedServices: [], proposedParts: [] },
  });
  const { register, handleSubmit, watch, setValue, formState: { errors } } = form;

  const hasIssue = watch("hasIssue");

  // Combinar días + horas a minutos. Si queda 0, no se estima (undefined).
  const buildProposedServices = (data: ReportFormOutput) =>
    data.proposedServices.map((s) => {
      const minutes = (s.estimatedDays ?? 0) * 480 + (s.estimatedHours ?? 0) * 60;
      return {
        name:                     s.name,
        description:              s.description,
        estimatedLaborCost:       s.estimatedLaborCost,
        estimatedDurationMinutes: minutes > 0 ? minutes : undefined,
      };
    });

  const reportServerError = (err: unknown, fallback: string) => {
    const axiosErr = err as AxiosError<ProblemDetails>;
    setServerError(
      axiosErr.response?.data?.detail ?? axiosErr.response?.data?.title ?? fallback,
    );
  };

  const onSubmitEdit = (data: ReportFormOutput) => {
    setServerError(null);
    updateReport.mutate(
      {
        id: existingReport!.id,
        data: {
          id:       existingReport!.id,
          hasIssue: data.hasIssue,
          findings: data.findings?.trim() || undefined,
          proposedServices: data.hasIssue ? buildProposedServices(data) : undefined,
          proposedParts:    data.hasIssue ? data.proposedParts          : undefined,
        },
      },
      {
        onSuccess: onClose,
        onError: (err) => reportServerError(err, "Error al guardar los cambios"),
      },
    );
  };

  const onSubmit = (data: ReportFormOutput) => {
    setServerError(null);

    let tires: TireInspectionInput[] | undefined;
    if (area.isTireArea) {
      const built = buildTirePayload(tireRows);
      if ("error" in built) {
        setServerError(built.error);
        return;
      }
      tires = built.tires.length > 0 ? built.tires : undefined;
    }

    let batteryPayload: BatteryInspectionInput | undefined;
    if (area.isBatteryArea && batteryEnabled) {
      batteryPayload = buildBatteryPayload(battery);
    }

    let oilPayload: OilInspectionInput | undefined;
    if (area.isOilArea && oilEnabled) {
      oilPayload = buildOilPayload(oil);
    }

    createReport.mutate(
      {
        workOrderId: inspection.workOrderId,
        areaId:      area.areaId,
        hasIssue:    data.hasIssue,
        findings:    data.findings?.trim() || undefined,
        proposedServices: data.hasIssue ? buildProposedServices(data) : undefined,
        proposedParts:    data.hasIssue ? data.proposedParts          : undefined,
        tires,
        battery:     batteryPayload,
        oil:         oilPayload,
      },
      {
        onSuccess: async (report) => {
          // Si hay fotos seleccionadas, las subimos una por una vinculadas al reporte recién creado.
          if (photoFiles.length > 0) {
            setUploading(true);
            try {
              for (const file of photoFiles) {
                const fd = new FormData();
                fd.append("file", file);
                fd.append("photoType", String(PhotoType.Inspection));
                fd.append("inspectionReportId", report.id);
                await workOrdersService.addPhoto(inspection.workOrderId, fd);
              }
            } catch (err) {
              const axiosErr = err as AxiosError<ProblemDetails>;
              setServerError(
                axiosErr.response?.data?.detail
                  ?? axiosErr.response?.data?.title
                  ?? "El reporte se creó pero falló la subida de fotos.",
              );
              setUploading(false);
              return; // dejamos el modal abierto para que reintente la subida
            }
            setUploading(false);
          }
          onClose();
        },
        onError: (err) => reportServerError(err, "Error al enviar el reporte"),
      },
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-[fadeIn_0.2s_ease-out]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[92dvh] sm:max-h-[88dvh]"
      >
        {/* Top Indicator bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#fea520] to-[#fec15d]" />

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4.5 border-b border-[#041627]/5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#fea520]/10 flex items-center justify-center shrink-0">
              <Layers className="w-4.5 h-4.5 text-[#fea520]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#fea520] leading-none">
                {isEditing ? "Editar reporte" : "Reportar Área"}
              </p>
              <h2 className="text-sm font-black text-[#041627] truncate mt-1">
                {area.areaName}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#44474c] hover:bg-[#f4f6f8] transition-colors shrink-0"
            aria-label="Cerrar"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Vehicle Quick Info Strip */}
        <div className="shrink-0 bg-[#f4f6f8] px-5 py-3 border-b border-[#041627]/5 flex items-center justify-between">
          <p className="text-xs font-bold text-[#041627]/80">
            {inspection.vehicleBrand} {inspection.vehicleModel}
          </p>
          <span className="text-[10px] font-extrabold font-mono text-[#041627] bg-[#fea520]/15 px-2 py-0.5 rounded border border-[#fea520]/30">
            {inspection.vehicleLicensePlate}
          </span>
        </div>

        <form
          onSubmit={handleSubmit(isEditing ? onSubmitEdit : onSubmit)}
          className="flex flex-col min-h-0 flex-1 overflow-hidden"
          noValidate
        >
          {isEditing && (
            <div className="shrink-0 px-5 pt-4">
              <p className="text-[11px] text-[#44474c] bg-[#eefcfd] border border-[#c4c6cd] rounded-lg px-3 py-2 leading-relaxed">
                Estás corrigiendo el reporte de{" "}
                <strong className="text-[#041627]">
                  {existingReport?.mechanicFullName ?? "la oficina"}
                </strong>
                . La autoría no cambia — solo el contenido.
              </p>
            </div>
          )}
          {/* Cuerpo scrolleable — clave para que el modal no se desborde en mobile */}
          <div className="px-5 py-5 space-y-5 overflow-y-auto flex-1 min-h-0">
          {/* HasIssue toggle: dos botones controlados que setean el field via setValue */}
          <input type="hidden" {...register("hasIssue")} />
          <div className="space-y-2">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627]">
              ¿Encontraste algún problema?
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setValue("hasIssue", false, { shouldValidate: true })}
                className={`flex items-center justify-center gap-1.5 py-3.5 rounded-xl border-2 text-xs font-extrabold uppercase tracking-wider transition-all duration-300 ${
                  !hasIssue
                    ? "bg-emerald-50 border-emerald-500 text-emerald-950 shadow-sm shadow-emerald-500/5 ring-1 ring-emerald-500"
                    : "bg-white border-[#041627]/10 text-[#44474c] hover:border-[#fea520]/40"
                }`}
              >
                <Check className="w-4 h-4 text-emerald-500 shrink-0" strokeWidth={2.5} />
                Sin novedades
              </button>
              <button
                type="button"
                onClick={() => setValue("hasIssue", true, { shouldValidate: true })}
                className={`flex items-center justify-center gap-1.5 py-3.5 rounded-xl border-2 text-xs font-extrabold uppercase tracking-wider transition-all duration-300 ${
                  hasIssue
                    ? "bg-red-50 border-red-500 text-red-950 shadow-sm shadow-red-500/5 ring-1 ring-red-500"
                    : "bg-white border-[#041627]/10 text-[#44474c] hover:border-[#fea520]/40"
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" strokeWidth={2.5} />
                Hay problema
              </button>
            </div>
          </div>

          {/* Findings */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627] flex items-center gap-1">
              Novedades o detalles {hasIssue && <span className="text-red-500 normal-case">*</span>}
            </label>
            <textarea
              rows={4}
              placeholder={
                hasIssue
                  ? "Describí en detalle lo que encontraste — qué está mal, qué repuestos necesitás, qué trabajo va a requerir. Esta info la usa el administrador para cotizar."
                  : "Opcional: alguna observación sobre la revisión (estado general, etc.)"
              }
              className={`w-full px-3.5 py-3 text-sm rounded-xl border bg-white text-[#041627] placeholder:text-[#44474c]/40 focus:outline-none focus:ring-2 focus:ring-[#fea520]/20 focus:border-[#fea520] transition-all resize-none shadow-inner ${
                errors.findings ? "border-red-400 focus:ring-red-200" : "border-[#041627]/10"
              }`}
              {...register("findings")}
            />
            {errors.findings ? (
              <p className="text-[10px] font-bold text-red-500 pl-0.5">{errors.findings.message}</p>
            ) : (
              <p className="text-[10px] font-semibold text-[#44474c]/70 pl-0.5">
                {hasIssue
                  ? "Requerido. Sé descriptivo para una cotización precisa."
                  : "Opcional. Visibilidad para el taller y cliente."}
              </p>
            )}
          </div>

          {/* ── Secciones específicas según el área del mecánico ────────────
              Solo al crear: mediciones y fotos son eventos históricos del vehículo
              que ya quedaron registrados, y el endpoint de update no los recibe. */}
          {!isEditing && area.isTireArea && (
            <TiresSection rows={tireRows} onUpdate={updateTireRow} />
          )}

          {!isEditing && area.isBatteryArea && (
            <BatterySection
              enabled={batteryEnabled}
              onEnabledChange={setBatteryEnabled}
              battery={battery}
              onUpdate={updateBattery}
            />
          )}

          {!isEditing && area.isOilArea && (
            <OilSection
              enabled={oilEnabled}
              onEnabledChange={setOilEnabled}
              oil={oil}
              onUpdate={updateOil}
              mileageAtEntry={inspection.mileageAtEntry}
            />
          )}

          {!isEditing && (
            <PhotosSection
              files={photoFiles}
              onAdd={(picked) => setPhotoFiles((prev) => [...prev, ...picked])}
              onRemove={(index) => setPhotoFiles((prev) => prev.filter((_, i) => i !== index))}
            />
          )}

          {/* ── Propuestas (solo si hay problema) ──────────────────────────── */}
          {hasIssue && <ProposalsSection form={form} />}

          {serverError && (
            <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 p-3.5 animate-[fadeIn_0.2s_ease-out]">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-red-700">{serverError}</p>
            </div>
          )}
          </div>

          {/* Footer fijo — siempre visible aunque el cuerpo scrollee */}
          <div className="shrink-0 flex gap-2 px-5 py-4 border-t border-[#041627]/5 bg-white">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting || uploading}
              className="flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider border border-[#041627]/10 text-[#041627] hover:bg-[#f4f6f8] active:scale-[0.98] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#fea520] to-[#fec15d] text-[#041627] hover:shadow-md hover:shadow-[#fea520]/10 active:scale-[0.98] transition-all shadow-md shadow-[#fea520]/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEditing
                ? submitting ? "Guardando..." : "Guardar cambios"
                : submitting ? "Enviando..." : uploading ? "Subiendo fotos..." : "Enviar reporte"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
