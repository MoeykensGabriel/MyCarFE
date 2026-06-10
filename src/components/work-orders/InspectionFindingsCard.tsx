"use client";

import { useState } from "react";
import { AlertTriangle, ClipboardCheck, Plus, Package, Wrench, User } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { useInspectionReportsByWorkOrder } from "@/hooks/useInspections";
import { InspectionReport } from "@/types/api.types";
import { AddServiceFromFindingDialog } from "./AddServiceFromFindingDialog";
import { AddPartFromFindingDialog } from "./AddPartFromFindingDialog";

interface Props {
  workOrderId: string;
}

/**
 * Card que muestra los hallazgos de la inspección colectiva durante Diagnosing.
 * Es el "puente" entre lo que reportaron los mecánicos y la cotización:
 * por cada finding hay dos shortcuts para crear servicio o repuesto con el
 * contexto del hallazgo prellenado.
 *
 * Si no hubo hallazgos (todas las áreas marcadas sin problema), muestra un
 * mensaje informativo en vez de la card vacía.
 */
export function InspectionFindingsCard({ workOrderId }: Props) {
  const { data: reports, isLoading } = useInspectionReportsByWorkOrder(workOrderId);

  const [serviceFinding, setServiceFinding] = useState<InspectionReport | null>(null);
  const [partFinding, setPartFinding]       = useState<InspectionReport | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-amber-500" />
            Novedades de la inspección
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-16 bg-gray-100 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  // Solo nos interesan los reportes con problema reportados por mecánicos.
  // Los "sin hallazgos" (admin o mecánico) no aportan al armado del presupuesto.
  const findings = (reports ?? []).filter((r) => r.hasIssue && !r.isNoFindings);

  if (findings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-green-600" />
            Inspección sin novedades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Los mecánicos no reportaron novedades o problemas. Podés armar el presupuesto en
            base al motivo de visita o agregar servicios manualmente.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Novedades de la inspección
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              ({findings.length})
            </span>
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Lo que los mecánicos detectaron. Convertí cada novedad en servicio o
            repuesto para armar el presupuesto.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {findings.map((f) => (
            <FindingRow
              key={f.id}
              finding={f}
              onCreateService={() => setServiceFinding(f)}
              onCreatePart={() => setPartFinding(f)}
            />
          ))}
        </CardContent>
      </Card>

      {serviceFinding && (
        <AddServiceFromFindingDialog
          workOrderId={workOrderId}
          finding={serviceFinding}
          open={!!serviceFinding}
          onClose={() => setServiceFinding(null)}
        />
      )}

      {partFinding && (
        <AddPartFromFindingDialog
          workOrderId={workOrderId}
          finding={partFinding}
          open={!!partFinding}
          onClose={() => setPartFinding(null)}
        />
      )}
    </>
  );
}

// ─── Fila ─────────────────────────────────────────────────────────────────────

function FindingRow({
  finding,
  onCreateService,
  onCreatePart,
}: {
  finding: InspectionReport;
  onCreateService: () => void;
  onCreatePart: () => void;
}) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50/40 px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
              <AlertTriangle className="w-2.5 h-2.5" />
              {finding.areaName}
            </span>
            {finding.mechanicFullName && (
              <span className="text-xs text-gray-600 inline-flex items-center gap-1">
                <User className="w-3 h-3" />
                {finding.mechanicFullName}
              </span>
            )}
            <span className="text-xs text-gray-500">
              {formatDateTime(finding.createdAt)}
            </span>
          </div>
          {finding.findings && (
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed pt-0.5">
              {finding.findings}
            </p>
          )}
          {finding.photos.length > 0 && (
            <p className="text-[11px] text-muted-foreground pt-1">
              {finding.photos.length} foto{finding.photos.length > 1 ? "s" : ""} adjunta
              {finding.photos.length > 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-3 pt-2 border-t border-red-200/60">
        <Button
          variant="outline"
          size="sm"
          onClick={onCreateService}
          className="flex-1 bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
        >
          <Wrench className="w-3.5 h-3.5 mr-1.5" />
          <Plus className="w-3 h-3 -ml-0.5 mr-1" />
          Servicio
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onCreatePart}
          className="flex-1 bg-white hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700"
        >
          <Package className="w-3.5 h-3.5 mr-1.5" />
          <Plus className="w-3 h-3 -ml-0.5 mr-1" />
          Repuesto
        </Button>
      </div>
    </div>
  );
}
