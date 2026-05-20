"use client";

import { Trophy, Wrench } from "lucide-react";

import { DashboardTopMechanic } from "@/types/api.types";

interface Props {
  items: DashboardTopMechanic[];
}

const MEDALS = ["1°", "2°", "3°"];

/**
 * Widget: top 5 mecánicos por servicios finalizados en el mes actual.
 */
export function TopMechanicsCard({ items }: Props) {
  return (
    <section className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden">
      <div className="border-b border-[#c4c6cd]/60 px-5 py-4 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-[#fea520]" />
        <h2 className="text-sm font-semibold text-[#041627]">Top mecánicos del mes</h2>
      </div>

      {items.length === 0 ? (
        <div className="px-5 py-6 text-center">
          <p className="text-xs text-[#44474c]/70">
            Aún no hay servicios finalizados este mes.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[#c4c6cd]/40">
          {items.map((m, i) => {
            const medal = MEDALS[i];
            return (
              <li
                key={m.mechanicId}
                className="flex items-center gap-3 px-5 py-2.5"
              >
                <span className="text-base shrink-0 w-6 text-center">
                  {medal}
                </span>
                <p className="text-sm font-medium text-[#041627] flex-1 min-w-0 truncate">
                  {m.fullName}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#041627] tabular-nums shrink-0">
                  <Wrench className="w-3 h-3 text-[#44474c]/60" />
                  {m.completedCount}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
