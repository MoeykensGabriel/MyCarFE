"use client";

import { useState } from "react";
import { X, Layers } from "lucide-react";

import { AreaMultiSelectField } from "@/components/shared/AreaMultiSelectField";
import { useAssignMechanicAreas } from "@/hooks/useAdminMechanics";
import { Mechanic } from "@/types/api.types";

interface Props {
  mechanic: Mechanic;
  onClose: () => void;
}

/** Modal para editar las áreas asignadas (M-a-N) de un mecánico existente. */
export function EditMechanicAreasModal({ mechanic, onClose }: Props) {
  const assignAreas = useAssignMechanicAreas();
  const [selected, setSelected] = useState<string[]>(
    (mechanic.areas ?? []).map((a) => a.id)
  );

  function handleSave() {
    assignAreas.mutate(
      { id: mechanic.id, areaIds: selected },
      { onSuccess: () => onClose() }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#c4c6cd]/60">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#fea520]" />
            <h2 className="text-base font-bold text-[#041627]">
              Áreas de {mechanic.firstName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#44474c] hover:bg-[#eefcfd] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <AreaMultiSelectField
            value={selected}
            onChange={setSelected}
            includeInactive
          />

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[#eefcfd] text-[#041627] border border-[#c4c6cd] hover:bg-[#c4c6cd]/30 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={assignAreas.isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[#fea520] text-[#041627] hover:bg-[#e8951d] transition-all disabled:opacity-50"
            >
              {assignAreas.isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
