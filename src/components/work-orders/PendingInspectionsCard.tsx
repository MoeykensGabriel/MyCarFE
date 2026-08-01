"use client";

import { useState } from "react";
import { AlertTriangle, ClipboardCheck, CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReportFormModal } from "@/components/inspections/ReportFormModal";
import { useAreas } from "@/hooks/useAreas";
import {
  useMarkAreaNoFindings,
  useVehicleSkippedInspections,
} from "@/hooks/useInspections";
import { formatDate } from "@/lib/format";
import { Area, PendingInspection, WorkOrder } from "@/types/api.types";

/**
 * Áreas que quedaron POSTERGADAS y todavía se pueden inspeccionar, con la inspección
 * inicial ya cerrada.
 *
 * El taller cierra la inspección postergando lo que no llegó a mirar para no frenar el
 * auto, y sigue con el trabajo real. Cuando el especialista se libera —el auto sigue en
 * el taller— entra por acá y salda lo que faltaba, sin reabrir la orden ni abrir otra.
 *
 * No se muestra durante la inspección inicial: ahí manda InspectionPanel, que lista TODAS
 * las áreas. Acá solo aparecen las que están en deuda.
 *
 * La deuda es del VEHÍCULO, así que puede venir de esta orden o de una visita anterior.
 * El reporte se graba siempre en la orden donde estás parado.
 */
export function PendingInspectionsCard({ order }: { order: WorkOrder }) {
  const { data: pending }        = useVehicleSkippedInspections(order.vehicleId);
  const { data: areas }          = useAreas(false);
  const markNoFindings           = useMarkAreaNoFindings(order.id);
  const [reportingArea, setReportingArea] = useState<Area | null>(null);

  // Sin deuda no hay nada que mostrar — es el caso normal.
  if (!pending || pending.length === 0) return null;

  const areasById = new Map((areas ?? []).map((a) => [a.id, a]));

  return (
    <Card className="border-amber-300">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-amber-500" />
          Áreas sin inspeccionar
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Quedaron postergadas y todavía se pueden revisar. Lo que encuentres entra al
          presupuesto de esta orden.
        </p>
      </CardHeader>

      <CardContent>
        <ul className="divide-y divide-gray-200">
          {pending.map((p) => {
            // El área tiene que existir en el catálogo activo: el formulario necesita
            // saber si es de cubiertas, batería o aceite para pedir esos datos.
            const area = areasById.get(p.areaId);

            return (
              <li key={p.areaId} className="py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#041627]">{p.areaName}</p>
                  <p className="text-xs text-muted-foreground">
                    Postergada el {formatDate(p.skippedAt)}
                    {p.skipReason ? ` — ${p.skipReason}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {area ? (
                    <Button
                      size="sm"
                      className="h-9 sm:h-7"
                      onClick={() => setReportingArea(area)}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                      Inspeccionar
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      Área desactivada
                    </span>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 sm:h-7"
                    disabled={markNoFindings.isPending}
                    onClick={() => markNoFindings.mutate({ areaId: p.areaId })}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Sin novedades
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>

      {/* Mismo formulario que usa el mecánico: el hallazgo tardío se carga igual que uno
          de la inspección inicial, con sus propuestas de servicios y repuestos. */}
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
    </Card>
  );
}

/** Igual que en InspectionPanel: adapta la orden al contrato que espera ReportFormModal. */
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
