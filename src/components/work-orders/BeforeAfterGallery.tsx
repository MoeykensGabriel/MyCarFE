"use client";

import { useMemo, useState } from "react";
import { Camera, Sparkles, X, LayoutGrid, Sliders } from "lucide-react";

import { PhotoType } from "@/lib/enums";
import { resolveAssetUrl } from "@/lib/asset-url";
import type { WorkOrder } from "@/types/api.types";

interface Props {
  order: WorkOrder;
}

export function BeforeAfterGallery({ order }: Props) {
  const allPhotos = order.photos ?? [];
  const services  = order.services ?? [];
  const reports   = order.inspectionReports ?? [];

  // ── 1. Fotos del vehículo (sin target específico) ──────────────────────────
  const vehicleBefore = useMemo(
    () => allPhotos.filter(p =>
      Number(p.photoType) === PhotoType.Before
      && !p.workOrderServiceId
      && !p.inspectionReportId),
    [allPhotos]
  );
  const vehicleAfter = useMemo(
    () => allPhotos.filter(p =>
      Number(p.photoType) === PhotoType.After
      && !p.workOrderServiceId
      && !p.inspectionReportId),
    [allPhotos]
  );

  // Emparejamos fotos del vehículo por su caption (Frente, Trasera, etc.)
  const vehicleComparisons = useMemo(() => {
    const matched: { label: string; beforeUrl?: string; afterUrl?: string }[] = [];
    const SLOT_LABELS = [
      "Frente / Delantera",
      "Parte Trasera",
      "Lateral Izquierdo",
      "Lateral Derecho",
      "Interior Delantero",
      "Interior Trasero"
    ];

    // Emparejar slots conocidos
    SLOT_LABELS.forEach((label) => {
      const bPhoto = vehicleBefore.find(p => p.caption === label);
      const aPhoto = vehicleAfter.find(p => p.caption === label);
      if (bPhoto || aPhoto) {
        matched.push({
          label,
          beforeUrl: bPhoto ? resolveAssetUrl(bPhoto.url) : undefined,
          afterUrl: aPhoto ? resolveAssetUrl(aPhoto.url) : undefined
        });
      }
    });

    // Emparejar otros captions personalizados
    const allBeforeCaptioned = vehicleBefore.filter(p => p.caption && !SLOT_LABELS.includes(p.caption));
    const allAfterCaptioned = vehicleAfter.filter(p => p.caption && !SLOT_LABELS.includes(p.caption));
    const otherCaptions = Array.from(new Set([
      ...allBeforeCaptioned.map(p => p.caption!),
      ...allAfterCaptioned.map(p => p.caption!)
    ]));

    otherCaptions.forEach((label) => {
      const bPhoto = vehicleBefore.find(p => p.caption === label);
      const aPhoto = vehicleAfter.find(p => p.caption === label);
      matched.push({
        label,
        beforeUrl: bPhoto ? resolveAssetUrl(bPhoto.url) : undefined,
        afterUrl: aPhoto ? resolveAssetUrl(aPhoto.url) : undefined
      });
    });

    // Fotos generales (sin caption)
    const uncaptionedBefore = vehicleBefore.filter(p => !p.caption);
    const uncaptionedAfter = vehicleAfter.filter(p => !p.caption);
    const maxUncaptioned = Math.max(uncaptionedBefore.length, uncaptionedAfter.length);
    
    for (let i = 0; i < maxUncaptioned; i++) {
      matched.push({
        label: `Vista general ${i + 1}`,
        beforeUrl: uncaptionedBefore[i] ? resolveAssetUrl(uncaptionedBefore[i].url) : undefined,
        afterUrl: uncaptionedAfter[i] ? resolveAssetUrl(uncaptionedAfter[i].url) : undefined
      });
    }

    return matched;
  }, [vehicleBefore, vehicleAfter]);

  // ── 2. Por servicio: emparejar con su inspection report por areaId ─────────
  const serviceComparisons = useMemo(() => {
    return services
      .map(svc => {
        if (!svc.areaId) return null;
        const report = reports.find(r => r.areaId === svc.areaId);
        const beforePhotos = report
          ? allPhotos.filter(p => p.inspectionReportId === report.id)
          : [];
        const afterPhotos = allPhotos.filter(p => p.workOrderServiceId === svc.id);
        if (beforePhotos.length === 0 && afterPhotos.length === 0) return null;
        
        return {
          id: svc.id,
          title: svc.nameSnapshot,
          subtitle: svc.areaName
            ? `Área: ${svc.areaName}` + (report?.mechanicFullName ? ` · Mecánico: ${report.mechanicFullName}` : "")
            : (report?.mechanicFullName ? `Mecánico: ${report.mechanicFullName}` : null),
          beforeUrl: beforePhotos[0] ? resolveAssetUrl(beforePhotos[0].url) : undefined,
          afterUrl: afterPhotos[0] ? resolveAssetUrl(afterPhotos[0].url) : undefined,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [services, reports, allPhotos]);

  const hasAnyPhoto = vehicleComparisons.length > 0 || serviceComparisons.length > 0;
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (!hasAnyPhoto) return null;

  return (
    <>
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header de la Galería */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 bg-[#fcfdff]">
          <span className="bg-[#fea520]/15 text-[#865300] p-1.5 rounded-xl shrink-0">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-base font-extrabold text-[#041627] tracking-tight">
              Registro del Antes y Después
            </h2>
            <p className="text-xs text-[#44474c]/70 mt-0.5">
              Compará de manera visual y transparente los trabajos realizados en tu vehículo.
            </p>
          </div>
        </div>

        <div className="p-5 space-y-8">
          {/* 1. SECCIÓN VEHÍCULO COMPLETO */}
          {vehicleComparisons.length > 0 && (
            <div className="space-y-4">
              <div className="border-l-4 border-l-[#fea520] pl-3">
                <h3 className="text-sm font-extrabold text-[#041627] uppercase tracking-wider">
                  Inspección General del Auto
                </h3>
                <p className="text-[11px] text-[#44474c]/70 mt-0.5">
                  Fotos de recepción (ingreso) vs entrega (salida).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {vehicleComparisons.map((item, idx) => (
                  <ComparisonCard
                    key={`${item.label}-${idx}`}
                    title={item.label}
                    subtitle="Estado cosmético del auto"
                    beforeUrl={item.beforeUrl}
                    afterUrl={item.afterUrl}
                    onOpenImage={setLightbox}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 2. SECCIÓN SERVICIOS DETALLADOS */}
          {serviceComparisons.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="border-l-4 border-l-emerald-600 pl-3">
                <h3 className="text-sm font-extrabold text-[#041627] uppercase tracking-wider">
                  Detalle de Servicios Realizados
                </h3>
                <p className="text-[11px] text-[#44474c]/70 mt-0.5">
                  Reportes fotográficos específicos de cada trabajo.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {serviceComparisons.map((item) => (
                  <ComparisonCard
                    key={item.id}
                    title={item.title}
                    subtitle={item.subtitle}
                    beforeUrl={item.beforeUrl}
                    afterUrl={item.afterUrl}
                    onOpenImage={setLightbox}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox para maximizar fotos individuales */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Detalle"
            className="max-h-[90vh] max-w-[95vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

// ─── Tarjeta de Comparación Premium (Con Slider y Tab Lado a Lado) ───────────────────

function ComparisonCard({
  title,
  subtitle,
  beforeUrl,
  afterUrl,
  onOpenImage,
}: {
  title: string;
  subtitle: string | null;
  beforeUrl?: string;
  afterUrl?: string;
  onOpenImage: (url: string) => void;
}) {
  const [viewMode, setViewMode] = useState<"slider" | "side">("slider");
  const hasBoth = !!beforeUrl && !!afterUrl;

  return (
    <div className="bg-[#fcfdff] rounded-2xl border border-slate-200/80 shadow-3xs overflow-hidden flex flex-col h-full hover:shadow-2xs transition-shadow">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-slate-100 bg-white">
        <div className="min-w-0">
          <h4 className="text-xs font-black text-[#041627] truncate">{title}</h4>
          {subtitle && (
            <p className="text-[10px] text-[#44474c]/70 mt-0.5 truncate font-medium">{subtitle}</p>
          )}
        </div>
        {/* Toggle para cambiar de vista (solo si tiene ambas fotos) */}
        {hasBoth && (
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
            <button
              onClick={() => setViewMode("slider")}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-colors ${
                viewMode === "slider"
                  ? "bg-white text-[#041627] shadow-3xs"
                  : "text-[#44474c]/70 hover:text-[#041627]"
              }`}
              title="Comparación interactiva"
            >
              <Sliders className="w-3 h-3" />
              Deslizar
            </button>
            <button
              onClick={() => setViewMode("side")}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-colors ${
                viewMode === "side"
                  ? "bg-white text-[#041627] shadow-3xs"
                  : "text-[#44474c]/70 hover:text-[#041627]"
              }`}
              title="Vista en paralelo"
            >
              <LayoutGrid className="w-3 h-3" />
              Lado a lado
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-3.5 flex-1 flex flex-col justify-center">
        {hasBoth ? (
          viewMode === "slider" ? (
            <ImageSlider beforeUrl={beforeUrl} afterUrl={afterUrl} />
          ) : (
            <div className="grid grid-cols-2 gap-3.5">
              <SinglePhotoCard label="Antes" tone="amber" url={beforeUrl} onClick={onOpenImage} />
              <SinglePhotoCard label="Después" tone="emerald" url={afterUrl} onClick={onOpenImage} />
            </div>
          )
        ) : beforeUrl ? (
          <SinglePhotoCard label="Antes (Ingreso)" tone="amber" url={beforeUrl} onClick={onOpenImage} fullWidth />
        ) : afterUrl ? (
          <SinglePhotoCard label="Después (Entrega)" tone="emerald" url={afterUrl} onClick={onOpenImage} fullWidth />
        ) : (
          <div className="aspect-[4/3] rounded-xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center gap-1.5 text-slate-400">
            <Camera className="w-6 h-6 stroke-[1.5]" />
            <span className="text-[10px] font-bold">Sin registros</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Componente Slider Interactivo de Comparación ──────────────────────────────────

function ImageSlider({ beforeUrl, afterUrl }: { beforeUrl: string; afterUrl: string }) {
  const [sliderPos, setSliderPos] = useState(50);

  return (
    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-slate-200/60 shadow-inner select-none group">
      {/* Before Image (Background) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={beforeUrl}
        alt="Antes"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      <div className="absolute top-2.5 left-2.5 bg-[#fea520]/95 backdrop-blur-xs text-[#041627] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-xs z-10 select-none">
        Antes
      </div>

      {/* After Image (Foreground, clipped) */}
      <div
        className="absolute inset-y-0 left-0 right-0 overflow-hidden"
        style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={afterUrl}
          alt="Después"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute top-2.5 right-2.5 bg-emerald-600/95 backdrop-blur-xs text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-xs z-10 select-none">
          Después
        </div>
      </div>

      {/* Dragging Guide Overlay text when hover */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-xs text-[8px] font-bold tracking-widest uppercase text-white/80 px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none select-none">
        Arrastra para comparar
      </div>

      {/* Vertical Slider Line & Drag Handle */}
      <div
        className="absolute inset-y-0 w-0.5 bg-white shadow z-20 pointer-events-none"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-700 shadow-md flex items-center justify-center border border-slate-200 transition-transform group-hover:scale-110">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M8 7l-5 5 5 5M16 7l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Overlay Input Range to capture drags cleanly on all devices */}
      <input
        type="range"
        min="0"
        max="100"
        value={sliderPos}
        onChange={(e) => setSliderPos(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
      />
    </div>
  );
}

// ─── Tarjeta de Foto Individual con Etiquetas ────────────────────────────────────────

function SinglePhotoCard({
  label,
  tone,
  url,
  onClick,
  fullWidth,
}: {
  label: string;
  tone: "amber" | "emerald";
  url: string;
  onClick: (url: string) => void;
  fullWidth?: boolean;
}) {
  const badgeCls =
    tone === "amber"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-emerald-50 text-emerald-800 border-emerald-200";

  return (
    <div className={`flex flex-col gap-2 ${fullWidth ? "w-full md:w-3/4 mx-auto" : ""}`}>
      <div className="flex items-center">
        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${badgeCls}`}>
          {label}
        </span>
      </div>
      <button
        type="button"
        onClick={() => onClick(url)}
        className="relative block aspect-[4/3] rounded-xl overflow-hidden border border-slate-200/80 bg-[#041627] hover:border-[#fea520]/60 transition-colors shadow-2xs group"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={label}
          className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
        />
        <div className="absolute inset-0 bg-[#041627]/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="bg-black/60 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full">
            Ampliar
          </span>
        </div>
      </button>
    </div>
  );
}
