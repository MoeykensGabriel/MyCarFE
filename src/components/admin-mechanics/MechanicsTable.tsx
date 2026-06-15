"use client";

import { formatDate } from "@/lib/format";
import { Mechanic, PagedResult } from "@/types/api.types";

import { ActiveBadge, MechanicAvatar } from "./MechanicBadges";

interface Props {
  items: Mechanic[];
  data: PagedResult<Mechanic> | undefined;
  isLoading: boolean;
  isError: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/**
 * Listado de mecánicos. En lg+ es una tabla; abajo de lg cada mecánico es una
 * card que SELECCIONA igual que la fila (abre el panel de detalle, que en mobile
 * aparece debajo de la lista).
 */
export function MechanicsTable({ items, data, isLoading, isError, selectedId, onSelect }: Props) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden divide-y divide-[#c4c6cd]/40">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 sm:px-6 py-4">
            <div className="w-10 h-10 rounded-full bg-[#c4c6cd]/30 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 max-w-[60%] bg-[#c4c6cd]/30 rounded animate-pulse" />
              <div className="h-3 w-28 bg-[#c4c6cd]/20 rounded animate-pulse" />
            </div>
            <div className="h-5 w-16 bg-[#c4c6cd]/20 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm px-6 py-8 text-center">
        <p className="text-sm text-red-500">Error al cargar los mecánicos.</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm px-6 py-8 text-center">
        <p className="text-sm text-[#44474c]">No hay mecánicos.</p>
      </div>
    );
  }

  const footer = data && (
    <p className="text-xs text-[#44474c]/70">
      Mostrando {items.length} de {data.totalCount.toLocaleString("es-AR")} mecánicos
    </p>
  );

  return (
    <>
      {/* ── Tabla (desktop) ───────────────────────────────────────────────────── */}
      <div className="hidden lg:block bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden">
        {/* Cabecera */}
        <div className="grid grid-cols-[1fr_1fr_120px_90px] gap-4 px-6 py-3 bg-[#eefcfd] border-b border-[#c4c6cd]/60">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Nombre</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Contacto</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Especialidad</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Estado</p>
        </div>

        {/* Filas */}
        <div className="divide-y divide-[#c4c6cd]/40">
          {items.map((m) => {
            const isSelected = selectedId === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onSelect(m.id)}
                className={`w-full grid grid-cols-[1fr_1fr_120px_90px] gap-4 px-6 py-4 text-left transition-colors cursor-pointer border-l-4 ${
                  isSelected
                    ? "bg-[#fea520]/[0.05] border-l-[#fea520]"
                    : "hover:bg-[#eefcfd]/60 border-l-transparent"
                }`}
              >
                {/* Nombre + avatar */}
                <div className="flex items-center gap-3 min-w-0">
                  <MechanicAvatar m={m} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#041627] truncate">
                      {m.firstName} {m.lastName}
                    </p>
                    <p className="text-xs text-[#44474c]/60 truncate">
                      Desde {formatDate(m.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Contacto */}
                <div className="min-w-0 flex flex-col justify-center">
                  <p className="text-sm text-[#041627] truncate">{m.email}</p>
                  {m.phone && (
                    <p className="text-xs text-[#44474c] truncate">{m.phone}</p>
                  )}
                </div>

                {/* Especialidad */}
                <div className="flex items-center min-w-0">
                  {m.specialty ? (
                    <p className="text-xs text-[#44474c] truncate">{m.specialty}</p>
                  ) : (
                    <p className="text-xs text-[#44474c]/40 italic">—</p>
                  )}
                </div>

                {/* Estado */}
                <div className="flex items-center">
                  <ActiveBadge isActive={m.isActive} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#eefcfd]/60 border-t border-[#c4c6cd]/60">{footer}</div>
      </div>

      {/* ── Cards (mobile / tablet) ───────────────────────────────────────────── */}
      <div className="lg:hidden space-y-3">
        {items.map((m) => (
          <MechanicMobileCard
            key={m.id}
            mechanic={m}
            selected={selectedId === m.id}
            onSelect={onSelect}
          />
        ))}
        <div className="px-1 pt-1">{footer}</div>
      </div>
    </>
  );
}

function MechanicMobileCard({
  mechanic: m,
  selected,
  onSelect,
}: {
  mechanic: Mechanic;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(m.id)}
      className={`w-full text-left bg-white rounded-xl border shadow-sm p-4 transition-all ${
        selected
          ? "border-[#fea520] ring-1 ring-[#fea520]/40"
          : "border-[#c4c6cd] hover:border-[#fea520]/40 active:scale-[0.99]"
      }`}
    >
      {/* Nombre + contacto + estado */}
      <div className="flex items-start gap-3">
        <MechanicAvatar m={m} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#041627] truncate">
            {m.firstName} {m.lastName}
          </p>
          <p className="text-sm text-[#041627] truncate mt-0.5">{m.email}</p>
          {m.phone && <p className="text-xs text-[#44474c] truncate">{m.phone}</p>}
        </div>
        <div className="shrink-0">
          <ActiveBadge isActive={m.isActive} />
        </div>
      </div>

      {/* Especialidad + alta */}
      <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-[#c4c6cd]/40">
        <p className="text-xs text-[#44474c] truncate min-w-0">
          <span className="text-[#44474c]/60">Especialidad: </span>
          {m.specialty || "—"}
        </p>
        <span className="text-[10px] font-medium text-[#44474c]/60 whitespace-nowrap shrink-0">
          Desde {formatDate(m.createdAt)}
        </span>
      </div>
    </button>
  );
}
