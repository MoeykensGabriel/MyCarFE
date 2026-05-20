"use client";

import Link from "next/link";
import { Plus, Search, AlertCircle } from "lucide-react";

/**
 * Card de accesos rápidos: las acciones que el admin hace 20 veces por día.
 * Pensado para reducir clicks desde el dashboard a las tareas más frecuentes.
 */
export function QuickActionsCard() {
  return (
    <section className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-[#c4c6cd]/60 bg-[#041627]">
        <h2 className="text-sm font-bold text-white">Accesos rápidos</h2>
      </div>

      <div className="p-3 grid grid-cols-1 gap-2">
        <Link
          href="/admin/intake"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#fea520] text-[#041627] font-bold text-sm hover:bg-[#e8951d] active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Nuevo ingreso</span>
        </Link>

        <Link
          href="/admin/work-orders?status=2"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#eefcfd] text-[#041627] font-semibold text-sm border border-[#c4c6cd] hover:border-[#fea520] hover:bg-[#fea520]/5 transition-colors"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-[#fea520]" />
          <span>Pendientes de aprobación</span>
        </Link>

        <Link
          href="/admin/customers"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#eefcfd] text-[#041627] font-semibold text-sm border border-[#c4c6cd] hover:border-[#041627] transition-colors"
        >
          <Search className="w-4 h-4 shrink-0 text-[#44474c]" />
          <span>Buscar cliente</span>
        </Link>
      </div>
    </section>
  );
}
