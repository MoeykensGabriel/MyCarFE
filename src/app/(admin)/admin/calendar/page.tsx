"use client";

import { CalendarDays, Clock } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";

/**
 * Módulo Calendario — vacío a propósito.
 *
 * Por decisión del taller, la agenda y los turnos se organizan por fuera del
 * sistema (planilla externa). Acá no se gestiona ocupación ni se agendan órdenes.
 * Los datos que SÍ ayudan a esa organización externa (duración estimada de cada
 * servicio) siguen disponibles en el catálogo y en cada orden.
 */
export default function CalendarPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Calendario"
        subtitle="La agenda del taller se organiza por fuera del sistema."
        Icon={CalendarDays}
      />

      <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm px-6 py-16 flex flex-col items-center gap-3 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#eefcfd] border border-[#c4c6cd]/60 flex items-center justify-center">
          <CalendarDays className="w-6 h-6 text-[#c4c6cd]" />
        </div>
        <p className="text-sm font-semibold text-[#041627]">Sin agenda en el sistema</p>
        <p className="text-xs text-[#44474c] max-w-md leading-relaxed">
          Los turnos y la ocupación del taller se organizan por fuera (planilla externa).
          Para ayudarte con eso, cada servicio conserva su{" "}
          <span className="font-semibold text-[#041627]">duración estimada</span> en el catálogo
          y en el detalle de cada orden.
        </p>
        <p className="inline-flex items-center gap-1.5 text-[11px] text-[#44474c]/60 pt-1">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          Las duraciones estimadas siguen disponibles para tu organización.
        </p>
      </div>
    </div>
  );
}
