"use client";

import { useState } from "react";
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  CircleDashed,
  Sparkles,
  Lock,
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

        {confirmCloseOpen && (
          <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 space-y-2">
            <p className="text-sm text-amber-900 font-medium">
              ¿Cerrar la inspección y pasar a cotización?
            </p>
            <p className="text-xs text-amber-800/80">
              La orden cambiará a estado <strong>Diagnosing</strong> y los mecánicos ya no
              podrán editar sus reportes. Esto es irreversible desde acá.
            </p>
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                onClick={() =>
                  closeInspection.mutate(undefined, {
                    onSettled: () => setConfirmCloseOpen(false),
                  })
                }
                disabled={closeInspection.isPending}
              >
                {closeInspection.isPending ? "Cerrando..." : "Sí, cerrar"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setConfirmCloseOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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
