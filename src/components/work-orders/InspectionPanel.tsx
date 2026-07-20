"use client";

import { useState } from "react";
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  CircleDashed,
  Sparkles,
  Lock,
  Clock,
  X,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReportFormModal } from "@/components/inspections/ReportFormModal";
import {
  useInspectionReportsByWorkOrder,
  useMarkAreaNoFindings,
  useMarkAreaSkipped,
  useCloseInspection,
} from "@/hooks/useInspections";
import { useAreas } from "@/hooks/useAreas";
import { formatDateTime } from "@/lib/format";
import { Area, InspectionReport, PendingInspection, WorkOrder } from "@/types/api.types";

/**
 * Panel admin para gestionar la fase de inspección colectiva de una WorkOrder.
 *
 * Lista las áreas activas y su estado para esta orden:
 *   - Reportado con hallazgos (mecánico u oficina)
 *   - Reportado sin hallazgos (mecánico u oficina)
 *   - Sin hallazgos (oficina, manual)
 *   - Postergada (oficina, con motivo — nadie revisó el área; queda para la próxima visita)
 *   - Pendiente
 *
 * Sobre un área pendiente la oficina puede: inspeccionarla ella misma (mismo formulario
 * que usa el mecánico), marcarla "sin hallazgos" o postergarla con motivo. Cuando todas
 * están cubiertas puede cerrar la inspección — la orden pasa a Diagnosing.
 */
export function InspectionPanel({ order }: { order: WorkOrder }) {
  const workOrderId = order.id;
  const { data: areas,   isLoading: areasLoading }   = useAreas(false);
  const { data: reports, isLoading: reportsLoading } = useInspectionReportsByWorkOrder(workOrderId);

  const markNoFindings = useMarkAreaNoFindings(workOrderId);
  const markSkipped = useMarkAreaSkipped(workOrderId);
  const closeInspection = useCloseInspection(workOrderId);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  // Área que la oficina decidió inspeccionar ella misma (abre el formulario del mecánico).
  const [reportingArea, setReportingArea] = useState<Area | null>(null);

  if (areasLoading || reportsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inspección colectiva</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeAreas = areas ?? [];
  const reportsByAreaId = new Map<string, InspectionReport>(
    (reports ?? []).map((r) => [r.areaId, r]),
  );

  const coveredCount = activeAreas.filter((a) => reportsByAreaId.has(a.id)).length;
  const allCovered  = coveredCount === activeAreas.length && activeAreas.length > 0;

  // Resumen para el modal de cierre: con novedades / sin novedades / postergadas.
  // Las postergadas van aparte — nadie las revisó, no cuentan como "sin novedades".
  const withFindings = activeAreas.filter((a) => {
    const r = reportsByAreaId.get(a.id);
    return !!r && r.hasIssue && !r.isNoFindings && !r.isSkipped;
  });
  const skipped = activeAreas.filter((a) => {
    const r = reportsByAreaId.get(a.id);
    return !!r && r.isSkipped;
  });
  const withoutFindings = activeAreas.filter((a) => {
    const r = reportsByAreaId.get(a.id);
    return !!r && !r.isSkipped && (r.isNoFindings || !r.hasIssue);
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-amber-500" />
              Inspección colectiva
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {coveredCount} de {activeAreas.length} áreas cubiertas
            </p>
          </div>

          <Button
            size="sm"
            className="h-9 shrink-0 sm:h-7"
            disabled={!allCovered || closeInspection.isPending}
            onClick={() => setConfirmCloseOpen(true)}
          >
            {closeInspection.isPending ? "Cerrando..." : "Cerrar inspección"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activeAreas.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No hay áreas activas. Crealas desde /admin/areas para que los mecánicos puedan reportar.
          </p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {activeAreas.map((area) => (
              <AreaRow
                key={area.id}
                area={area}
                report={reportsByAreaId.get(area.id)}
                onMarkNoFindings={() =>
                  markNoFindings.mutate({ areaId: area.id })
                }
                onMarkSkipped={(reason) =>
                  markSkipped.mutate({ areaId: area.id, reason })
                }
                onReport={() => setReportingArea(area)}
                marking={markNoFindings.isPending || markSkipped.isPending}
              />
            ))}
          </ul>
        )}

      </CardContent>

      {/* El admin inspecciona un área él mismo: reusamos el formulario del mecánico.
          El reporte se guarda sin MechanicId — queda firmado por la oficina. */}
      {reportingArea && (
        <ReportFormModal
          inspection={buildInspectionContext(order)}
          area={{
            areaId:        reportingArea.id,
            areaName:      reportingArea.name,
            isTireArea:    reportingArea.isTireArea,
            isBatteryArea: reportingArea.isBatteryArea,
            isOilArea:     reportingArea.isOilArea,
          }}
          onClose={() => setReportingArea(null)}
        />
      )}

      {confirmCloseOpen && (
        <CloseInspectionModal
          withFindings={withFindings}
          skipped={skipped}
          skippedReports={reportsByAreaId}
          withoutFindings={withoutFindings}
          pending={closeInspection.isPending}
          onConfirm={() =>
            closeInspection.mutate(undefined, {
              onSettled: () => setConfirmCloseOpen(false),
            })
          }
          onClose={() => setConfirmCloseOpen(false)}
        />
      )}
    </Card>
  );
}

/**
 * Adapta la orden del panel al contrato que espera ReportFormModal (pensado para la
 * pantalla del mecánico, que recibe la orden ya resumida desde /mechanics/me/pending-inspections).
 * El modal solo usa los datos del vehículo, los km de ingreso y el id de la orden;
 * `pendingAreas` no lo mira, porque el área ya viene elegida por prop.
 */
function buildInspectionContext(order: WorkOrder): PendingInspection {
  return {
    workOrderId:         order.id,
    workOrderCreatedAt:  order.createdAt,
    serviceReason:       order.serviceReason,
    mileageAtEntry:      order.mileageAtEntry ?? 0,
    vehicleId:           order.vehicleId,
    vehicleBrand:        order.vehicleBrand ?? "",
    vehicleModel:        order.vehicleModel ?? "",
    vehicleLicensePlate: order.vehicleLicensePlate ?? "",
    pendingAreas:        [],
  };
}

// ─── Modal de confirmación de cierre ──────────────────────────────────────────
// Reemplaza al cartel inline: deja claro que el cierre es irreversible y muestra
// el resumen de áreas con/sin hallazgos. Responsive (centrado, scroll interno).

function CloseInspectionModal({
  withFindings,
  skipped,
  skippedReports,
  withoutFindings,
  pending,
  onConfirm,
  onClose,
}: {
  withFindings: Area[];
  skipped: Area[];
  skippedReports: Map<string, InspectionReport>;
  withoutFindings: Area[];
  pending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !pending) onClose(); }}
    >
      <div className="w-full max-w-lg max-h-[85vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-[#c4c6cd] overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[#c4c6cd]/60">
          <div className="flex items-center gap-2">
            <span className="bg-amber-100 text-amber-700 p-1.5 rounded-lg shrink-0">
              <ClipboardCheck className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#041627] leading-tight">Cerrar inspección</h2>
              <p className="text-xs text-[#44474c] mt-0.5">Revisá el resumen antes de continuar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={pending}
            className="p-1.5 rounded-md text-[#44474c] hover:bg-[#eefcfd] transition-colors disabled:opacity-40"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo scrolleable */}
        <div className="px-5 py-4 space-y-4 overflow-y-auto">
          {/* Aviso de irreversibilidad */}
          <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900">
              La orden pasa a <strong>cotización</strong> y los mecánicos ya no podrán editar sus
              reportes. <strong>Esta acción no se puede deshacer.</strong>
            </p>
          </div>

          {/* Con hallazgos */}
          <div className="space-y-1.5">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-red-700">
              <AlertTriangle className="w-3.5 h-3.5" />
              Con hallazgos ({withFindings.length})
            </p>
            {withFindings.length === 0 ? (
              <p className="text-xs text-[#44474c]/70 pl-5">Ninguna área reportó novedades.</p>
            ) : (
              <ul className="space-y-1">
                {withFindings.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center gap-2 text-sm text-[#041627] rounded-lg bg-red-50/60 border border-red-100 px-3 py-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    {a.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Postergadas — nadie las revisó; quedan para la próxima visita */}
          {skipped.length > 0 && (
            <div className="space-y-1.5">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-amber-700">
                <Clock className="w-3.5 h-3.5" />
                Postergadas — sin inspeccionar ({skipped.length})
              </p>
              <ul className="space-y-1">
                {skipped.map((a) => (
                  <li
                    key={a.id}
                    className="text-sm text-[#041627] rounded-lg bg-amber-50/70 border border-amber-200 px-3 py-2"
                  >
                    <span className="font-medium">{a.name}</span>
                    {skippedReports.get(a.id)?.skipReason && (
                      <span className="block text-xs text-amber-800 mt-0.5">
                        Motivo: {skippedReports.get(a.id)!.skipReason}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-amber-800/80 pl-1">
                Estas áreas quedan registradas para revisar en la próxima visita del vehículo.
              </p>
            </div>
          )}

          {/* Sin hallazgos */}
          <div className="space-y-1.5">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-green-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Sin hallazgos ({withoutFindings.length})
            </p>
            {withoutFindings.length === 0 ? (
              <p className="text-xs text-[#44474c]/70 pl-5">—</p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {withoutFindings.map((a) => (
                  <li
                    key={a.id}
                    className="inline-flex items-center gap-1.5 text-xs text-[#041627] rounded-lg bg-[#eefcfd] border border-[#c4c6cd]/60 px-2.5 py-1"
                  >
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                    {a.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Footer: cancelar + confirmar */}
        <div className="flex gap-2 px-5 py-4 border-t border-[#c4c6cd]/60">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={onConfirm} disabled={pending}>
            {pending ? "Cerrando..." : "Cerrar inspección"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Fila de un área ─────────────────────────────────────────────────────────

function AreaRow({
  area,
  report,
  onMarkNoFindings,
  onMarkSkipped,
  onReport,
  marking,
}: {
  area: Area;
  report?: InspectionReport;
  onMarkNoFindings: () => void;
  onMarkSkipped: (reason: string) => void;
  onReport: () => void;
  marking: boolean;
}) {
  const [skipping, setSkipping] = useState(false);
  const [skipReason, setSkipReason] = useState("");

  // ── Pendiente ──────────────────────────────────────────────────────────────
  if (!report) {
    return (
      <li className="py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Cabecera: ícono + nombre del área (siempre legible, sin truncate) */}
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <CircleDashed className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">{area.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">Sin reporte aún</p>
            </div>
          </div>
          {/* Acciones. Mobile: grilla de 2 con la principal a lo ancho, botones altos
              para que el dedo tenga dónde caer. Desktop: fila alineada a la derecha. */}
          <div className="grid grid-cols-2 gap-2 pl-6 sm:flex sm:shrink-0 sm:justify-end sm:pl-0">
            {/* La oficina inspecciona el área ella misma cuando no hay mecánico disponible */}
            <Button
              size="sm"
              className="col-span-2 h-9 sm:col-span-1 sm:h-7"
              onClick={onReport}
              disabled={marking || skipping}
            >
              <ClipboardCheck />
              Inspeccionar yo
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 sm:h-7"
              onClick={onMarkNoFindings}
              disabled={marking || skipping}
            >
              <CheckCircle2 className="text-green-600" />
              {marking ? "..." : "Sin novedades"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800 sm:h-7"
              onClick={() => setSkipping((v) => !v)}
              disabled={marking}
            >
              <Clock />
              Postergar
            </Button>
          </div>
        </div>

        {/* Panel inline: motivo obligatorio para postergar */}
        {skipping && (
          <div className="mt-2 ml-6 sm:ml-7 rounded-lg border border-amber-200 bg-amber-50/70 p-3 space-y-2">
            <p className="text-xs text-amber-900">
              El área queda <strong>sin inspeccionar</strong> y registrada para revisar en la
              próxima visita. Indicá el motivo (mínimo 5 caracteres).
            </p>
            <input
              type="text"
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              placeholder='Ej: "Mecánico de frenos ocupado, cliente no podía esperar"'
              maxLength={500}
              className="w-full rounded-md border border-amber-300 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            {/* Mobile: confirmar arriba y a lo ancho (flex-col-reverse). Desktop: fila a la derecha. */}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 sm:h-7"
                onClick={() => { setSkipping(false); setSkipReason(""); }}
                disabled={marking}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="h-9 bg-amber-600 text-white hover:bg-amber-700 sm:h-7"
                disabled={marking || skipReason.trim().length < 5}
                onClick={() => {
                  onMarkSkipped(skipReason.trim());
                  setSkipping(false);
                  setSkipReason("");
                }}
              >
                {marking ? "..." : "Confirmar postergación"}
              </Button>
            </div>
          </div>
        )}
      </li>
    );
  }

  // ── Postergada (oficina) — nadie la revisó ─────────────────────────────────
  if (report.isSkipped) {
    return (
      <li className="py-3">
        <div className="flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            {/* Nombre del área sin truncate para que siempre se lea completo en mobile */}
            <p className="text-sm font-semibold text-gray-900">{area.name}</p>
            {/* Badge en su propia línea para no comprimir el nombre */}
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 mt-1 rounded text-[10px] font-bold uppercase bg-amber-50 border border-amber-200 text-amber-700">
              Postergada
            </span>
            <p className="text-xs text-gray-500 mt-1">
              Sin inspeccionar · {formatDateTime(report.createdAt)}
            </p>
            {report.skipReason && (
              <p className="text-xs text-amber-800 mt-1 bg-amber-50/70 border border-amber-100 rounded px-2 py-1 leading-relaxed">
                Motivo: {report.skipReason}
              </p>
            )}
          </div>
        </div>
      </li>
    );
  }

  // ── Sin novedades (admin) ──────────────────────────────────────────────────
  if (report.isNoFindings) {
    return (
      <li className="py-3 flex items-start gap-2.5">
        <Lock className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{area.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">Marcada sin novedades (admin) · {formatDateTime(report.createdAt)}</p>
        </div>
      </li>
    );
  }

  // ── Sin novedades reportadas por mecánico ───────────────────────────────────
  if (!report.hasIssue) {
    return (
      <li className="py-3">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">{area.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {report.mechanicFullName ?? "Oficina"} · sin novedades · {formatDateTime(report.createdAt)}
            </p>
            {report.findings && (
              <p className="text-xs text-gray-700 mt-1 italic whitespace-pre-wrap leading-relaxed">
                &ldquo;{report.findings}&rdquo;
              </p>
            )}
          </div>
        </div>
      </li>
    );
  }

  // ── Con problema ───────────────────────────────────────────────────────────
  return (
    <li className="py-3">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          {/* Nombre y badge en contenedor flex-wrap para que el badge baje solo si no cabe */}
          <div className="flex items-start gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-900">{area.name}</p>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-red-50 border border-red-200 text-red-700 shrink-0">
              <Sparkles className="w-2.5 h-2.5" />
              Hay novedades
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {report.mechanicFullName ?? "Oficina"} · {formatDateTime(report.createdAt)}
          </p>
          {report.findings && (
            <p className="text-sm text-gray-800 mt-1.5 whitespace-pre-wrap bg-red-50/60 border border-red-100 rounded px-3 py-2 leading-relaxed">
              {report.findings}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}
