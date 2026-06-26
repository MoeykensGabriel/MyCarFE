"use client";

import Link from "next/link";
import { useState } from "react";
import { Receipt, Plus, User, Building2, Copy } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { Pagination } from "@/components/shared/Pagination";
import { CopyRowButton } from "@/components/shared/CopyRowButton";
import { useSales } from "@/hooks/useSales";
import { copyText } from "@/lib/clipboard";
import { saleToRows, saleItemToRow } from "@/lib/sale-copy";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Sale } from "@/types/sales.types";

export default function SalesPage() {
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data, isLoading, isError } = useSales({
    page,
    pageSize: 20,
    from: from ? `${from}T00:00:00` : undefined,
    to:   to   ? `${to}T23:59:59`   : undefined,
  });
  const items = data?.items ?? [];

  function changeFrom(v: string) { setFrom(v); setPage(1); }
  function changeTo(v: string)   { setTo(v); setPage(1); }
  function clearDates()          { setFrom(""); setTo(""); setPage(1); }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <PageHeader
          title="Ventas"
          subtitle={data ? `${data.totalCount.toLocaleString("es-AR")} ventas registradas` : "Cargando ventas..."}
          Icon={Receipt}
        />
        <Link
          href="/admin/sales/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#041627] text-white hover:text-[#fea520] text-sm font-bold transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nueva venta
        </Link>
      </div>

      {/* Filtro por fecha — para liquidar comisiones por período */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#44474c]/70">Desde</label>
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => changeFrom(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-[#c4c6cd] bg-white text-[#041627] focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627]"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#44474c]/70">Hasta</label>
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => changeTo(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-[#c4c6cd] bg-white text-[#041627] focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627]"
          />
        </div>
        {(from || to) && (
          <button
            type="button"
            onClick={clearDates}
            className="px-3 py-2 text-sm font-semibold text-[#44474c] hover:text-[#041627]"
          >
            Limpiar
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-[#c4c6cd]/20 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-white rounded-xl border border-[#c4c6cd] px-6 py-8 text-center">
          <p className="text-sm text-red-500">Error al cargar las ventas.</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#c4c6cd] flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Receipt className="w-10 h-10 text-[#c4c6cd]" />
          {from || to ? (
            <p className="text-sm font-semibold text-[#041627]">No hay ventas en ese rango de fechas.</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-[#041627]">Sin ventas todavía</p>
              <Link href="/admin/sales/new" className="text-xs font-bold text-[#041627] hover:text-[#fea520]">
                + Registrar la primera
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((s) => (
            <SaleCard key={s.id} sale={s} />
          ))}
        </div>
      )}

      {data && (
        <Pagination
          currentPage={data.page}
          totalPages={data.totalPages}
          hasNextPage={data.hasNextPage}
          hasPreviousPage={data.hasPreviousPage}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

function SaleCard({ sale }: { sale: Sale }) {
  async function handleCopyAll() {
    const rows = saleToRows(sale);
    if (!rows) {
      toast.error("No hay ítems para copiar");
      return;
    }
    const ok = await copyText(rows);
    if (ok) toast.success("Ítems copiados — pegalos en tu planilla");
    else toast.error("No se pudo copiar");
  }

  return (
    <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden">
      {/* ── Fila 1: comprador + total destacado ──────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-[#c4c6cd]/40">
        {/* Comprador */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-[#fea520]/10 flex items-center justify-center shrink-0">
            {sale.fleetId ? (
              <Building2 className="w-5 h-5 text-[#fea520]" />
            ) : (
              <User className="w-5 h-5 text-[#fea520]" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/60">
              {sale.fleetId ? "Empresa / Flota" : "Cliente particular"}
            </p>
            <p className="text-sm font-bold text-[#041627] truncate leading-tight mt-0.5">
              {sale.buyerName}
            </p>
          </div>
        </div>

        {/* Total */}
        <div className="text-right shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/60">Total</p>
          <p className="text-base sm:text-lg font-black text-[#041627] tabular-nums leading-tight mt-0.5">
            {formatCurrency(sale.totalAmount)}
          </p>
        </div>
      </div>

      {/* ── Fila 2: fecha + vendedor + copiar todo ───────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-2 bg-[#eefcfd]/60 border-b border-[#c4c6cd]/40">
        <div className="flex items-center gap-3 min-w-0 text-[11px] text-[#44474c] flex-wrap">
          {/* Fecha con icono */}
          <span className="inline-flex items-center gap-1 font-medium">
            <svg className="w-3 h-3 text-[#44474c]/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M3 10h18M8 2v4M16 2v4" />
            </svg>
            {formatDateTime(sale.createdAt)}
          </span>
          {/* Separador */}
          <span className="text-[#c4c6cd] hidden sm:inline">·</span>
          {/* Vendedor */}
          <span className="inline-flex items-center gap-1 min-w-0 truncate">
            <span className="text-[#44474c]/60">Vendió</span>
            <span className="font-semibold text-[#041627] truncate">{sale.sellerName}</span>
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopyAll}
          title="Copiar todos los ítems para la planilla de comisiones"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#c4c6cd] text-xs font-bold text-[#041627] hover:border-[#fea520] hover:text-[#865300] transition-colors shrink-0"
        >
          <Copy className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Copiar todo</span>
        </button>
      </div>

      {/* ── Ítems (repuestos vendidos) ───────────────────────────────────────── */}
      <div className="divide-y divide-[#c4c6cd]/30">
        {sale.items.map((it) => (
          <div
            key={it.id}
            className="flex items-start justify-between gap-3 px-4 sm:px-5 py-3"
          >
            {/* Nombre del producto + código */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#041627] truncate">{it.name}</p>
              {it.productCode && (
                <p className="text-[11px] text-[#44474c]/60 font-mono mt-0.5 truncate">
                  Cod. {it.productCode}
                </p>
              )}
              {it.quantity > 1 && (
                <p className="text-[11px] text-[#44474c]/80 mt-1 tabular-nums">
                  {it.quantity} × {formatCurrency(it.unitPrice)}
                </p>
              )}
            </div>

            {/* Subtotal + copiar ítem */}
            <div className="text-right shrink-0 flex items-center gap-2">
              <span className="text-sm font-bold text-[#041627] tabular-nums">
                {formatCurrency(it.subtotal)}
              </span>
              <CopyRowButton text={saleItemToRow(sale, it)} label="ítem" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
