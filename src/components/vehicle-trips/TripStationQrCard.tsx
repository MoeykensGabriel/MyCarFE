"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer, RotateCw, QrCode, AlertCircle } from "lucide-react";

import { useRegenerateTripToken } from "@/hooks/useVehicleTrips";

interface Props {
  vehicleId: string;
  vehicleLabel: string; // "Renault Kangoo · ABC123"
  tripToken?: string | null;
}

/**
 * Card que muestra el QR de la estación de viajes del vehículo. Solo aplica a flotas.
 * Si todavía no hay token, ofrece generarlo. Si hay, muestra el QR + URL + acciones.
 *
 * UI básica — iteramos diseño después.
 */
export function TripStationQrCard({ vehicleId, vehicleLabel, tripToken }: Props) {
  const regen = useRegenerateTripToken(vehicleId);
  const [confirmRegen, setConfirmRegen] = useState(false);

  // Construimos la URL pública del chofer
  const publicUrl =
    typeof window !== "undefined" && tripToken
      ? `${window.location.origin}/trip/${tripToken}`
      : "";

  const print = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <section className="bg-white rounded-2xl border border-[#041627]/10 shadow-md overflow-hidden">
      <div className="px-5 py-4 border-b border-[#041627]/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#fea520]/10 flex items-center justify-center">
            <QrCode className="w-4 h-4 text-[#fea520]" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#fea520] leading-none">
              Choferes
            </p>
            <h3 className="text-sm font-black text-[#041627] mt-0.5">Estación de viajes (QR)</h3>
          </div>
        </div>
      </div>

      <div className="px-5 py-4">
        {!tripToken ? (
          <div className="text-center py-4">
            <p className="text-xs text-[#44474c]/85 mb-3 leading-relaxed">
              Generá un QR para pegar dentro del vehículo. Los choferes lo escanean al subirse
              y al bajarse para registrar km — <strong>sin necesitar cuenta en la app</strong>.
            </p>
            <button
              onClick={() => regen.mutate()}
              disabled={regen.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-[#041627] text-[#fea520] hover:bg-[#0a2540] disabled:opacity-50"
            >
              <QrCode className="w-4 h-4" />
              {regen.isPending ? "Generando..." : "Generar QR"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Bloque imprimible: QR + plate */}
            <div className="qr-printable bg-white border-2 border-dashed border-[#041627]/15 rounded-xl p-4 flex flex-col items-center">
              <p className="text-xs font-black text-[#041627] mb-2 text-center">{vehicleLabel}</p>
              <QRCodeSVG value={publicUrl} size={180} level="M" includeMargin />
              <p className="text-[10px] font-semibold text-[#44474c] mt-2 text-center max-w-[200px]">
                Escaneá al subirte y al bajarte para registrar tu viaje.
              </p>
            </div>

            <div className="bg-[#f4f6f8] rounded-lg p-2.5 text-[10px] font-mono text-[#44474c] break-all">
              {publicUrl}
            </div>

            <div className="flex gap-2">
              <button
                onClick={print}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider bg-[#041627] text-[#fea520] hover:bg-[#0a2540]"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir
              </button>
              <button
                onClick={() => setConfirmRegen(true)}
                disabled={regen.isPending}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider border border-[#041627]/10 text-[#041627] hover:bg-[#f4f6f8] disabled:opacity-50"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Regenerar
              </button>
            </div>

            {confirmRegen && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-2">
                <p className="text-xs text-amber-900 font-bold flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  Si regenerás, el QR anterior deja de funcionar. Vas a tener que reimprimir y reemplazar el sticker del auto.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      regen.mutate(undefined, { onSettled: () => setConfirmRegen(false) });
                    }}
                    disabled={regen.isPending}
                    className="flex-1 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    Sí, regenerar
                  </button>
                  <button
                    onClick={() => setConfirmRegen(false)}
                    className="flex-1 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider border border-[#041627]/10 text-[#041627]"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Estilos de impresión: oculta todo lo de afuera del QR */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .qr-printable, .qr-printable * { visibility: visible; }
          .qr-printable { position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); }
        }
      `}</style>
    </section>
  );
}
