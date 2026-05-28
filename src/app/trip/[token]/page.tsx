"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Car, LogOut, LogIn, CheckCircle2, AlertCircle } from "lucide-react";
import { AxiosError } from "axios";

import {
  useTripStation,
  useStartTrip,
  useEndTrip,
} from "@/hooks/useVehicleTrips";
import type { ProblemDetails, VehicleTrip } from "@/types/api.types";

/**
 * Pantalla pública (sin login) que ve el chofer al escanear el QR pegado en el vehículo.
 * El token de la URL es la credencial. Si hay un viaje abierto, ofrece cerrarlo;
 * si no, abre uno nuevo con nombre + DNI + km.
 */
export default function TripPage() {
  const params = useParams<{ token: string }>();
  const token  = params.token;

  const { data, isLoading, isError, error } = useTripStation(token);
  const [doneTrip, setDoneTrip] = useState<VehicleTrip | null>(null);

  if (isLoading) {
    return <Wrapper><p className="text-sm text-gray-500">Cargando...</p></Wrapper>;
  }

  if (isError || !data) {
    const status = (error as AxiosError)?.response?.status;
    return (
      <Wrapper>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-red-700">
            {status === 404
              ? "Este QR no es válido. Pedile al encargado uno nuevo."
              : "No pudimos cargar este vehículo."}
          </p>
        </div>
      </Wrapper>
    );
  }

  // Confirmación post-acción
  if (doneTrip) {
    return (
      <Wrapper>
        <VehicleHeader station={data} />
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center mt-4">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
          <p className="text-base font-extrabold text-emerald-900">
            {doneTrip.endKm == null ? "¡Buen viaje!" : "Viaje cerrado"}
          </p>
          <p className="text-xs text-emerald-800/80 mt-1">
            {doneTrip.endKm == null
              ? `Saliste con ${doneTrip.startKm.toLocaleString("es-AR")} km`
              : `Llegada registrada con ${doneTrip.endKm.toLocaleString("es-AR")} km`}
          </p>
        </div>
      </Wrapper>
    );
  }

  // Hay viaje abierto → ofrecer cerrarlo
  if (data.openTrip) {
    return (
      <Wrapper>
        <VehicleHeader station={data} />
        <EndTripForm
          token={token}
          openTrip={data.openTrip}
          onDone={(trip) => setDoneTrip(trip)}
        />
      </Wrapper>
    );
  }

  // No hay viaje → abrir uno
  return (
    <Wrapper>
      <VehicleHeader station={data} />
      <StartTripForm
        token={token}
        suggestedKm={data.lastKnownKm}
        onDone={(trip) => setDoneTrip(trip)}
      />
    </Wrapper>
  );
}

// ─── Layout helper ───────────────────────────────────────────────────────────

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#041627] via-[#0a2540] to-[#041627] flex items-start sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#fea520] to-[#fec15d]" />
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function VehicleHeader({ station }: { station: { brand: string; model: string; licensePlate: string; lastKnownKm: number } }) {
  return (
    <div className="flex items-center gap-3 pb-4 mb-2 border-b border-gray-100">
      <div className="w-11 h-11 rounded-xl bg-[#041627] text-[#fea520] flex items-center justify-center shrink-0">
        <Car className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#fea520]">Estación de viaje</p>
        <h1 className="text-base font-black text-[#041627] truncate">
          {station.brand} {station.model}
        </h1>
        <span className="text-[11px] font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block">
          {station.licensePlate}
        </span>
      </div>
    </div>
  );
}

// ─── Formularios ─────────────────────────────────────────────────────────────

function StartTripForm({
  token,
  suggestedKm,
  onDone,
}: {
  token: string;
  suggestedKm: number;
  onDone: (trip: VehicleTrip) => void;
}) {
  const start = useStartTrip(token);
  const [driverName, setDriverName] = useState("");
  const [driverDocument, setDriverDocument] = useState("");
  const [startKm, setStartKm] = useState<string>(String(suggestedKm));
  const [err, setErr] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const km = Number(startKm);
    if (!driverName.trim()) return setErr("Ingresá tu nombre.");
    if (!driverDocument.trim()) return setErr("Ingresá tu DNI o identificación.");
    if (!Number.isFinite(km) || km < 0) return setErr("Km inválido.");

    start.mutate(
      { driverName: driverName.trim(), driverDocument: driverDocument.trim(), startKm: km },
      {
        onSuccess: (trip) => onDone(trip),
        onError: (e) => {
          const ax = e as AxiosError<ProblemDetails>;
          setErr(ax.response?.data?.detail ?? ax.response?.data?.title ?? "No se pudo registrar la salida.");
        },
      },
    );
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900 font-semibold flex items-center gap-2">
        <LogOut className="w-4 h-4" />
        Vas a salir con el vehículo
      </div>

      <Field label="Tu nombre">
        <input
          type="text"
          autoComplete="off"
          value={driverName}
          onChange={(e) => setDriverName(e.target.value)}
          className="w-full px-3 py-3 rounded-lg border border-gray-200 text-base bg-white"
          placeholder="Nombre y apellido"
          maxLength={150}
          disabled={start.isPending}
        />
      </Field>

      <Field label="Tu DNI / identificación">
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={driverDocument}
          onChange={(e) => setDriverDocument(e.target.value)}
          className="w-full px-3 py-3 rounded-lg border border-gray-200 text-base bg-white"
          maxLength={30}
          disabled={start.isPending}
        />
      </Field>

      <Field label="Km al salir">
        <input
          type="number"
          inputMode="numeric"
          value={startKm}
          onChange={(e) => setStartKm(e.target.value)}
          className="w-full px-3 py-3 rounded-lg border border-gray-200 text-base bg-white"
          disabled={start.isPending}
        />
        <p className="text-[10px] text-gray-500 mt-1">Sugerido: {suggestedKm.toLocaleString("es-AR")} km</p>
      </Field>

      {err && <p className="text-xs font-bold text-red-600">{err}</p>}

      <button
        type="submit"
        disabled={start.isPending}
        className="w-full py-4 rounded-xl text-sm font-black uppercase tracking-wider bg-gradient-to-r from-[#fea520] to-[#fec15d] text-[#041627] disabled:opacity-50"
      >
        {start.isPending ? "Registrando..." : "Salir con el vehículo →"}
      </button>
    </form>
  );
}

function EndTripForm({
  token,
  openTrip,
  onDone,
}: {
  token: string;
  openTrip: VehicleTrip;
  onDone: (trip: VehicleTrip) => void;
}) {
  const end = useEndTrip(token);
  const [endKm, setEndKm] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const km = Number(endKm);
    if (!Number.isFinite(km) || km < openTrip.startKm) {
      return setErr(`Km debe ser mayor o igual a ${openTrip.startKm.toLocaleString("es-AR")}`);
    }
    end.mutate(km, {
      onSuccess: (trip) => onDone(trip),
      onError: (e) => {
        const ax = e as AxiosError<ProblemDetails>;
        setErr(ax.response?.data?.detail ?? ax.response?.data?.title ?? "No se pudo cerrar el viaje.");
      },
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-900 font-semibold flex items-center gap-2">
        <LogIn className="w-4 h-4" />
        Estás devolviendo el vehículo
      </div>

      <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-xs">
        <p className="text-gray-600">
          Salió: <strong>{openTrip.driverName}</strong>
        </p>
        <p className="text-gray-600">
          Km de salida: <strong>{openTrip.startKm.toLocaleString("es-AR")}</strong>
        </p>
      </div>

      <Field label="Km al volver">
        <input
          type="number"
          inputMode="numeric"
          value={endKm}
          onChange={(e) => setEndKm(e.target.value)}
          autoFocus
          className="w-full px-3 py-3 rounded-lg border border-gray-200 text-base bg-white"
          disabled={end.isPending}
        />
      </Field>

      {err && <p className="text-xs font-bold text-red-600">{err}</p>}

      <button
        type="submit"
        disabled={end.isPending}
        className="w-full py-4 rounded-xl text-sm font-black uppercase tracking-wider bg-gradient-to-r from-[#fea520] to-[#fec15d] text-[#041627] disabled:opacity-50"
      >
        {end.isPending ? "Cerrando..." : "Cerrar viaje →"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627] block mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
