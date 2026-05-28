"use client";

import { Layers } from "lucide-react";
import { useAreas } from "@/hooks/useAreas";

interface Props {
  /** IDs de áreas seleccionadas */
  value: string[];
  /** Callback con la nueva lista de IDs */
  onChange: (areaIds: string[]) => void;
  /** Solo lectura — útil para preview */
  disabled?: boolean;
  /** Mostrar áreas inactivas también (útil para edición de mecánicos legacy) */
  includeInactive?: boolean;
}

/**
 * Multi-select de áreas como lista de checkboxes. Adecuado para volúmenes
 * pequeños (≤ 30 áreas). Si crece mucho se reemplaza por un command palette.
 */
export function AreaMultiSelectField({
  value,
  onChange,
  disabled = false,
  includeInactive = false,
}: Props) {
  const { data: areas, isLoading, isError } = useAreas(includeInactive);

  function toggle(id: string) {
    if (disabled) return;
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-1.5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-8 rounded-md bg-[#c4c6cd]/20 animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError || !areas) {
    return <p className="text-xs text-red-500">No se pudieron cargar las áreas.</p>;
  }

  if (areas.length === 0) {
    return (
      <p className="text-xs text-[#44474c]/70 italic">
        No hay áreas registradas. Crealas desde /admin/areas.
      </p>
    );
  }

  const selectedCount = value.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] text-[#44474c]/70">
        <span className="inline-flex items-center gap-1">
          <Layers className="w-3 h-3" />
          {selectedCount === 0
            ? "Ninguna área seleccionada"
            : `${selectedCount} área${selectedCount === 1 ? "" : "s"} seleccionada${selectedCount === 1 ? "" : "s"}`}
        </span>
        {selectedCount > 0 && !disabled && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[10px] font-medium text-[#44474c] hover:text-[#041627] underline-offset-2 hover:underline"
          >
            Limpiar
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
        {areas.map((area) => {
          const checked = value.includes(area.id);
          return (
            <label
              key={area.id}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs cursor-pointer transition-all ${
                checked
                  ? "bg-[#fea520]/[0.10] border-[#fea520] text-[#041627] font-semibold"
                  : "bg-white border-[#c4c6cd] text-[#44474c] hover:border-[#041627]/40"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${
                !area.isActive ? "italic" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(area.id)}
                className="w-3.5 h-3.5 accent-[#fea520] shrink-0"
              />
              <span className="truncate">
                {area.name}
                {!area.isActive && (
                  <span className="ml-1 text-[9px] uppercase text-red-500">(inactiva)</span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
