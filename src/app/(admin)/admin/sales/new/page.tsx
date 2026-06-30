"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, User, Building2, Plus, AlertCircle, type LucideIcon } from "lucide-react";

import { BackButton } from "@/components/shared/BackButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearchCustomers } from "@/hooks/useCustomers";
import { useSearchFleets } from "@/hooks/useFleets";
import { useCreateSale } from "@/hooks/useSales";
import { Customer, Fleet } from "@/types/api.types";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type BuyerType = "customer" | "fleet";
interface ItemRow {
  productCode: string;
  name: string;
  unitPrice: string;
  quantity: string;
}

const newRow = (): ItemRow => ({ productCode: "", name: "", unitPrice: "", quantity: "1" });

export default function NewSalePage() {
  const router = useRouter();
  const { mutate: createSale, isPending } = useCreateSale();

  const [buyerType, setBuyerType] = useState<BuyerType>("customer");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [fleet, setFleet] = useState<Fleet | null>(null);
  const [rows, setRows] = useState<ItemRow[]>([newRow()]);

  const total = rows.reduce((acc, r) => {
    const p = parseFloat(r.unitPrice);
    const q = parseInt(r.quantity, 10);
    return acc + (isNaN(p) || isNaN(q) ? 0 : p * q);
  }, 0);

  const buyerSelected = buyerType === "customer" ? !!customer : !!fleet;
  const validRows = rows.filter((r) => {
    const p = parseFloat(r.unitPrice);
    const q = parseInt(r.quantity, 10);
    return r.name.trim().length > 0 && !isNaN(p) && p >= 0 && !isNaN(q) && q >= 1;
  });
  const canSubmit = buyerSelected && validRows.length > 0 && !isPending;

  function updateRow(i: number, patch: Partial<ItemRow>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function changeBuyerType(t: BuyerType) {
    setBuyerType(t);
    setCustomer(null);
    setFleet(null);
  }

  function submit() {
    if (!canSubmit) return;
    createSale(
      {
        customerId: buyerType === "customer" ? customer!.id : undefined,
        fleetId:    buyerType === "fleet"    ? fleet!.id    : undefined,
        items: validRows.map((r) => ({
          productCode: r.productCode.trim() || undefined,
          name:        r.name.trim(),
          unitPrice:   parseFloat(r.unitPrice),
          quantity:    parseInt(r.quantity, 10),
        })),
      },
      { onSuccess: () => router.push("/admin/sales") },
    );
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <BackButton href="/admin/sales" label="Ventas" />
      <h1 className="text-xl md:text-2xl font-black text-[#041627]">Nueva venta</h1>

      {/* ── A quién ──────────────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm p-4 space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#44474c]/70">A quién</p>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
          <TypeTab active={buyerType === "customer"} onClick={() => changeBuyerType("customer")} Icon={User} label="Cliente" />
          <TypeTab active={buyerType === "fleet"} onClick={() => changeBuyerType("fleet")} Icon={Building2} label="Flota" />
        </div>
        {buyerType === "customer" ? (
          <CustomerPicker selected={customer} onSelect={setCustomer} />
        ) : (
          <FleetPicker selected={fleet} onSelect={setFleet} />
        )}
      </section>

      {/* ── Repuestos ────────────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#44474c]/70">Repuestos</p>
          <button
            type="button"
            onClick={() => setRows((prev) => [...prev, newRow()])}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#eefcfd] border border-[#c4c6cd] text-xs font-bold text-[#041627] hover:border-[#fea520] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar
          </button>
        </div>

        <div className="space-y-2">
          {rows.map((row, i) => {
            const isValid = (() => {
              const p = parseFloat(row.unitPrice);
              const q = parseInt(row.quantity, 10);
              return row.name.trim().length > 0 && !isNaN(p) && p >= 0 && !isNaN(q) && q >= 1;
            })();
            const isDirty = row.name.trim().length > 0 || row.unitPrice.trim().length > 0 || row.quantity !== "1";
            return (
              <ItemRowEditor
                key={i}
                row={row}
                onChange={(patch) => updateRow(i, patch)}
                onRemove={() => setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)))}
                canRemove={rows.length > 1}
                invalid={isDirty && !isValid}
              />
            );
          })}
        </div>

        <div className="flex justify-end items-center gap-2.5 pt-3 border-t border-[#c4c6cd]/40">
          <span className="text-sm text-[#44474c]/70">Total</span>
          <span className="text-2xl font-black text-[#041627] tabular-nums tracking-tight">
            {formatCurrency(total)}
          </span>
        </div>
      </section>

      <div className="flex flex-col items-end gap-1.5">
        {!canSubmit && !isPending && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#fea520]/8 border border-[#fea520]/30">
            <AlertCircle className="w-3.5 h-3.5 text-[#865300] shrink-0" />
            <p className="text-xs text-[#041627] font-medium">
              {!buyerSelected
                ? "Elegí un cliente o flota para continuar."
                : "Cargá al menos un repuesto con descripción y precio."}
            </p>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => router.push("/admin/sales")} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {isPending ? "Registrando..." : "Registrar venta"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab tipo de comprador ────────────────────────────────────────────────────

function TypeTab({ active, onClick, Icon, label }: { active: boolean; onClick: () => void; Icon: LucideIcon; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
        active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

// ─── Picker de cliente ────────────────────────────────────────────────────────

function CustomerPicker({ selected, onSelect }: { selected: Customer | null; onSelect: (c: Customer | null) => void }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { data, isFetching } = useSearchCustomers(search);
  const results = data?.items ?? [];

  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-md border px-3 py-2 bg-gray-50">
        <div>
          <p className="text-sm font-medium text-[#041627]">{selected.firstName} {selected.lastName}</p>
          <p className="text-xs text-muted-foreground">{selected.email}</p>
        </div>
        <button type="button" onClick={() => onSelect(null)} className="text-xs text-muted-foreground hover:text-gray-700 ml-3">
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        placeholder="Buscar cliente (nombre, email, documento)..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && search.trim().length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg max-h-52 overflow-y-auto">
          {isFetching ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Buscando...</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Sin resultados.</p>
          ) : (
            results.map((c) => (
              <button
                key={c.id}
                type="button"
                onMouseDown={() => { onSelect(c); setSearch(""); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b last:border-0"
              >
                <span className="font-medium text-[#041627]">{c.firstName} {c.lastName}</span>
                <span className="text-xs text-muted-foreground ml-2">{c.email}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Picker de flota ──────────────────────────────────────────────────────────

function FleetPicker({ selected, onSelect }: { selected: Fleet | null; onSelect: (f: Fleet | null) => void }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { data, isFetching } = useSearchFleets(search);
  const results = data?.items ?? [];

  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-md border px-3 py-2 bg-gray-50">
        <p className="text-sm font-medium text-[#041627]">{selected.companyName}</p>
        <button type="button" onClick={() => onSelect(null)} className="text-xs text-muted-foreground hover:text-gray-700 ml-3">
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        placeholder="Buscar flota (razón social)..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && search.trim().length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg max-h-52 overflow-y-auto">
          {isFetching ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Buscando...</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Sin resultados.</p>
          ) : (
            results.map((f) => (
              <button
                key={f.id}
                type="button"
                onMouseDown={() => { onSelect(f); setSearch(""); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b last:border-0"
              >
                <span className="font-medium text-[#041627]">{f.companyName}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Fila de repuesto ─────────────────────────────────────────────────────────

function ItemRowEditor({
  row,
  onChange,
  onRemove,
  canRemove,
  invalid,
}: {
  row: ItemRow;
  onChange: (patch: Partial<ItemRow>) => void;
  onRemove: () => void;
  canRemove: boolean;
  invalid: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap sm:flex-nowrap items-start gap-2 rounded-lg px-2 py-2 transition-colors",
        invalid && "bg-red-50/60 ring-1 ring-red-200/60"
      )}
    >
      <Input
        placeholder="Código"
        value={row.productCode}
        onChange={(e) => onChange({ productCode: e.target.value })}
        maxLength={100}
        className="w-full sm:w-32 font-mono text-sm"
      />
      <Input
        placeholder="Descripción"
        value={row.name}
        onChange={(e) => onChange({ name: e.target.value })}
        maxLength={200}
        className={cn("w-full sm:flex-1", invalid && !row.name.trim() && "border-red-300")}
      />
      <Input
        type="number"
        min={0}
        step={0.01}
        placeholder="Precio"
        value={row.unitPrice}
        onChange={(e) => onChange({ unitPrice: e.target.value })}
        className={cn("w-full sm:w-28", invalid && (isNaN(parseFloat(row.unitPrice)) || parseFloat(row.unitPrice) < 0) && "border-red-300")}
      />
      <Input
        type="number"
        min={1}
        max={9999}
        placeholder="Cant."
        value={row.quantity}
        onChange={(e) => onChange({ quantity: e.target.value })}
        className={cn("w-full sm:w-20", invalid && (isNaN(parseInt(row.quantity, 10)) || parseInt(row.quantity, 10) < 1) && "border-red-300")}
      />
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        title="Quitar"
        className="p-2 text-muted-foreground hover:text-red-500 disabled:opacity-30 transition-colors shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
