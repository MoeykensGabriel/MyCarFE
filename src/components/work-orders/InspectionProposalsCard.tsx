"use client";

import { useState, useMemo } from "react";
import { Lightbulb, Package, Wrench } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInspectionReportsByWorkOrder } from "@/hooks/useInspections";
import { useConvertProposals } from "@/hooks/useWorkOrders";
import { formatCurrency } from "@/lib/format";

interface Props {
  workOrderId: string;
}

/**
 * Propuestas de los mecánicos (servicios + repuestos sugeridos en sus inspecciones).
 * El admin marca cuáles pasar al presupuesto y dispara la conversión.
 *
 * UI básica — se va a iterar el diseño después.
 */
export function InspectionProposalsCard({ workOrderId }: Props) {
  const { data: reports, isLoading } = useInspectionReportsByWorkOrder(workOrderId);
  const convert = useConvertProposals(workOrderId);

  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [selectedParts, setSelectedParts]       = useState<Set<string>>(new Set());

  const { allServices, allParts } = useMemo(() => {
    const servicesList: Array<{
      id: string;
      areaName: string;
      mechanic?: string | null;
      name: string;
      description?: string | null;
      estimatedLaborCost: number;
      estimatedDays?: number | null;
    }> = [];
    const partsList: Array<{
      id: string;
      areaName: string;
      mechanic?: string | null;
      name: string;
      quantity: number;
      productCode?: string | null;
      estimatedUnitPrice?: number | null;
    }> = [];

    for (const r of reports ?? []) {
      for (const ps of r.proposedServices) {
        servicesList.push({
          id: ps.id,
          areaName: r.areaName,
          mechanic: r.mechanicFullName,
          name: ps.name,
          description: ps.description,
          estimatedLaborCost: ps.estimatedLaborCost,
          estimatedDays: ps.estimatedDays,
        });
      }
      for (const pp of r.proposedParts) {
        partsList.push({
          id: pp.id,
          areaName: r.areaName,
          mechanic: r.mechanicFullName,
          name: pp.name,
          quantity: pp.quantity,
          productCode: pp.productCode,
          estimatedUnitPrice: pp.estimatedUnitPrice,
        });
      }
    }
    return { allServices: servicesList, allParts: partsList };
  }, [reports]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Propuestas de los mecánicos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-16 bg-gray-100 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (allServices.length === 0 && allParts.length === 0) return null;

  const toggle = (setFn: typeof setSelectedServices, id: string) =>
    setFn((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const onConvert = () => {
    if (selectedServices.size === 0 && selectedParts.size === 0) return;
    convert.mutate(
      {
        proposedServiceIds: Array.from(selectedServices),
        proposedPartIds:    Array.from(selectedParts),
      },
      {
        onSuccess: () => {
          setSelectedServices(new Set());
          setSelectedParts(new Set());
        },
      },
    );
  };

  const totalSelected = selectedServices.size + selectedParts.size;

  return (
    <Card className="border-amber-200">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              Propuestas de los mecánicos
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Items sugeridos en las inspecciones. Tildá los que quieras pasar al presupuesto.
            </p>
          </div>
          <Button
            size="sm"
            onClick={onConvert}
            disabled={totalSelected === 0 || convert.isPending}
          >
            {convert.isPending ? "Pasando..." : `Pasar al presupuesto (${totalSelected})`}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {allServices.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" /> Servicios sugeridos
            </p>
            <ul className="space-y-1.5">
              {allServices.map((s) => (
                <li
                  key={s.id}
                  className="flex items-start gap-2 rounded border border-gray-200 bg-white px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedServices.has(s.id)}
                    onChange={() => toggle(setSelectedServices, s.id)}
                    className="mt-1 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-semibold">{s.name}</span>
                      <span className="text-xs text-gray-500">
                        [{s.areaName}{s.mechanic ? ` · ${s.mechanic}` : ""}]
                      </span>
                    </div>
                    {s.description && (
                      <p className="text-xs text-gray-700">{s.description}</p>
                    )}
                    <p className="text-xs text-gray-600 mt-0.5">
                      Mano de obra aprox: <strong>{formatCurrency(s.estimatedLaborCost)}</strong>
                      {s.estimatedDays && (
                        <> · Días estim: <strong>{s.estimatedDays}</strong></>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {allParts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" /> Repuestos sugeridos
            </p>
            <ul className="space-y-1.5">
              {allParts.map((p) => (
                <li
                  key={p.id}
                  className="flex items-start gap-2 rounded border border-gray-200 bg-white px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedParts.has(p.id)}
                    onChange={() => toggle(setSelectedParts, p.id)}
                    className="mt-1 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-semibold">{p.name}</span>
                      <span className="text-xs text-gray-500">
                        [{p.areaName}{p.mechanic ? ` · ${p.mechanic}` : ""}]
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Cant: <strong>{p.quantity}</strong>
                      {p.productCode && <> · Código: <strong>{p.productCode}</strong></>}
                      {p.estimatedUnitPrice != null && (
                        <> · Precio aprox: <strong>{formatCurrency(p.estimatedUnitPrice)}</strong></>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
