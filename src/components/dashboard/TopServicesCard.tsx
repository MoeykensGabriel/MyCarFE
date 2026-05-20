"use client";

import { TrendingUp, ListChecks } from "lucide-react";

import { DashboardTopService } from "@/types/api.types";

interface Props {
  items: DashboardTopService[];
}

/**
 * Widget: top 5 servicios más vendidos del mes (suma de cantidades, no de WOs únicas).
 * Útil para evaluar pricing y planificar stock de repuestos.
 */
export function TopServicesCard({ items }: Props) {
  // Para escalar las barras proporcionalmente. Mínimo 1 para evitar /0.
  const maxValue = Math.max(1, ...items.map((s) => s.timesUsed));

  return (
    <section className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden">
      <div className="border-b border-[#c4c6cd]/60 px-5 py-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-[#fea520]" />
        <h2 className="text-sm font-semibold text-[#041627]">Servicios más vendidos</h2>
      </div>

      {items.length === 0 ? (
        <div className="px-5 py-6 text-center">
          <p className="text-xs text-[#44474c]/70">
            Aún no hay servicios cargados este mes.
          </p>
        </div>
      ) : (
        <ul className="px-5 py-4 space-y-3">
          {items.map((s) => {
            const pct = Math.round((s.timesUsed / maxValue) * 100);
            return (
              <li key={s.catalogServiceId} className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-[#041627] truncate flex items-center gap-1 min-w-0">
                    <ListChecks className="w-3 h-3 text-[#44474c]/60 shrink-0" />
                    <span className="truncate">{s.name}</span>
                  </p>
                  <span className="text-xs font-bold text-[#041627] tabular-nums shrink-0">
                    {s.timesUsed}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#c4c6cd]/30">
                  <div
                    className="h-1.5 rounded-full bg-[#fea520] transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
