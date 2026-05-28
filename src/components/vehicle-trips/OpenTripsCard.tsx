"use client";

import { useState } from "react";
import Link from "next/link";
import { Car, Clock, User, ChevronRight, X } from "lucide-react";

import { useOpenTripsForMyFleet, useCloseTripManually } from "@/hooks/useVehicleTrips";
import type { VehicleTrip } from "@/types/api.types";

/**
 * Card que muestra los viajes en curso de TODA la flota del encargado.
 * Refresca cada 60s. Cada fila tiene botón para cerrar manualmente (si el chofer se olvidó).
 */
export function OpenTripsCard() {
  const { data, isLoading } = useOpenTripsForMyFleet();
  const closeMutation = useCloseTripManually();
  const [closing, setClosing] = useState<VehicleTrip | null>(null);

  if (isLoading) return null;
  if (!data || data.length === 0) {
    return (
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 flex items-center gap-2">
        <Car className="w-4 h-4 text-emerald-700 shrink-0" />
        <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
          No hay vehículos afuera ahora
        </p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-2xl border border-[#041627]/10 shadow-md overflow-hidden">
      <div className="px-5 py-4 border-b border-[#041627]/5 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#fea520]/10 flex items-center justify-center">
          <Car className="w-4 h-4 text-[#fea520]" />
        </div>
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#fea520] leading-none">
            En curso
          </p>
          <h3 className="text-sm font-black text-[#041627] mt-0.5">
            Vehículos afuera ({data.length})
          </h3>
        </div>
      </div>
      <ul className="divide-y divide-[#041627]/5">
        {data.map((trip) => (
          <li key={trip.id} className="px-5 py-3 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono font-bold text-[#041627] bg-[#fea520]/10 border border-[#fea520]/30 px-1.5 py-0.5 rounded">
                  {trip.vehicleLicensePlate}
                </span>
                <span className="text-xs font-bold text-[#041627] truncate">
                  {trip.vehicleBrand} {trip.vehicleModel}
                </span>
              </div>
              <p className="text-[11px] text-[#44474c] mt-1 flex items-center gap-1">
                <User className="w-3 h-3" /> {trip.driverName} ({trip.driverDocument})
              </p>
              <p className="text-[10px] text-[#44474c]/70 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Salió {new Date(trip.startedAt).toLocaleString("es-AR")}
                {" "}· {trip.startKm.toLocaleString("es-AR")} km
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <Link
                href={`/my-vehicles/${trip.vehicleId}`}
                className="p-1.5 rounded-md text-[#44474c] hover:bg-[#f4f6f8]"
                aria-label="Ver vehículo"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setClosing(trip)}
                className="p-1.5 rounded-md text-red-500 hover:bg-red-50"
                aria-label="Cerrar manualmente"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {closing && (
        <CloseTripModal
          trip={closing}
          onClose={() => setClosing(null)}
          onConfirm={(endKm) => {
            closeMutation.mutate(
              { tripId: closing.id, endKm },
              { onSuccess: () => setClosing(null) },
            );
          }}
          pending={closeMutation.isPending}
        />
      )}
    </section>
  );
}

function CloseTripModal({
  trip,
  onClose,
  onConfirm,
  pending,
}: {
  trip: VehicleTrip;
  onClose: () => void;
  onConfirm: (endKm: number) => void;
  pending: boolean;
}) {
  const [endKm, setEndKm] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl p-5">
        <h3 className="text-sm font-black text-[#041627] mb-2">Cerrar viaje manualmente</h3>
        <p className="text-xs text-[#44474c] mb-4">
          {trip.vehicleBrand} {trip.vehicleModel} ({trip.vehicleLicensePlate})<br />
          Salió: <strong>{trip.driverName}</strong> con <strong>{trip.startKm.toLocaleString("es-AR")}</strong> km.
        </p>
        <label className="block">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627] block mb-1.5">
            Km al volver
          </span>
          <input
            type="number"
            value={endKm}
            onChange={(e) => setEndKm(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-base"
          />
        </label>
        {err && <p className="text-xs font-bold text-red-600 mt-2">{err}</p>}
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            disabled={pending}
            className="flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider border border-[#041627]/10 text-[#041627]"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              const km = Number(endKm);
              if (!Number.isFinite(km) || km < trip.startKm) {
                return setErr(`Km debe ser >= ${trip.startKm.toLocaleString("es-AR")}`);
              }
              onConfirm(km);
            }}
            disabled={pending}
            className="flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider bg-[#041627] text-[#fea520] disabled:opacity-50"
          >
            {pending ? "Cerrando..." : "Cerrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
