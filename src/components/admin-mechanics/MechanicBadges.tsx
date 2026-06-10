"use client";

import { BadgeCheck, BadgeX } from "lucide-react";

import { Mechanic } from "@/types/api.types";

/** Badge de estado activo/inactivo del mecánico. */
export function ActiveBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-50 border border-green-200 text-green-700">
      <BadgeCheck className="w-3 h-3" />
      Activo
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 border border-red-200 text-red-600">
      <BadgeX className="w-3 h-3" />
      Inactivo
    </span>
  );
}

/** Avatar con iniciales del mecánico. */
export function MechanicAvatar({ m, size = "md" }: { m: Mechanic; size?: "sm" | "md" | "lg" }) {
  const initials = `${m.firstName[0] ?? ""}${m.lastName[0] ?? ""}`.toUpperCase();
  const sz =
    size === "lg" ? "w-16 h-16 text-xl"
    : size === "sm" ? "w-8 h-8 text-xs"
    : "w-10 h-10 text-sm";

  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center font-bold shrink-0 bg-[#041627] text-white`}
    >
      {initials}
    </div>
  );
}
