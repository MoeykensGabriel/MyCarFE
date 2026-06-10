"use client";

import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { UserRoundPlus, Wrench } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Pagination } from "@/components/shared/Pagination";
import { SearchInput } from "@/components/shared/SearchInput";
import { useAdminMechanics } from "@/hooks/useAdminMechanics";
import { MechanicsTable } from "@/components/admin-mechanics/MechanicsTable";
import { MechanicDetailPanel } from "@/components/admin-mechanics/MechanicDetailPanel";
import { CreateMechanicModal } from "@/components/admin-mechanics/CreateMechanicModal";

type ActiveFilter = "all" | "active" | "inactive";

const ACTIVE_TABS: { key: ActiveFilter; label: string }[] = [
  { key: "all",      label: "Todos"    },
  { key: "active",   label: "Activos"  },
  { key: "inactive", label: "Inactivos" },
];

/**
 * ABM de mecánicos del taller: listado paginado con filtros, panel lateral de
 * detalle (áreas, generalista, activar/desactivar) y modal de alta.
 * Componentes en components/admin-mechanics/.
 */
export default function MechanicsPage() {
  const [page,         setPage]         = useState(1);
  const [search,       setSearch]       = useState<string | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [selectedId,   setSelectedId]   = useState<string | null>(null);
  const [showCreate,   setShowCreate]   = useState(false);

  const isActiveParam =
    activeFilter === "active"   ? true
    : activeFilter === "inactive" ? false
    : undefined;

  const { data, isLoading, isError } = useAdminMechanics({
    page,
    pageSize: 20,
    search,
    isActive: isActiveParam,
  });

  const handleSearch = useDebouncedCallback((value: string) => {
    setPage(1);
    setSearch(value || undefined);
  }, 350);

  const items = data?.items ?? [];
  const selectedMechanic = items.find((m) => m.id === selectedId) ?? null;

  function selectRow(id: string) {
    setSelectedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <PageHeader
        title="Mecánicos"
        subtitle={data ? `${data.totalCount.toLocaleString("es-AR")} registrados` : "Cargando mecánicos..."}
        Icon={Wrench}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Tabs activo/inactivo */}
            <div className="flex bg-white border border-[#c4c6cd] p-1 rounded-lg gap-0.5">
              {ACTIVE_TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => { setActiveFilter(key); setPage(1); setSelectedId(null); }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    activeFilter === key
                      ? "bg-[#041627] text-white"
                      : "text-[#44474c] hover:bg-[#eefcfd]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#fea520] text-[#041627] text-sm font-bold rounded-lg hover:bg-[#865300] hover:text-white shadow-sm transition-all"
            >
              <UserRoundPlus className="w-4 h-4" />
              Nuevo mecánico
            </button>
          </div>
        }
      />

      {/* ── Búsqueda ───────────────────────────────────────────────────────── */}
      <SearchInput
        placeholder="Buscar nombre, email o especialidad..."
        onChange={handleSearch}
        className="max-w-sm"
      />

      {/* ── Contenido ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">

        {/* Tabla */}
        <div className="flex-1 min-w-0 space-y-3">
          <MechanicsTable
            items={items}
            data={data}
            isLoading={isLoading}
            isError={isError}
            selectedId={selectedId}
            onSelect={selectRow}
          />

          {data && (
            <Pagination
              currentPage={data.page}
              totalPages={data.totalPages}
              hasNextPage={data.hasNextPage}
              hasPreviousPage={data.hasPreviousPage}
              onPageChange={(p) => { setPage(p); setSelectedId(null); }}
            />
          )}
        </div>

        {/* Panel de detalle */}
        {selectedMechanic && (
          <MechanicDetailPanel
            mechanic={selectedMechanic}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>

      {/* Modal de creación */}
      {showCreate && (
        <CreateMechanicModal
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
