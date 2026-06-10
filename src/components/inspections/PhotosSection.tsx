"use client";

interface Props {
  files: File[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
}

/**
 * Fotos del estado inicial del área. Se suben al crear el reporte, vinculadas
 * a él (después del trabajo se saca la equivalente para el antes/después).
 */
export function PhotosSection({ files, onAdd, onRemove }: Props) {
  return (
    <div className="space-y-2 border-t border-[#041627]/5 pt-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627]">
          Fotos del área
        </p>
        <label className="text-[10px] font-bold uppercase tracking-wider text-[#fea520] hover:underline cursor-pointer">
          + Agregar foto
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={(e) => {
              const picked = Array.from(e.target.files ?? []);
              if (picked.length > 0) onAdd(picked);
              e.target.value = ""; // permite re-seleccionar el mismo archivo
            }}
          />
        </label>
      </div>
      {files.length === 0 ? (
        <p className="text-[10px] text-[#44474c]/60 italic">
          Sacá una foto del estado actual del área. Después del trabajo, sacarás una equivalente para tener antes/después.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {files.map((f, i) => (
            <div key={`${f.name}-${i}`} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={URL.createObjectURL(f)}
                alt={`Foto ${i + 1}`}
                className="w-full aspect-square object-cover rounded-md border border-[#041627]/10"
              />
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow"
                aria-label="Quitar"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
