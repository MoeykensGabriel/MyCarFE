"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { toast } from "sonner";
import {
  Building2, ChevronRight, Mail, Phone,
  X, Car, ClipboardPlus, ExternalLink, Tag,
} from "lucide-react";

import { Pagination } from "@/components/shared/Pagination";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { OpenOrderModal } from "@/components/shared/OpenOrderModal";
import { useFleet, useFleets } from "@/hooks/useFleets";
import { workOrdersService } from "@/services/work-orders.service";

// ─── Panel de detalle de flota ────────────────────────────────────────────────

interface PendingOrder {
  vehicleId:    string;
  vehicleLabel: string;
}

function DetailPanel({
  fleetId,
  onClose,
  onOpenOrder,
}: {
  fleetId:     string;
  onClose:     () => void;
  onOpenOrder: (p: PendingOrder) => void;
}) {
  const { data: fleet, isLoading } = useFleet(fleetId);

  return (
    <aside className="w-full lg:w-80 shrink-0 bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden flex flex-col self-start lg:sticky lg:top-0">

      {/* Header */}
      <div className="border-b border-[#c4c6cd]/60 px-5 py-4">
        <div className="flex items-start justify-between mb-4">
          <div className="w-16 h-16 rounded-full bg-[#041627] text-white flex items-center justify-center shrink-0">
            <Building2 className="w-7 h-7" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#44474c] hover:bg-[#eefcfd] hover:text-[#041627] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <div className="h-5 w-44 bg-[#c4c6cd]/30 rounded animate-pulse" />
            <div className="h-3 w-28 bg-[#c4c6cd]/20 rounded animate-pulse" />
          </div>
        ) : fleet ? (
          <>
            <h3 className="text-base font-bold text-[#041627]">{fleet.companyName}</h3>
            {fleet.taxId && (
              <p className="text-xs text-[#44474c] font-mono mt-0.5">CUIT {fleet.taxId}</p>
            )}

            {/* Mini stats */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {fleet.email && (
                <div className="col-span-2 rounded-lg bg-[#eefcfd] border border-[#c4c6cd]/60 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70 mb-1">Email</p>
                  <span className="inline-flex items-center gap-1 text-xs text-[#041627] truncate">
                    <Mail className="w-3 h-3 shrink-0" />
                    {fleet.email}
                  </span>
                </div>
              )}
              {fleet.phone && (
                <div className="rounded-lg bg-[#eefcfd] border border-[#c4c6cd]/60 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70 mb-1">Teléfono</p>
                  <span className="inline-flex items-center gap-1 text-xs text-[#041627]">
                    <Phone className="w-3 h-3 shrink-0" />
                    {fleet.phone}
                  </span>
                </div>
              )}
              <div className="rounded-lg bg-[#eefcfd] border border-[#c4c6cd]/60 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70 mb-1">Vehículos</p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#041627]">
                  <Car className="w-3 h-3" />
                  {fleet.vehicles?.length ?? 0}
                </span>
              </div>
            </div>
          </>
        ) : null}
      </div>


      {/* Footer de acciones */}
      {fleet && (
        <div className="px-5 py-4 space-y-2">
          <Link
            href={`/admin/work-orders?fleetId=${fleetId}`}
            className="flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium text-[#041627] bg-[#eefcfd] border border-[#c4c6cd]/60 hover:border-[#041627] transition-colors"
          >
            Ver órdenes de esta flota
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href={`/admin/fleets/${fleetId}`}
            className="flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium text-white bg-[#041627] hover:bg-[#041627]/80 transition-colors"
          >
            Ficha completa
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      )}
    </aside>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function FleetsPage() {
  const router = useRouter();

  const [page,         setPage]         = useState(1);
  const [search,       setSearch]       = useState<string | undefined>(undefined);
  const [selectedId,   setSelectedId]   = useState<string | null>(null);
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);

  const { data, isLoading, isError } = useFleets({ page, pageSize: 20, search });

  const handleSearch = useDebouncedCallback((value: string) => {
    setPage(1);
    setSearch(value || undefined);
  }, 350);

  async function handleConfirmOrder({
    mileageAtEntry,
    customerNote,
    contactPersonName,
    contactPersonPhone,
  }: {
    mileageAtEntry: number;
    customerNote: string;
    contactPersonName?: string;
    contactPersonPhone?: string;
  }) {
    if (!pendingOrder) return;
    try {
      const order = await workOrdersService.create({
        vehicleId:  pendingOrder.vehicleId,
        mileageAtEntry,
        customerNote: customerNote || undefined,
        contactPersonName: contactPersonName || undefined,
        contactPersonPhone: contactPersonPhone || undefined,
      });
      toast.success("Orden de trabajo abierta");
      router.push(`/admin/work-orders/${order.id}`);
    } catch {
      toast.error("No se pudo abrir la orden de trabajo");
      throw new Error();
    }
  }

  const items = data?.items ?? [];

  return (
    <div className="space-y-5">

      {/* Modal de apertura de orden */}
      {pendingOrder && (
        <OpenOrderModal
          vehicleLabel={pendingOrder.vehicleLabel}
          initialMileage={0}
          onConfirm={handleConfirmOrder}
          onClose={() => setPendingOrder(null)}
        />
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <PageHeader
        title="Flotas"
        subtitle={data ? `${data.totalCount.toLocaleString("es-AR")} empresas registradas` : "Cargando empresas..."}
        Icon={Building2}
      />

      {/* ── Búsqueda ────────────────────────────────────────────────────────── */}
      <SearchInput
        placeholder="Buscar empresa o CUIT..."
        onChange={handleSearch}
        className="max-w-sm"
      />

      {/* ── Contenido principal ─────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">

        {/* Tabla */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="divide-y divide-[#c4c6cd]/40">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <div className="w-10 h-10 rounded-full bg-[#c4c6cd]/30 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-48 bg-[#c4c6cd]/30 rounded animate-pulse" />
                      <div className="h-3 w-28 bg-[#c4c6cd]/20 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              <p className="px-6 py-8 text-sm text-red-500 text-center">Error al cargar las flotas.</p>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <Building2 className="w-10 h-10 text-[#c4c6cd]" />
                <p className="text-sm font-semibold text-[#041627]">Sin flotas</p>
                <p className="text-xs text-[#44474c]">
                  {search ? "Probá con otro término de búsqueda." : "No hay flotas registradas."}
                </p>
              </div>
            ) : (
              <>
                {/* Cabecera */}
                <div className="grid grid-cols-[1fr_120px_1fr_1fr_56px] gap-4 px-6 py-3 bg-[#eefcfd] border-b border-[#c4c6cd]/60">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Empresa</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">CUIT</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Contacto</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Dirección</p>
                  <p />
                </div>

                {/* Filas */}
                <div className="divide-y divide-[#c4c6cd]/40">
                  {items.map((f) => {
                    const isSelected = selectedId === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setSelectedId((prev) => prev === f.id ? null : f.id)}
                        className={`w-full grid grid-cols-[1fr_120px_1fr_1fr_56px] gap-4 items-center px-6 py-4 text-left border-l-4 transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-[#fea520]/[0.05] border-l-[#fea520]"
                            : "hover:bg-[#eefcfd]/60 border-l-transparent"
                        }`}
                      >
                        {/* Empresa */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-[#041627] text-white flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <p className="text-sm font-semibold text-[#041627] truncate">{f.companyName}</p>
                        </div>

                        {/* CUIT */}
                        <p className="text-sm font-mono text-[#44474c] shrink-0">{f.taxId ?? "—"}</p>

                        {/* Contacto */}
                        <div className="min-w-0 flex flex-col gap-0.5">
                          {f.email && (
                            <span className="inline-flex items-center gap-1 text-xs text-[#44474c] truncate">
                              <Mail className="w-3 h-3 text-[#44474c]/50 shrink-0" />
                              {f.email}
                            </span>
                          )}
                          {f.phone && (
                            <span className="inline-flex items-center gap-1 text-xs text-[#44474c]">
                              <Phone className="w-3 h-3 text-[#44474c]/50 shrink-0" />
                              {f.phone}
                            </span>
                          )}
                          {!f.email && !f.phone && <span className="text-xs text-[#44474c]/50">—</span>}
                        </div>

                        {/* Dirección */}
                        <p className="text-sm text-[#44474c] truncate">{f.address ?? "—"}</p>

                        {/* Chevron */}
                        <ChevronRight className={`w-4 h-4 shrink-0 transition-colors ${isSelected ? "text-[#fea520]" : "text-[#c4c6cd]"}`} />
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Footer */}
            {!isLoading && !isError && data && (
              <div className="px-6 py-3 bg-[#eefcfd]/60 border-t border-[#c4c6cd]/60">
                <p className="text-xs text-[#44474c]/70">
                  Mostrando {items.length} de {data.totalCount.toLocaleString("es-AR")} flotas
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
            fleetId={selectedId}
            onClose={() => setSelectedId(null)}
            onOpenOrder={setPendingOrder}
          />
        )}
      </div>
    </div>
  );
}
