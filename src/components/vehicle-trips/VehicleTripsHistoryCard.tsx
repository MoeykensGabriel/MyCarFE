"use client";

import { ListChecks, User } from "lucide-react";

import { useVehicleTrips } from "@/hooks/useVehicleTrips";
import { VehicleTripStatus, VehicleTripStatusLabel } from "@/lib/enums";

const STATUS_BADGE: Record<VehicleTripStatus, string> = {
  [VehicleTripStatus.Open]:            "bg-amber-100 text-amber-800 border-amber-200",
  [VehicleTripStatus.Closed]:          "bg-emerald-100 text-emerald-800 border-emerald-200",
  [VehicleTripStatus.AutoClosed]:      "bg-orange-100 text-orange-800 border-orange-200",
  [VehicleTripStatus.ClosedByContact]: "bg-gray-100 text-gray-800 border-gray-200",
};

export function VehicleTripsHistoryCard({ vehicleId }: { vehicleId: string }) {
  const { data, isLoading } = useVehicleTrips(vehicleId);

  if (isLoading) return null;
  if (!data || data.length === 0) {
    return (
      <section className="bg-white rounded-2xl border border-[#041627]/10 shadow-md p-5">
        <div className="flex items-center gap-2 mb-2">
          <ListChecks className="w-4 h-4 text-[#fea520]" />
          <h3 className="text-sm font-black text-[#041627]">Historial de viajes</h3>
        </div>
        <p className="text-xs text-[#44474c]/70 italic">
          Todavía no hay viajes registrados con el QR de este vehículo.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-2xl border border-[#041627]/10 shadow-md overflow-hidden">
      <div className="px-5 py-4 border-b border-[#041627]/5 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#fea520]/10 flex items-center justify-center">
          <ListChecks className="w-4 h-4 text-[#fea520]" />
        </div>
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#fea520] leading-none">
            Historial
          </p>
          <h3 className="text-sm font-black text-[#041627] mt-0.5">Viajes ({data.length})</h3>
        </div>
      </div>
      <ul className="divide-y divide-[#041627]/5 max-h-96 overflow-y-auto">
        {data.map((t) => {
          const distance = t.endKm != null ? t.endKm - t.startKm : null;
          return (
            <li key={t.id} className="px-5 py-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-bold text-[#041627] flex items-center gap-1">
                  <User className="w-3 h-3 text-[#44474c]" />
                  {t.driverName}
                </p>
                <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${STATUS_BADGE[t.status]}`}>
                  {VehicleTripStatusLabel[t.status]}
                </span>
              </div>
              <p className="text-[10px] text-[#44474c]/70 mt-0.5">DNI {t.driverDocument}</p>
              <p className="text-[11px] text-[#041627] mt-1">
                {t.startKm.toLocaleString("es-AR")} km
                {t.endKm != null && (
                  <>
                    {" → "}
                    {t.endKm.toLocaleString("es-AR")} km
                    {distance != null && (
                      <span className="text-[#44474c]/70"> · {distance.toLocaleString("es-AR")} km recorridos</span>
                    )}
                  </>
                )}
              </p>
              <p className="text-[10px] text-[#44474c]/70 mt-0.5">
                {new Date(t.startedAt).toLocaleString("es-AR")}
                {t.endedAt && <> → {new Date(t.endedAt).toLocaleString("es-AR")}</>}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
