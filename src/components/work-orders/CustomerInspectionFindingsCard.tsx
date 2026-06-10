"use client";

import { ClipboardCheck, CheckCircle2, AlertTriangle, User } from "lucide-react";

import { formatDateTime } from "@/lib/format";
import { WorkOrderInspectionReportLite } from "@/types/api.types";

interface Props {
  reports: WorkOrderInspectionReportLite[];
}

/**
 * Vista para el cliente de las novedades de la inspección, por área, a medida
 * que los mecánicos van reportando. Solo muestra el hallazgo (qué encontraron
 * y quién); las propuestas con costos son internas y llegan recién con el
 * presupuesto. Si todavía no hay reportes, no renderiza nada.
 */
export function CustomerInspectionFindingsCard({ reports }: Props) {
  if (reports.length === 0) return null;

  // Cronológico: el cliente las va leyendo como un feed de avance.
  const sorted = [...reports].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const issueCount = sorted.filter((r) => r.hasIssue).length;

  return (
    <section className="bg-white rounded-2xl border border-[#041627]/10 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3.5 border-b border-[#041627]/5 bg-gradient-to-r from-[#eefcfd] to-white">
        <div className="flex items-center gap-2 min-w-0">
          <ClipboardCheck className="w-4 h-4 text-[#041627] shrink-0" strokeWidth={2} />
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627]/80 truncate">
            Novedades de la Inspección
          </p>
        </div>
        <span
          className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shrink-0 ${
            issueCount > 0
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
          }`}
        >
          {issueCount > 0
            ? `${issueCount} de ${sorted.length} con novedad`
            : `${sorted.length} ${sorted.length === 1 ? "área revisada" : "áreas revisadas"}`}
        </span>
      </div>

      {/* Feed de reportes por área */}
      <div className="divide-y divide-[#041627]/5">
        {sorted.map((report) => (
          <article key={report.id} className="px-4 py-3.5">
            <div className="flex items-start gap-2.5">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  report.hasIssue ? "bg-amber-50" : "bg-emerald-50"
                }`}
              >
                {report.hasIssue ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500" strokeWidth={2.25} />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={2.25} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="text-xs font-extrabold text-[#041627]">{report.areaName}</p>
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      report.hasIssue
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {report.hasIssue ? "Con novedad" : "Sin novedades"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                  {report.mechanicFullName && (
                    <p className="flex items-center gap-1 text-[10px] font-bold text-[#44474c]/75">
                      <User className="w-3 h-3 text-[#44474c]/40 shrink-0" />
                      {report.mechanicFullName}
                    </p>
                  )}
                  <p className="text-[10px] font-semibold text-[#44474c]/55">
                    {formatDateTime(report.createdAt)}
                  </p>
                </div>

                {report.findings && (
                  <p className="text-[11px] text-[#041627] font-medium leading-relaxed whitespace-pre-wrap mt-2 bg-[#f4f6f8] border border-[#041627]/5 rounded-lg px-3 py-2">
                    {report.findings}
                  </p>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="px-4 py-3 text-[10px] text-[#44474c]/60 leading-relaxed border-t border-[#041627]/5 bg-[#eefcfd]/40">
        Cada área la revisa un mecánico del taller. Si encuentra algo, lo verás acá;
        los trabajos sugeridos te llegan después con el presupuesto para que los apruebes.
      </p>
    </section>
  );
}
