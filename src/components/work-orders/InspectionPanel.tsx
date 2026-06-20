"use client";

import { useState } from "react";
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  CircleDashed,
  Sparkles,
  Lock,
  X,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useInspectionReportsByWorkOrder,
  useMarkAreaNoFindings,
  useCloseInspection,
} from "@/hooks/useInspections";
import { useAreas } from "@/hooks/useAreas";
import { formatDateTime } from "@/lib/format";
import { Area, InspectionReport } from "@/types/api.types";

/**
 * Panel admin para gestionar la fase de inspección colectiva de una WorkOrder.
 *
 * Lista las áreas activas y su estado para esta orden:
 *   - Reportado con hallazgos (mecánico)
 *   - Reportado sin hallazgos (mecánico)
 *   - Sin hallazgos (admin manual)
 *   - Pendiente
 *
 * Permite al admin marcar áreas pendientes como "sin hallazgos" y, cuando todas
 * están cubiertas, cerrar la inspección — la orden pasa a Diagnosing (cotización).
 */
export function InspectionPanel({ workOrderId }: { workOrderId: string }) {
  const { data: areas,   isLoading: areasLoading }   = useAreas(false);
  const { data: reports, isLoading: reportsLoading } = useInspectionReportsByWorkOrder(workOrderId);

  const markNoFindings = useMarkAreaNoFindings(workOrderId);
  const closeInspection = useCloseInspection(workOrderId);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

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

  // Resumen para el modal de cierre: áreas con novedades vs. sin novedades
  // (sin novedades = el mecánico reportó sin hallazgos o el admin la marcó así).
  const withFindings = activeAreas.filter((a) => {
    const r = reportsByAreaId.get(a.id);
    return !!r && r.hasIssue && !r.isNoFindings;
  });
  const withoutFindings = activeAreas.filter((a) => {
    const r = reportsByAreaId.get(a.id);
    return !!r && (r.isNoFindings || !r.hasIssue);
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
                marking={markNoFindings.isPending}
              />
            ))}
          </ul>
        )}

      </CardContent>

      {confirmCloseOpen && (
        <CloseInspectionModal
          withFindings={withFindings}
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

// ─── Modal de confirmación de cierre ──────────────────────────────────────────
// Reemplaza al cartel inline: deja claro que el cierre es irreversible y muestra
// el resumen de áreas con/sin hallazgos. Responsive (centrado, scroll interno).

function CloseInspectionModal({
  withFindings,
  withoutFindings,
  pending,
  onConfirm,
  onClose,
}: {
  withFindings: Area[];
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
  marking,
}: {
  area: Area;
  report?: InspectionReport;
  onMarkNoFindings: () => void;
  marking: boolean;
}) {
  // ── Pendiente ──────────────────────────────────────────────────────────────
  if (!report) {
    return (
      <li className="py-3 flex items-center gap-3">
        <CircleDashed className="w-4 h-4 text-gray-300 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{area.name}</p>
          <p className="text-xs text-gray-500">Sin reporte aún</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onMarkNoFindings}
          disabled={marking}
        >
          {marking ? "..." : "Marcar sin novedades"}
        </Button>
      </li>
    );
  }

  // ── Sin novedades (admin) ──────────────────────────────────────────────────
  if (report.isNoFindings) {
    return (
      <li className="py-3 flex items-center gap-3">
        <Lock className="w-4 h-4 text-gray-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{area.name}</p>
          <p className="text-xs text-gray-500">Marcada sin novedades (admin) · {formatDateTime(report.createdAt)}</p>
        </div>
      </li>
    );
  }

  // ── Sin novedades reportadas por mecánico ───────────────────────────────────
  if (!report.hasIssue) {
    return (
      <li className="py-3">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{area.name}</p>
            <p className="text-xs text-gray-500">
              {report.mechanicFullName ?? "—"} · sin novedades · {formatDateTime(report.createdAt)}
            </p>
            {report.findings && (
              <p className="text-xs text-gray-700 mt-1 italic whitespace-pre-wrap">
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
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            {area.name}
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-red-50 border border-red-200 text-red-700">
              <Sparkles className="w-2.5 h-2.5 mr-0.5" />
              Hay novedades
            </span>
          </p>
          <p className="text-xs text-gray-500">
            {report.mechanicFullName ?? "—"} · {formatDateTime(report.createdAt)}
          </p>
          {report.findings && (
            <p className="text-sm text-gray-800 mt-1.5 whitespace-pre-wrap bg-red-50/60 border border-red-100 rounded px-3 py-2">
              {report.findings}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}
