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
  Users,
} from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { DetailSheet } from "@/components/shared/DetailSheet";
import { ResetPasswordButton } from "@/components/shared/ResetPasswordButton";

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
  const sizeClass = 
    size === "lg" ? "w-14 h-14 text-lg" 
    : size === "sm" ? "w-9 h-9 text-xs" 
    : "w-11 h-11 text-sm";
  return (
    <div
      className={`${sizeClass} rounded-xl flex items-center justify-center font-black shrink-0 transition-all duration-300 shadow-inner ${
        isFleet
          ? "bg-[#041627] text-[#fea520] border border-[#041627] hover:scale-105"
          : "bg-[#eefcfd] border-2 border-[#041627]/10 text-[#041627] hover:scale-105"
      }`}
    >
      {initials(customer)}
    </div>
  );
}

// ─── Type badge ───────────────────────────────────────────────────────────────

function TypeBadge({ isFleet }: { isFleet: boolean }) {
  return isFleet ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#041627] text-white shadow-sm">
      <span className="w-1.5 h-1.5 rounded-full bg-[#fea520] animate-pulse" />
      Flota
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 border border-[#c4c6cd] text-[#041627] shadow-sm">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
    <DetailSheet onClose={onClose}>
      {/* Header del panel */}
      <div className="border-b border-[#c4c6cd]/60 px-5 py-5 bg-gradient-to-b from-[#eefcfd]/20 to-transparent">
        <div className="flex items-start justify-between mb-4">
          {isLoading ? (
            <div className="w-14 h-14 rounded-xl bg-[#c4c6cd]/30 animate-pulse" />
          ) : customer ? (
            <div className="relative">
              <Avatar customer={customer} size="lg" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white bg-[#fea520]" />
            </div>
          ) : null}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#44474c] hover:bg-[#eefcfd] hover:text-[#041627] transition-all duration-200"
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
            <h3 className="text-base font-extrabold text-[#041627] tracking-tight">
              {customer.firstName} {customer.lastName}
            </h3>
            <p className="text-xs text-[#44474c]/80 font-medium mt-1">
              Cliente desde {memberSince(customer.createdAt)}
            </p>

            {/* Mini stats */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="rounded-xl bg-[#eefcfd]/40 border border-[#c4c6cd]/60 px-3 py-2.5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#44474c]/70 mb-1">
                  Documento
                </p>
                <p className="text-xs font-extrabold text-[#041627] leading-none">
                  {DocumentTypeLabel[customer.documentType]}
                </p>
                <p className="text-[10px] font-mono font-bold text-[#44474c] mt-1">{customer.documentNumber}</p>
              </div>
              <div className="rounded-xl bg-[#eefcfd]/40 border border-[#c4c6cd]/60 px-3 py-2.5 flex flex-col justify-between">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#44474c]/70 mb-1">
                  Tipo
                </p>
                <div className="self-start">
                  <TypeBadge isFleet={!!customer.fleetId} />
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Vehículos */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">
            Vehículos registrados
          </p>
          {vehicles.length > 0 && (
            <span className="text-[10px] font-extrabold text-[#041627] bg-[#eefcfd] border border-[#c4c6cd]/60 rounded-full px-2.5 py-0.5">
              {vehicles.length}
            </span>
          )}
        </div>

        {vehiclesLoading ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-[#c4c6cd]/20 animate-pulse" />
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <p className="text-xs text-[#44474c]/70 italic py-2 text-center bg-slate-50 rounded-lg">
            Sin vehículos registrados.
          </p>
        ) : (
          <div className="space-y-2.5">
            {vehicles.map((v) => (
              <Link
                key={v.id}
                href={`/admin/vehicles/${v.id}`}
                className="block rounded-xl border border-[#c4c6cd] bg-slate-50/50 p-3 hover:border-[#fea520] hover:bg-[#fea520]/[0.03] hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-[#041627] tracking-tight group-hover:text-[#fea520] transition-colors">
                      {v.brand} {v.model}
                    </p>
                    <p className="text-xs text-[#44474c]/80 font-semibold">{v.year}{v.color ? ` · ${v.color}` : ""}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#c4c6cd] group-hover:text-[#fea520] group-hover:translate-x-0.5 shrink-0 mt-0.5 transition-all" />
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#44474c] bg-white border border-slate-200/60 rounded-lg px-2 py-1.5 shadow-inner mt-2.5">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#fea520]" />
                    <span className="font-mono font-bold text-slate-800">{v.licensePlate}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-blue-500" />
                    <span className="font-bold text-slate-800">{v.currentMileage.toLocaleString("es-AR")} km</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer de acciones */}
      {customer && (
        <div className="border-t border-[#c4c6cd]/60 px-5 py-4 space-y-2 bg-slate-50/50">
          {/* Si no tiene vehículos, CTA principal para registrar uno */}
          {vehicles.length === 0 && !vehiclesLoading && (
            <Link
              href={`/admin/customers/${customerId}/add-vehicle`}
              className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-xs font-bold text-[#041627] bg-[#fea520] hover:bg-[#865300] hover:text-white transition-all shadow-sm group"
            >
              <span className="flex items-center gap-2">
                <CarFront className="w-4 h-4" />
                Registrar vehículo
              </span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
          <Link
            href={`/admin/work-orders?customerId=${customerId}`}
            className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-xs font-bold text-[#041627] bg-white border border-[#c4c6cd] hover:border-[#041627] hover:bg-[#eefcfd]/20 transition-all shadow-sm"
          >
            Ver órdenes de trabajo
            <ChevronRight className="w-4 h-4 text-[#c4c6cd]" />
          </Link>
          <Link
            href={`/admin/customers/${customerId}`}
            className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#041627] hover:bg-[#041627]/80 transition-all shadow-sm"
          >
            Perfil completo
            <ExternalLink className="w-4 h-4" />
          </Link>

          {/* Acceso — aparte de los links de navegación: es la única acción del
              panel que muta datos y muestra una credencial. Acá para que el
              mostrador pueda destrabar a un cliente sin entrar a su ficha. */}
          <div className="pt-2 mt-1 border-t border-[#c4c6cd]/60 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">
              Acceso
            </p>
            <ResetPasswordButton
              applicationUserId={customer.applicationUserId}
              userDisplayName={`${customer.firstName} ${customer.lastName}`}
              variant="compact"
              userEmail={customer.email}
              phone={customer.phone}
              firstName={customer.firstName}
            />
          </div>
        </div>
      )}
    </DetailSheet>
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
      <PageHeader
        title="Clientes"
        subtitle={data ? `${data.totalCount.toLocaleString("es-AR")} cuentas registradas` : "Cargando clientes..."}
        Icon={Users}
        actions={
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
              className="flex items-center gap-1.5 px-4 py-2 bg-[#fea520] text-[#041627] text-sm font-bold rounded-lg hover:bg-[#865300] hover:text-white shadow-sm transition-all shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              Nuevo cliente
            </Link>
          </div>
        }
      />

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
          {/* ── Estados ─────────────────────────────────────────────────────── */}
          {isLoading ? (
            <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden divide-y divide-[#c4c6cd]/40">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 sm:px-6 py-4">
                  <div className="w-11 h-11 rounded-xl bg-[#c4c6cd]/30 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 max-w-[60%] bg-[#c4c6cd]/30 rounded animate-pulse" />
                    <div className="h-3 w-28 bg-[#c4c6cd]/20 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm px-6 py-8 text-center">
              <p className="text-sm text-red-500 font-medium">Error al cargar los clientes.</p>
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm px-6 py-8 text-center">
              <p className="text-sm text-[#44474c] font-semibold">No hay clientes.</p>
            </div>
          ) : (
            <>
              {/* ── Tabla (desktop) ───────────────────────────────────────────── */}
              <div className="hidden lg:block bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden">
                {/* Cabecera */}
                <div className="grid grid-cols-[1fr_1fr_100px_90px] gap-4 px-6 py-3.5 bg-[#eefcfd] border-b border-[#c4c6cd]/60">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627]/70">Nombre / Documento</p>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627]/70">Contacto</p>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627]/70">Tipo de Cliente</p>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627]/70">Alta</p>
                </div>

                {/* Filas */}
                <div className="divide-y divide-[#c4c6cd]/40">
                  {items.map((c) => {
                    const isSelected = selectedId === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => selectRow(c.id)}
                        className={`w-full grid grid-cols-[1fr_1fr_100px_90px] gap-4 px-6 py-4 text-left transition-all duration-300 cursor-pointer border-l-4 ${
                          isSelected
                            ? "bg-[#fea520]/[0.06] border-l-[#fea520] shadow-inner scale-[0.995]"
                            : "hover:bg-[#eefcfd]/40 hover:translate-x-1 border-l-transparent"
                        }`}
                      >
                        {/* Nombre + avatar */}
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar customer={c} size="sm" />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#041627] truncate tracking-tight">
                              {c.firstName} {c.lastName}
                            </p>
                            <p className="text-[11px] text-[#44474c]/75 font-mono font-semibold truncate mt-0.5">
                              {DocumentTypeLabel[c.documentType]} {c.documentNumber}
                            </p>
                          </div>
                        </div>

                        {/* Contacto */}
                        <div className="min-w-0 flex flex-col justify-center">
                          <p className="text-sm font-semibold text-[#041627] truncate">{c.email}</p>
                          {c.phone && (
                            <p className="text-xs text-[#44474c]/85 font-medium truncate mt-0.5">{c.phone}</p>
                          )}
                        </div>

                        {/* Tipo */}
                        <div className="flex items-center">
                          <TypeBadge isFleet={!!c.fleetId} />
                        </div>

                        {/* Fecha de registro */}
                        <div className="flex items-center">
                          <p className="text-xs font-semibold text-[#44474c]">{formatDate(c.createdAt)}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Footer con conteo */}
                {data && (
                  <div className="px-6 py-3 bg-[#eefcfd]/60 border-t border-[#c4c6cd]/60">
                    <p className="text-xs text-[#44474c]/70">
                      Mostrando {items.length} de {data.totalCount.toLocaleString("es-AR")} clientes
                    </p>
                  </div>
                )}
              </div>

              {/* ── Cards (mobile / tablet) ───────────────────────────────────── */}
              <div className="lg:hidden space-y-3">
                {items.map((c) => (
                  <CustomerMobileCard
                    key={c.id}
                    customer={c}
                    selected={selectedId === c.id}
                    onSelect={selectRow}
                  />
                ))}
                {data && (
                  <p className="text-xs text-[#44474c]/70 px-1 pt-1">
                    Mostrando {items.length} de {data.totalCount.toLocaleString("es-AR")} clientes
                  </p>
                )}
              </div>
            </>
          )}

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

// ─── Card de cliente para mobile / tablet ─────────────────────────────────────
// La tabla de 4 columnas no entra en pantallas chicas. Abajo de lg mostramos cada
// cliente como una card que, igual que la fila, SELECCIONA (abre el panel de
// detalle, que en mobile aparece debajo de la lista).

function CustomerMobileCard({
  customer,
  selected,
  onSelect,
}: {
  customer: Customer;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(customer.id)}
      className={`w-full text-left bg-white rounded-xl border shadow-sm p-4 transition-all ${
        selected
          ? "border-[#fea520] ring-1 ring-[#fea520]/40"
          : "border-[#c4c6cd] hover:border-[#fea520]/40 active:scale-[0.99]"
      }`}
    >
      {/* Nombre + documento + tipo */}
      <div className="flex items-start gap-3">
        <Avatar customer={customer} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[#041627] truncate tracking-tight">
            {customer.firstName} {customer.lastName}
          </p>
          <p className="text-[11px] text-[#44474c]/75 font-mono font-semibold truncate mt-0.5">
            {DocumentTypeLabel[customer.documentType]} {customer.documentNumber}
          </p>
        </div>
        <div className="shrink-0">
          <TypeBadge isFleet={!!customer.fleetId} />
        </div>
      </div>

      {/* Contacto + alta */}
      <div className="flex items-end justify-between gap-3 mt-3 pt-3 border-t border-[#c4c6cd]/40">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#041627] truncate">{customer.email}</p>
          {customer.phone && (
            <p className="text-xs text-[#44474c]/85 font-medium truncate mt-0.5">{customer.phone}</p>
          )}
        </div>
        <span className="text-xs font-semibold text-[#44474c] whitespace-nowrap shrink-0">
          {formatDate(customer.createdAt)}
        </span>
      </div>
    </button>
  );
}
