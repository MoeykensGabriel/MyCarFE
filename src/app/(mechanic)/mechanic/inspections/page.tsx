"use client";

import { useState } from "react";
import {
  ClipboardCheck,
  Car,
  User,
  AlertCircle,
  X,
  Check,
  AlertTriangle,
  Layers,
  Calendar,
  Gauge,
  Plus,
  Trash2,
  Wrench,
  Package,
  BatteryCharging,
} from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";

import {
  useMyPendingInspections,
  useCreateInspectionReport,
} from "@/hooks/useInspections";
import { workOrdersService } from "@/services/work-orders.service";
import { PhotoType, TirePosition, TirePositionLabel, BatteryStatus, BatteryStatusLabel } from "@/lib/enums";
import { TireInspectionInput, BatteryInspectionInput } from "@/types/api.types";
import { formatDateTime, formatCurrency } from "@/lib/format";
import {
  PendingInspection,
  PendingInspectionArea,
  ProblemDetails,
} from "@/types/api.types";

// ─── Schema del form ──────────────────────────────────────────────────────────

const proposedServiceSchema = z.object({
  name: z.string().min(1, "Requerido").max(200),
  description: z.string().max(2000).optional(),
  estimatedLaborCost: z.coerce.number().min(0, "Debe ser >= 0"),
  estimatedDays: z.coerce.number().int().positive("Debe ser > 0").optional(),
});

const proposedPartSchema = z.object({
  name: z.string().min(1, "Requerido").max(200),
  quantity: z.coerce.number().int().positive("Debe ser > 0"),
});

const reportSchema = z
  .object({
    hasIssue: z.boolean(),
    findings: z.string().max(4000, "Máximo 4000 caracteres").optional(),
    proposedServices: z.array(proposedServiceSchema).default([]),
    proposedParts: z.array(proposedPartSchema).default([]),
  })
  .refine((d) => !d.hasIssue || (d.findings && d.findings.trim().length > 0), {
    message: "Describí lo que encontraste cuando marcás que hay un problema.",
    path: ["findings"],
  });

type ReportFormInput  = z.input<typeof reportSchema>;
type ReportFormOutput = z.output<typeof reportSchema>;

// ─── Control de cubiertas ──────────────────────────────────────────────────────

const TIRE_POSITIONS: TirePosition[] = [
  TirePosition.FrontLeft,
  TirePosition.FrontRight,
  TirePosition.RearLeft,
  TirePosition.RearRight,
];

/** Fila editable de cubierta en el form. Campos como string para el input controlado. */
type TireRow = {
  position: TirePosition;
  inner: string;
  center: string;
  outer: string;
  brand: string;
  model: string;
  sizeSpec: string;
  notes: string;
};

/**
 * Convierte las filas a payload, tomando solo las que tienen las 3 profundidades cargadas
 * (la medición de 3 puntos es lo mínimo del control). Devuelve un error de validación
 * si alguna fila tiene profundidades a medias.
 */
function buildTirePayload(
  rows: TireRow[],
): { tires: TireInspectionInput[] } | { error: string } {
  const tires: TireInspectionInput[] = [];

  for (const row of rows) {
    const filled = [row.inner, row.center, row.outer].filter((v) => v.trim() !== "");
    if (filled.length === 0) continue; // posición no revisada → se omite
    if (filled.length < 3) {
      return {
        error: `Completá las 3 profundidades (interior, centro, exterior) de la cubierta ${TirePositionLabel[row.position]}.`,
      };
    }

    tires.push({
      position: row.position,
      innerDepthMm: Number(row.inner),
      centerDepthMm: Number(row.center),
      outerDepthMm: Number(row.outer),
      brand: row.brand.trim() || undefined,
      model: row.model.trim() || undefined,
      sizeSpec: row.sizeSpec.trim() || undefined,
      notes: row.notes.trim() || undefined,
    });
  }

  return { tires };
}

// ─── Modal de reporte ─────────────────────────────────────────────────────────

function ReportFormModal({
  inspection,
  area,
  onClose,
}: {
  inspection: PendingInspection;
  area: PendingInspectionArea;
  onClose: () => void;
}) {
  const createReport = useCreateInspectionReport();
  const [serverError, setServerError] = useState<string | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  // ── Control de cubiertas (solo si el área es de cubiertas) ───────────────────
  const isTireArea = area.isTireArea;
  const [tireRows, setTireRows] = useState<TireRow[]>(() =>
    TIRE_POSITIONS.map((position) => ({
      position,
      inner: "",
      center: "",
      outer: "",
      brand: "",
      model: "",
      sizeSpec: "",
      notes: "",
    })),
  );

  const updateTireRow = (index: number, field: keyof TireRow, value: string) =>
    setTireRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );

  // ── Control de batería (solo si el área es de batería) ───────────────────────
  const isBatteryArea = area.isBatteryArea;
  const [batteryEnabled, setBatteryEnabled] = useState(false);
  const [battery, setBattery] = useState({
    status: String(BatteryStatus.Good),
    voltage: "",
    brand: "",
    manufacturedOn: "",
    notes: "",
  });
  const updateBattery = (field: keyof typeof battery, value: string) =>
    setBattery((prev) => ({ ...prev, [field]: value }));

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<ReportFormInput, unknown, ReportFormOutput>({
    resolver: zodResolver(reportSchema),
    defaultValues: { hasIssue: false, findings: "", proposedServices: [], proposedParts: [] },
  });

  const servicesArr = useFieldArray({ control, name: "proposedServices" });
  const partsArr    = useFieldArray({ control, name: "proposedParts" });

  const hasIssue = watch("hasIssue");

  // Totales estimados en vivo — solo informativos para el mecánico, no se envían.
  const watchedServices = watch("proposedServices");
  const servicesTotal = (watchedServices ?? []).reduce(
    (sum, s) => sum + (Number(s?.estimatedLaborCost) || 0),
    0,
  );

  const onSubmit = (data: ReportFormOutput) => {
    setServerError(null);

    let tires: TireInspectionInput[] | undefined;
    if (isTireArea) {
      const built = buildTirePayload(tireRows);
      if ("error" in built) {
        setServerError(built.error);
        return;
      }
      tires = built.tires.length > 0 ? built.tires : undefined;
    }

    let batteryPayload: BatteryInspectionInput | undefined;
    if (isBatteryArea && batteryEnabled) {
      batteryPayload = {
        status:         Number(battery.status) as BatteryStatus,
        voltage:        battery.voltage.trim() === "" ? null : Number(battery.voltage),
        brand:          battery.brand.trim() || null,
        manufacturedOn: battery.manufacturedOn || null,
        notes:          battery.notes.trim() || null,
      };
    }

    createReport.mutate(
      {
        workOrderId: inspection.workOrderId,
        areaId:      area.areaId,
        hasIssue:    data.hasIssue,
        findings:    data.findings?.trim() || undefined,
        proposedServices: data.hasIssue ? data.proposedServices : undefined,
        proposedParts:    data.hasIssue ? data.proposedParts    : undefined,
        tires,
        battery:     batteryPayload,
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
        onError: (err) => {
          const axiosErr = err as AxiosError<ProblemDetails>;
          const detail = axiosErr.response?.data?.detail;
          const title = axiosErr.response?.data?.title;
          setServerError(detail ?? title ?? "Error al enviar el reporte");
        },
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
                Reportar Área
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

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col min-h-0 flex-1 overflow-hidden" noValidate>
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
                Sin hallazgos
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
              Hallazgos o detalles {hasIssue && <span className="text-red-500 normal-case">*</span>}
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

          {/* ── Control de cubiertas (solo área de cubiertas) ─────────────── */}
          {isTireArea && (
            <div className="space-y-3 border-t border-[#041627]/5 pt-4">
              <div className="flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-[#fea520]" />
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627]">
                  Control de cubiertas
                </p>
              </div>
              <p className="text-[10px] text-[#44474c]/70 leading-relaxed">
                Medí la profundidad de banda en 3 puntos (interior / centro / exterior) por posición.
                Dejá una posición vacía si no la revisaste. Marca y medida solo hacen falta si la
                cubierta todavía no está registrada.
              </p>

              {tireRows.map((row, i) => (
                <div key={row.position} className="bg-[#f4f6f8] p-2.5 rounded-lg space-y-2">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#041627]">
                    {TirePositionLabel[row.position]}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      placeholder="Interior (mm)"
                      className="px-2 py-1.5 text-xs rounded border border-[#041627]/10 bg-white"
                      value={row.inner}
                      onChange={(e) => updateTireRow(i, "inner", e.target.value)}
                    />
                    <input
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      placeholder="Centro (mm)"
                      className="px-2 py-1.5 text-xs rounded border border-[#041627]/10 bg-white"
                      value={row.center}
                      onChange={(e) => updateTireRow(i, "center", e.target.value)}
                    />
                    <input
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      placeholder="Exterior (mm)"
                      className="px-2 py-1.5 text-xs rounded border border-[#041627]/10 bg-white"
                      value={row.outer}
                      onChange={(e) => updateTireRow(i, "outer", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Marca"
                      className="px-2 py-1.5 text-xs rounded border border-[#041627]/10 bg-white"
                      value={row.brand}
                      onChange={(e) => updateTireRow(i, "brand", e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Modelo"
                      className="px-2 py-1.5 text-xs rounded border border-[#041627]/10 bg-white"
                      value={row.model}
                      onChange={(e) => updateTireRow(i, "model", e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder='Medida (ej. 185/65 R15)'
                      className="px-2 py-1.5 text-xs rounded border border-[#041627]/10 bg-white"
                      value={row.sizeSpec}
                      onChange={(e) => updateTireRow(i, "sizeSpec", e.target.value)}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Observaciones (opcional)"
                    className="w-full px-2 py-1.5 text-xs rounded border border-[#041627]/10 bg-white"
                    value={row.notes}
                    onChange={(e) => updateTireRow(i, "notes", e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* ── Control de batería (solo área de batería) ─────────────────── */}
          {isBatteryArea && (
            <div className="space-y-3 border-t border-[#041627]/5 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <BatteryCharging className="w-3.5 h-3.5 text-[#fea520]" />
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627]">
                    Control de batería
                  </p>
                </div>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#44474c] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={batteryEnabled}
                    onChange={(e) => setBatteryEnabled(e.target.checked)}
                    className="accent-[#fea520]"
                  />
                  Revisé la batería
                </label>
              </div>

              {batteryEnabled && (
                <div className="bg-[#f4f6f8] p-2.5 rounded-lg space-y-2">
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-[#44474c]/70">
                      Estado
                    </label>
                    <select
                      className="w-full px-2 py-1.5 text-xs rounded border border-[#041627]/10 bg-white"
                      value={battery.status}
                      onChange={(e) => updateBattery("status", e.target.value)}
                    >
                      {Object.entries(BatteryStatusLabel).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-wider text-[#44474c]/70">
                        Voltaje (V)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        inputMode="decimal"
                        placeholder="12.6"
                        className="w-full px-2 py-1.5 text-xs rounded border border-[#041627]/10 bg-white"
                        value={battery.voltage}
                        onChange={(e) => updateBattery("voltage", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-wider text-[#44474c]/70">
                        Marca
                      </label>
                      <input
                        type="text"
                        placeholder="Bosch, Moura..."
                        className="w-full px-2 py-1.5 text-xs rounded border border-[#041627]/10 bg-white"
                        value={battery.brand}
                        onChange={(e) => updateBattery("brand", e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-[#44474c]/70">
                      Fecha de fabricación (opcional)
                    </label>
                    <input
                      type="date"
                      className="w-full px-2 py-1.5 text-xs rounded border border-[#041627]/10 bg-white"
                      value={battery.manufacturedOn}
                      onChange={(e) => updateBattery("manufacturedOn", e.target.value)}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Observaciones (bornes sulfatados, etc.)"
                    className="w-full px-2 py-1.5 text-xs rounded border border-[#041627]/10 bg-white"
                    value={battery.notes}
                    onChange={(e) => updateBattery("notes", e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Fotos del área (foto del estado inicial) ──────────────────── */}
          <div className="space-y-2 border-t border-[#041627]/5 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627]">
                Fotos del área
              </p>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#fea520] hover:underline cursor-pointer">
                + Agregar foto
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    if (files.length > 0) setPhotoFiles((prev) => [...prev, ...files]);
                    e.target.value = ""; // permite re-seleccionar el mismo archivo
                  }}
                />
              </label>
            </div>
            {photoFiles.length === 0 ? (
              <p className="text-[10px] text-[#44474c]/60 italic">
                Sacá una foto del estado actual del área. Después del trabajo, sacarás una equivalente para tener antes/después.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {photoFiles.map((f, i) => (
                  <div key={`${f.name}-${i}`} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(f)}
                      alt={`Foto ${i + 1}`}
                      className="w-full aspect-square object-cover rounded-md border border-[#041627]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow"
                      aria-label="Quitar"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Propuestas (solo si hay problema) ──────────────────────────── */}
          {hasIssue && (
            <div className="space-y-5 border-t border-[#041627]/5 pt-4">
              <p className="text-[10px] text-[#44474c]/70 leading-relaxed bg-[#eefcfd]/60 border border-[#041627]/5 rounded-lg p-2.5">
                Podés sugerir <span className="font-bold text-[#041627]">varios servicios y varios repuestos</span>.
                Cargá cada uno con su precio aproximado — el administrador elige cuáles entran al presupuesto.
              </p>

              {/* ── Servicios sugeridos ─────────────────────────────────────── */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-[#fea520]" />
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627]">
                    Servicios sugeridos
                  </p>
                  {servicesArr.fields.length > 0 && (
                    <span className="text-[10px] font-bold text-[#44474c]/60">
                      ({servicesArr.fields.length})
                    </span>
                  )}
                </div>

                {servicesArr.fields.map((field, i) => (
                  <div key={field.id} className="bg-[#f4f6f8] p-3 rounded-xl space-y-2 border border-[#041627]/5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#041627]/70">
                        Servicio {i + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => servicesArr.remove(i)}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-700"
                        aria-label={`Eliminar servicio ${i + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Quitar
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-[#44474c]/70">
                        Nombre del trabajo
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Cambio de pastillas de freno"
                        className="w-full px-2.5 py-2 text-xs rounded-lg border border-[#041627]/10 bg-white"
                        {...register(`proposedServices.${i}.name`)}
                      />
                      {errors.proposedServices?.[i]?.name && (
                        <p className="text-[10px] text-red-500">{errors.proposedServices[i]?.name?.message}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-[#44474c]/70">
                        Detalle (opcional)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Aclaraciones del trabajo a realizar"
                        className="w-full px-2.5 py-2 text-xs rounded-lg border border-[#041627]/10 bg-white resize-none"
                        {...register(`proposedServices.${i}.description`)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-[#44474c]/70">
                          Mano de obra aprox ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          inputMode="decimal"
                          placeholder="0"
                          className="w-full px-2.5 py-2 text-xs rounded-lg border border-[#041627]/10 bg-white"
                          {...register(`proposedServices.${i}.estimatedLaborCost`)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-[#44474c]/70">
                          Días estim.
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          placeholder="—"
                          className="w-full px-2.5 py-2 text-xs rounded-lg border border-[#041627]/10 bg-white"
                          {...register(`proposedServices.${i}.estimatedDays`)}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    servicesArr.append({ name: "", description: "", estimatedLaborCost: 0, estimatedDays: undefined })
                  }
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-[#041627]/20 text-[11px] font-bold uppercase tracking-wider text-[#44474c]/70 hover:border-[#fea520] hover:text-[#fea520] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Agregar servicio
                </button>

                {servicesTotal > 0 && (
                  <p className="text-[10px] font-semibold text-[#44474c]/70 text-right">
                    Mano de obra estimada:{" "}
                    <span className="font-black text-[#041627]">{formatCurrency(servicesTotal)}</span>
                  </p>
                )}
              </div>

              {/* ── Repuestos sugeridos ─────────────────────────────────────── */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-[#fea520]" />
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627]">
                    Repuestos sugeridos
                  </p>
                  {partsArr.fields.length > 0 && (
                    <span className="text-[10px] font-bold text-[#44474c]/60">
                      ({partsArr.fields.length})
                    </span>
                  )}
                </div>

                {partsArr.fields.map((field, i) => (
                  <div key={field.id} className="bg-[#f4f6f8] p-3 rounded-xl space-y-2 border border-[#041627]/5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#041627]/70">
                        Repuesto {i + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => partsArr.remove(i)}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-700"
                        aria-label={`Eliminar repuesto ${i + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Quitar
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-[#44474c]/70">
                        Nombre del repuesto
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Juego de pastillas delanteras"
                        className="w-full px-2.5 py-2 text-xs rounded-lg border border-[#041627]/10 bg-white"
                        {...register(`proposedParts.${i}.name`)}
                      />
                      {errors.proposedParts?.[i]?.name && (
                        <p className="text-[10px] text-red-500">{errors.proposedParts[i]?.name?.message}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-[#44474c]/70">
                        Cantidad
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="1"
                        className="w-full px-2.5 py-2 text-xs rounded-lg border border-[#041627]/10 bg-white"
                        {...register(`proposedParts.${i}.quantity`)}
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    partsArr.append({ name: "", quantity: 1 })
                  }
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-[#041627]/20 text-[11px] font-bold uppercase tracking-wider text-[#44474c]/70 hover:border-[#fea520] hover:text-[#fea520] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Agregar repuesto
                </button>

              </div>
            </div>
          )}

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
              disabled={createReport.isPending || uploading}
              className="flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider border border-[#041627]/10 text-[#041627] hover:bg-[#f4f6f8] active:scale-[0.98] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createReport.isPending || uploading}
              className="flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#fea520] to-[#fec15d] text-[#041627] hover:shadow-md hover:shadow-[#fea520]/10 active:scale-[0.98] transition-all shadow-md shadow-[#fea520]/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createReport.isPending ? "Enviando..." : uploading ? "Subiendo fotos..." : "Enviar reporte"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Tarjeta de inspección ────────────────────────────────────────────────────

function InspectionCard({
  inspection,
  onPickArea,
}: {
  inspection: PendingInspection;
  onPickArea: (area: PendingInspectionArea) => void;
}) {
  const initials = `${inspection.vehicleBrand?.charAt(0) || ""}${inspection.vehicleModel?.charAt(0) || ""}`.toUpperCase();

  return (
    <article className="bg-white rounded-2xl border border-[#041627]/10 p-5 shadow-sm hover:border-[#fea520]/30 hover:shadow-md transition-all duration-300 relative overflow-hidden">
      {/* Vehículo Info */}
      <div className="flex items-center gap-3.5 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#041627] to-[#0a2540] border border-[#fea520]/20 flex items-center justify-center shrink-0 shadow-sm">
          <span className="text-xs font-black tracking-wider text-[#fea520]">
            {initials}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-extrabold text-[#041627] truncate leading-tight">
              {inspection.vehicleBrand} {inspection.vehicleModel}
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold font-mono text-[#041627] bg-[#fea520]/10 px-2 py-0.5 rounded border border-[#fea520]/30 shrink-0">
              {inspection.vehicleLicensePlate}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
            {inspection.ownerName && (
              <p className="flex items-center gap-1 text-[11px] text-[#44474c]/80 font-bold">
                <User className="w-3.5 h-3.5 text-[#44474c]/40 shrink-0" />
                {inspection.ownerName}
              </p>
            )}
            <span className="text-[#44474c]/30 text-xs hidden xs:inline">•</span>
            <p className="flex items-center gap-1 text-[10px] text-[#44474c]/65 font-semibold">
              <Calendar className="w-3 h-3 text-[#44474c]/40 shrink-0" />
              Ingreso {formatDateTime(inspection.workOrderCreatedAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Motivo de visita */}
      {inspection.serviceReason && (
        <div className="bg-[#eefcfd]/60 border border-[#041627]/5 rounded-xl p-3.5 mb-4 shadow-inner">
          <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#041627]/60 mb-1">
            Motivo de visita / Síntomas
          </p>
          <p className="text-xs font-semibold text-[#041627] whitespace-pre-wrap leading-relaxed">
            {inspection.serviceReason}
          </p>
        </div>
      )}

      {/* Áreas pendientes */}
      <div className="space-y-2.5 pt-1.5 border-t border-[#041627]/5">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#44474c]/75">
          Áreas pendientes de tu reporte
        </p>
        <div className="flex flex-wrap gap-2">
          {inspection.pendingAreas.map((area) => (
            <button
              key={area.areaId}
              onClick={() => onPickArea(area)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-gradient-to-r from-[#fea520] to-[#fec15d] text-[#041627] hover:shadow-md hover:shadow-[#fea520]/10 active:scale-[0.97] transition-all border border-[#fea520]/20 shadow shadow-[#fea520]/5"
            >
              <ClipboardCheck className="w-4 h-4 text-[#041627]/70 shrink-0" />
              {area.areaName}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}

// ─── Skeletons & EmptyState ──────────────────────────────────────────────────

function InspectionSkeletons() {
  return (
    <div className="space-y-4.5 animate-pulse">
      {[...Array(2)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-[#041627]/5 p-5 space-y-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#c4c6cd]/30" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-36 bg-[#c4c6cd]/30 rounded" />
              <div className="h-3 w-28 bg-[#c4c6cd]/20 rounded" />
            </div>
          </div>
          <div className="h-14 w-full bg-[#c4c6cd]/15 rounded-xl" />
          <div className="space-y-2">
            <div className="h-3 w-40 bg-[#c4c6cd]/25 rounded" />
            <div className="flex gap-2">
              <div className="h-9 w-24 bg-[#c4c6cd]/30 rounded-xl" />
              <div className="h-9 w-24 bg-[#c4c6cd]/30 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3.5 py-16 px-4 text-center bg-white border border-[#041627]/10 rounded-2xl shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-[#eefcfd] flex items-center justify-center">
        <ClipboardCheck className="w-6 h-6 text-[#041627]" />
      </div>
      <p className="text-sm font-extrabold text-[#041627]">Nada pendiente</p>
      <p className="text-xs text-[#44474c]/85 max-w-xs leading-relaxed font-medium">
        No hay órdenes esperando tu reporte. Si necesitás reportar y no ves nada acá,
        avisá al administrador para que te asigne áreas o revisá tu listado de trabajos activos.
      </p>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function MechanicInspectionsPage() {
  const { data, isLoading, isError } = useMyPendingInspections();
  const [picked, setPicked] = useState<
    { inspection: PendingInspection; area: PendingInspectionArea } | null
  >(null);

  const items = data ?? [];

  return (
    <div className="space-y-5 pb-12">
      {/* ── Título y Header Premium ─────────────────────────────────────────── */}
      <div className="bg-[#041627] text-white rounded-2xl p-5 shadow-md shadow-[#041627]/10 relative overflow-hidden">
        {/* Decoración circular de fondo */}
        <div className="absolute -right-10 -bottom-10 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-[#fea520]" />
            <h1 className="text-lg font-extrabold tracking-wide">
              Inspecciones pendientes
            </h1>
          </div>
          <p className="text-xs text-white/60 mt-1 leading-snug max-w-[280px]">
            Órdenes en revisión donde te toca opinar y reportar sobre tus áreas.
          </p>
        </div>
      </div>

      {/* ── Estados ────────────────────────────────────────────────────────── */}
      {isLoading && <InspectionSkeletons />}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center shadow-sm">
          <p className="text-sm text-red-600 font-bold">No pudimos cargar tus inspecciones.</p>
          <p className="text-xs text-red-400 mt-1">Por favor, intentá de nuevo recargando la página.</p>
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && <EmptyState />}

      {/* ── Lista de inspecciones ──────────────────────────────────────────── */}
      {!isLoading && !isError && items.length > 0 && (
        <div className="space-y-4.5 animate-[fadeIn_0.2s_ease-out]">
          {items.map((inspection) => (
            <InspectionCard
              key={inspection.workOrderId}
              inspection={inspection}
              onPickArea={(area) => setPicked({ inspection, area })}
            />
          ))}
        </div>
      )}

      {/* ── Modal de reporte ────────────────────────────────────────────────── */}
      {picked && (
        <ReportFormModal
          inspection={picked.inspection}
          area={picked.area}
          onClose={() => setPicked(null)}
        />
      )}
    </div>
  );
}

