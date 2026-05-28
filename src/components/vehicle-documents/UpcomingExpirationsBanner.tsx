"use client";

import Link from "next/link";
import { AlertTriangle, ChevronRight, ShieldAlert } from "lucide-react";

import { useUpcomingExpirationsForMe } from "@/hooks/useVehicleDocuments";
import { VehicleDocumentTypeShort } from "@/lib/enums";

/**
 * Banner que aparece en la lista de vehículos del cliente cuando hay
 * documentos próximos a vencer o ya vencidos. Click en cada item → detalle del vehículo.
 *
 * No renderiza nada si no hay alertas.
 */
export function UpcomingExpirationsBanner({
  horizonDays = 60,
  maxItems = 5,
  title,
  hideWhenEmpty = true,
}: {
  horizonDays?: number;
  /** Cuántos items listar; default 5. Para vista expandida (flota), pasar un número grande o Infinity. */
  maxItems?: number;
  /** Override del título. Default: contextual según estado. */
  title?: string;
  /** Si false, muestra una card "todo al día" en vez de no renderizar nada. */
  hideWhenEmpty?: boolean;
}) {
  const { data, isLoading } = useUpcomingExpirationsForMe(horizonDays);

  if (isLoading) return null;

  if (!data || data.length === 0) {
    if (hideWhenEmpty) return null;
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 flex items-center gap-2">
        <span className="text-emerald-700 text-xs font-extrabold uppercase tracking-wider">
          Toda la documentación está al día
        </span>
      </div>
    );
  }

  const overdue  = data.filter((d) => d.daysUntilExpiration < 0);
  const soon     = data.filter((d) => d.daysUntilExpiration >= 0);
  const hasOverdue = overdue.length > 0;

  return (
    <div
      className={`rounded-2xl border shadow-sm overflow-hidden ${
        hasOverdue
          ? "border-red-200 bg-red-50/60"
          : "border-amber-200 bg-amber-50/60"
      }`}
    >
      <div className="px-4 py-3 flex items-center gap-2 border-b border-[#041627]/5">
        {hasOverdue ? (
          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        )}
        <p className="text-xs font-extrabold uppercase tracking-wider text-[#041627]">
          {title
            ?? (hasOverdue
              ? `Tenés ${overdue.length} vencimiento${overdue.length !== 1 ? "s" : ""} pasado${overdue.length !== 1 ? "s" : ""}`
              : `Próximos vencimientos (${soon.length})`)}
        </p>
      </div>
      <ul className="divide-y divide-[#041627]/5">
        {data.slice(0, maxItems).map((item) => {
          const days = item.daysUntilExpiration;
          const label =
            days < 0
              ? `Vencido hace ${Math.abs(days)} día${Math.abs(days) === 1 ? "" : "s"}`
              : days === 0
                ? "Vence hoy"
                : `Vence en ${days} día${days === 1 ? "" : "s"}`;

          const tone =
            days < 0
              ? "text-red-700 bg-red-100 border-red-200"
              : days <= 7
                ? "text-red-700 bg-red-100 border-red-200"
                : "text-amber-800 bg-amber-100 border-amber-200";

          return (
            <li key={item.id}>
              <Link
                href={`/my-vehicles/${item.vehicleId}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/70 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-[#041627] truncate">
                    {VehicleDocumentTypeShort[item.documentType]}{" "}
                    <span className="text-[#44474c] font-semibold">
                      · {item.vehicleBrand} {item.vehicleModel}
                    </span>{" "}
                    <span className="text-[10px] font-mono text-[#44474c]/70">
                      ({item.vehicleLicensePlate})
                    </span>
                  </p>
                  <span
                    className={`inline-block mt-0.5 text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${tone}`}
                  >
                    {label}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#44474c]/40 shrink-0" />
              </Link>
            </li>
          );
        })}
      </ul>
      {data.length > maxItems && (
        <p className="px-4 py-2 text-[10px] text-[#44474c]/70 italic bg-white/40 border-t border-[#041627]/5">
          + {data.length - maxItems} más en tus vehículos
        </p>
      )}
    </div>
  );
}
