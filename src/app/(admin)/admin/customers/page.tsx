"use client";

import Link from "next/link";
import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import {
  UserPlus,
  X,
  Gauge,
  Tag,
  ChevronRight,
  ExternalLink,
  CarFront,
} from "lucide-react";

import { Pagination } from "@/components/shared/Pagination";
import { SearchInput } from "@/components/shared/SearchInput";
import { DocumentTypeLabel } from "@/lib/enums";
import { formatDate } from "@/lib/format";
import { useCustomers, useCustomer } from "@/hooks/useCustomers";
import { useVehicles } from "@/hooks/useVehicles";
import { Customer } from "@/types/api.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(c: Customer) {
  return `${c.firstName[0] ?? ""}${c.lastName[0] ?? ""}`.toUpperCase();
}

function memberSince(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  customer,
  size = "md",
}: {
  customer: Customer;
  size?: "sm" | "md" | "lg";
}) {
  const isFleet = !!customer.fleetId;
  const sizeClass = size === "lg" ? "w-16 h-16 text-xl" : size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-bold shrink-0 ${
        isFleet
          ? "bg-[#041627] text-white"
          : "bg-[#eefcfd] border border-[#c4c6cd] text-[#041627]"
      }`}
    >
      {initials(customer)}
    </div>
  );
}

// ─── Type badge ───────────────────────────────────────────────────────────────

function TypeBadge({ isFleet }: { isFleet: boolean }) {
  return isFleet ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#041627] text-white">
      Flota
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#eefcfd] border border-[#c4c6cd] text-[#041627]">
      Particular
    </span>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  customerId,
  onClose,
}: {
  customerId: string;
  onClose: () => void;
}) {
  const { data: customer, isLoading } = useCustomer(customerId);
  const { data: vehiclesData, isLoading: vehiclesLoading } = useVehicles({
    customerId,
    pageSize: 10,
  });
  const vehicles = vehiclesData?.items ?? [];

  return (
    <aside className="w-full lg:w-80 shrink-0 bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden flex flex-col self-start lg:sticky lg:top-0">
      {/* Header del panel */}
      <div className="border-b border-[#c4c6cd]/60 px-5 py-4">
        <div className="flex items-start justify-between mb-4">
          {isLoading ? (
            <div className="w-16 h-16 rounded-full bg-[#c4c6cd]/30 animate-pulse" />
          ) : customer ? (
            <Avatar customer={customer} size="lg" />
          ) : null}
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#44474c] hover:bg-[#eefcfd] hover:text-[#041627] transition-colors"
            aria-label="Cerrar panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <div className="h-5 w-40 bg-[#c4c6cd]/30 rounded animate-pulse" />
            <div className="h-3 w-28 bg-[#c4c6cd]/20 rounded animate-pulse" />
          </div>
        ) : customer ? (
          <>
            <h3 className="text-base font-bold text-[#041627]">
              {customer.firstName} {customer.lastName}
            </h3>
            <p className="text-xs text-[#44474c] mt-0.5">
              Cliente desde {memberSince(customer.createdAt)}
            </p>

            {/* Mini stats */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="rounded-lg bg-[#eefcfd] border border-[#c4c6cd]/60 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70 mb-1">
                  Documento
                </p>
                <p className="text-sm font-semibold text-[#041627]">
                  {DocumentTypeLabel[customer.documentType]}
                </p>
                <p className="text-xs font-mono text-[#44474c]">{customer.documentNumber}</p>
              </div>
              <div className="rounded-lg bg-[#eefcfd] border border-[#c4c6cd]/60 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70 mb-1">
                  Tipo
                </p>
                <div className="mt-1">
                  <TypeBadge isFleet={!!customer.fleetId} />
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Vehículos */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">
            Vehículos registrados
          </p>
          {vehicles.length > 0 && (
            <span className="text-[10px] font-bold text-[#041627] bg-[#eefcfd] border border-[#c4c6cd]/60 rounded-full px-2 py-0.5">
              {vehicles.length}
            </span>
          )}
        </div>

        {vehiclesLoading ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-20 rounded-lg bg-[#c4c6cd]/20 animate-pulse" />
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <p className="text-xs text-[#44474c]/70 italic">Sin vehículos registrados.</p>
        ) : (
          <div className="space-y-2">
            {vehicles.map((v) => (
              <Link
                key={v.id}
                href={`/admin/vehicles/${v.id}`}
                className="block rounded-lg border border-[#c4c6cd] p-3 hover:border-[#fea520] hover:bg-[#fea520]/[0.03] transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-semibold text-[#041627]">
                      {v.brand} {v.model}
                    </p>
                    <p className="text-xs text-[#44474c]">{v.year}{v.color ? ` · ${v.color}` : ""}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#c4c6cd] group-hover:text-[#fea520] shrink-0 mt-0.5 transition-colors" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#44474c]">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span className="font-mono font-semibold">{v.licensePlate}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Gauge className="w-3 h-3" />
                    <span>{v.currentMileage.toLocaleString("es-AR")} km</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer de acciones */}
      {customer && (
        <div className="border-t border-[#c4c6cd]/60 px-5 py-4 space-y-2">
          {/* Si no tiene vehículos, CTA principal para registrar uno */}
          {vehicles.length === 0 && !vehiclesLoading && (
            <Link
              href={`/admin/customers/${customerId}/add-vehicle`}
              className="flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-bold text-[#041627] bg-[#fea520] hover:bg-[#865300] hover:text-white transition-all"
            >
              <span className="flex items-center gap-1.5">
                <CarFront className="w-4 h-4" />
                Registrar vehículo
              </span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
          <Link
            href={`/admin/work-orders?customerId=${customerId}`}
            className="flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium text-[#041627] bg-[#eefcfd] border border-[#c4c6cd]/60 hover:border-[#041627] transition-colors"
          >
            Ver órdenes de trabajo
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href={`/admin/customers/${customerId}`}
            className="flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium text-white bg-[#041627] hover:bg-[#041627]/80 transition-colors"
          >
            Perfil completo
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      )}
    </aside>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

type TypeFilter = "all" | "particular" | "fleet";

const TYPE_TABS: { key: TypeFilter; label: string }[] = [
  { key: "all",        label: "Todos"      },
  { key: "particular", label: "Particular" },
  { key: "fleet",      label: "Flota"      },
];

export default function CustomersPage() {
  const [page,        setPage]        = useState(1);
  const [search,      setSearch]      = useState<string | undefined>(undefined);
  const [typeFilter,  setTypeFilter]  = useState<TypeFilter>("all");
  const [selectedId,  setSelectedId]  = useState<string | null>(null);

  const { data, isLoading, isError } = useCustomers({ page, pageSize: 20, search });

  const handleSearch = useDebouncedCallback((value: string) => {
    setPage(1);
    setSearch(value || undefined);
  }, 350);

  const allItems = data?.items ?? [];

  // Filtro de tipo client-side (sobre la página actual)
  const items =
    typeFilter === "fleet"      ? allItems.filter((c) => !!c.fleetId)
    : typeFilter === "particular" ? allItems.filter((c) => !c.fleetId)
    : allItems;

  function selectRow(id: string) {
    setSelectedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#041627]">Clientes</h1>
          {data && (
            <p className="text-sm text-[#44474c] mt-0.5">
              {data.totalCount.toLocaleString("es-AR")} cuentas registradas
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tabs de tipo */}
          <div className="flex bg-white border border-[#c4c6cd] p-1 rounded-lg gap-0.5">
            {TYPE_TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setTypeFilter(key); setPage(1); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  typeFilter === key
                    ? "bg-[#041627] text-white"
                    : "text-[#44474c] hover:bg-[#eefcfd]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <Link
            href="/admin/intake"
            className="flex items-center gap-1.5 px-4 py-2 bg-[#fea520] text-[#041627] text-sm font-bold rounded-lg hover:bg-[#865300] hover:text-white shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Nuevo cliente
          </Link>
        </div>
      </div>

      {/* ── Búsqueda ───────────────────────────────────────────────────────── */}
      <SearchInput
        placeholder="Buscar nombre, email o documento..."
        onChange={handleSearch}
        className="max-w-sm"
      />

      {/* ── Contenido principal ────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">

        {/* Tabla */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="divide-y divide-[#c4c6cd]/40">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <div className="w-10 h-10 rounded-full bg-[#c4c6cd]/30 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-40 bg-[#c4c6cd]/30 rounded animate-pulse" />
                      <div className="h-3 w-28 bg-[#c4c6cd]/20 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              <p className="px-6 py-8 text-sm text-red-500 text-center">Error al cargar los clientes.</p>
            ) : items.length === 0 ? (
              <p className="px-6 py-8 text-sm text-[#44474c] text-center">No hay clientes.</p>
            ) : (
              <>
                {/* Cabecera */}
                <div className="grid grid-cols-[1fr_1fr_100px_90px] gap-4 px-6 py-3 bg-[#eefcfd] border-b border-[#c4c6cd]/60">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Nombre</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Contacto</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Tipo</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Registro</p>
                </div>

                {/* Filas */}
                <div className="divide-y divide-[#c4c6cd]/40">
                  {items.map((c) => {
                    const isSelected = selectedId === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => selectRow(c.id)}
                        className={`w-full grid grid-cols-[1fr_1fr_100px_90px] gap-4 px-6 py-4 text-left transition-colors cursor-pointer border-l-4 ${
                          isSelected
                            ? "bg-[#fea520]/[0.05] border-l-[#fea520]"
                            : "hover:bg-[#eefcfd]/60 border-l-transparent"
                        }`}
                      >
                        {/* Nombre + avatar */}
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar customer={c} size="sm" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#041627] truncate">
                              {c.firstName} {c.lastName}
                            </p>
                            <p className="text-xs text-[#44474c]/60 font-mono truncate">
                              {DocumentTypeLabel[c.documentType]} {c.documentNumber}
                            </p>
                          </div>
                        </div>

                        {/* Contacto */}
                        <div className="min-w-0 flex flex-col justify-center">
                          <p className="text-sm text-[#041627] truncate">{c.email}</p>
                          {c.phone && (
                            <p className="text-xs text-[#44474c] truncate">{c.phone}</p>
                          )}
                        </div>

                        {/* Tipo */}
                        <div className="flex items-center">
                          <TypeBadge isFleet={!!c.fleetId} />
                        </div>

                        {/* Fecha de registro */}
                        <div className="flex items-center">
                          <p className="text-xs text-[#44474c]">{formatDate(c.createdAt)}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Footer con conteo */}
            {!isLoading && !isError && data && (
              <div className="px-6 py-3 bg-[#eefcfd]/60 border-t border-[#c4c6cd]/60">
                <p className="text-xs text-[#44474c]/70">
                  Mostrando {items.length} de {data.totalCount.toLocaleString("es-AR")} clientes
                </p>
              </div>
            )}
          </div>

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
        {selectedId && (
          <DetailPanel
            customerId={selectedId}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </div>
  );
}
