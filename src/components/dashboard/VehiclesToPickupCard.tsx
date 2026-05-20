"use client";

import Link from "next/link";
import { Car, MessageCircle, ChevronRight, PackageCheck } from "lucide-react";

import { DashboardVehicleToPickup } from "@/types/api.types";
import { isValidArgentinaPhone, normalizePhone } from "@/lib/argentina-validation";
import { workshop } from "@/lib/workshop-contact";

interface Props {
  items: DashboardVehicleToPickup[];
}

/**
 * Widget: vehículos terminados (Completed) que el cliente aún no retiró.
 *
 * Importante operativamente: cada auto sin retirar ocupa un lugar físico del taller.
 * Si el cliente tiene teléfono válido, ofrecemos botón directo a WhatsApp con
 * mensaje pre-armado para que el admin lo contacte en un click.
 */
export function VehiclesToPickupCard({ items }: Props) {
  return (
    <section className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden">
      <div className="border-b border-[#c4c6cd]/60 px-5 py-4 flex items-center gap-2">
        <PackageCheck className="w-4 h-4 text-emerald-600" />
        <h2 className="text-sm font-semibold text-[#041627]">Listos para retirar</h2>
        {items.length > 0 && (
          <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <Car className="w-8 h-8 text-[#c4c6cd] mx-auto mb-2" />
          <p className="text-xs text-[#44474c]/70">
            No hay vehículos esperando ser retirados.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[#c4c6cd]/40">
          {items.map((v) => {
            const waitingStyle =
              v.daysWaiting >= 7
                ? "text-red-700"
                : v.daysWaiting >= 3
                  ? "text-amber-700"
                  : "text-[#44474c]";

            const waitingLabel =
              v.daysWaiting === 0
                ? "Listo hoy"
                : v.daysWaiting === 1
                  ? "Listo hace 1 día"
                  : `Listo hace ${v.daysWaiting} días`;

            return (
              <li key={v.workOrderId} className="px-5 py-3 space-y-2">
                <Link
                  href={`/admin/work-orders/${v.workOrderId}`}
                  className="block group"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#041627] truncate group-hover:text-[#865300] transition-colors">
                        {v.vehicleBrand} {v.vehicleModel}
                      </p>
                      <p className="text-[11px] text-[#44474c] truncate">
                        {v.customerName} · <span className="font-mono">{v.vehicleLicensePlate}</span>
                      </p>
                      <p className={`text-[11px] font-semibold mt-1 ${waitingStyle}`}>
                        {waitingLabel}
                      </p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#c4c6cd] shrink-0 mt-0.5 group-hover:text-[#041627] transition-colors" />
                  </div>
                </Link>

                {/* Botón WhatsApp si hay teléfono válido del cliente */}
                {v.customerPhone && isValidArgentinaPhone(v.customerPhone) && (
                  <a
                    href={buildPickupWhatsappLink(v)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#25D366]/10 text-[#1ebe5d] border border-[#25D366]/30 hover:bg-[#25D366]/20 transition-colors"
                  >
                    <MessageCircle className="w-3 h-3" />
                    Avisar al cliente
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/**
 * Arma el link de WhatsApp con un mensaje pre-llenado para avisar al cliente.
 * Usa el teléfono del cliente normalizado y un texto cordial estándar.
 */
function buildPickupWhatsappLink(v: DashboardVehicleToPickup): string {
  // normalizePhone deja sólo dígitos + "+"; wa.me requiere sin "+".
  const normalized = normalizePhone(v.customerPhone ?? "").replace(/^\+/, "");

  const greeting = workshop.name ? `Hola, te escribimos de ${workshop.name}.` : "Hola.";
  const message = `${greeting} Tu ${v.vehicleBrand} ${v.vehicleModel} (${v.vehicleLicensePlate}) está listo para retirar. ¿Cuándo lo pasás a buscar?`;

  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
