"use client";

import Link from "next/link";
import { Clock, ChevronRight, AlertCircle } from "lucide-react";

import { DashboardExpiringApproval } from "@/types/api.types";

interface Props {
  items: DashboardExpiringApproval[];
}

/**
 * Widget: aprobaciones cuyo token vence en las próximas 24 hs.
 * Pensado para que el admin contacte al cliente / reenvíe el link a tiempo.
 */
export function ExpiringApprovalsCard({ items }: Props) {
  return (
    <section className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden">
      <div className="border-b border-[#c4c6cd]/60 px-5 py-4 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-[#fea520]" />
        <h2 className="text-sm font-semibold text-[#041627]">Aprobaciones por vencer</h2>
      </div>

      {items.length === 0 ? (
        <div className="px-5 py-6 text-center">
          <p className="text-xs text-[#44474c]/70">
            Sin aprobaciones próximas a vencer.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[#c4c6cd]/40">
          {items.map((a) => {
            const urgent = a.hoursLeft <= 6;
            return (
              <li key={a.workOrderId}>
                <Link
                  href={`/admin/work-orders/${a.workOrderId}`}
                  className="flex items-start gap-3 px-5 py-3 hover:bg-[#eefcfd]/60 transition-colors"
                >
                  <div className={`mt-0.5 w-1 self-stretch rounded-full shrink-0 ${urgent ? "bg-red-500" : "bg-[#fea520]"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#041627] truncate">
                      {a.vehicleBrand} {a.vehicleModel}
                    </p>
                    <p className="text-[11px] text-[#44474c] truncate">
                      {a.customerName ?? "—"} · {a.vehicleLicensePlate}
                    </p>
                    <p className={`text-[11px] font-semibold mt-1 inline-flex items-center gap-1 ${urgent ? "text-red-600" : "text-[#865300]"}`}>
                      <Clock className="w-3 h-3" />
                      {a.hoursLeft === 0 ? "Vence en menos de 1 h" : `Vence en ${a.hoursLeft} h`}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#c4c6cd] shrink-0 mt-1" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
