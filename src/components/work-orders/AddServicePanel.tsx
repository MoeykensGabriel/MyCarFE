"use client";

import { useRef, useState, useEffect } from "react";
import { ListChecks, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { useCatalogServices } from "@/hooks/useCatalog";
import {
  useAddWorkOrderService,
  useAddAdHocWorkOrderService,
} from "@/hooks/useWorkOrders";
import { CatalogService } from "@/types/api.types";

interface AddServicePanelProps {
  workOrderId: string;
}

type Tab = "catalog" | "adhoc";

export function AddServicePanel({ workOrderId }: AddServicePanelProps) {
  const [tab, setTab] = useState<Tab>("catalog");

  return (
    <div className="pt-4 mt-2 border-t space-y-3">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setTab("catalog")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
            tab === "catalog"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <ListChecks className="w-3.5 h-3.5" />
          Del catálogo
        </button>
        <button
          type="button"
          onClick={() => setTab("adhoc")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
            tab === "adhoc"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Puntual
        </button>
      </div>

      {tab === "catalog"
        ? <CatalogForm workOrderId={workOrderId} />
        : <AdHocForm workOrderId={workOrderId} />}
    </div>
  );
}

// ─── Form: servicio del catálogo ─────────────────────────────────────────────

function CatalogForm({ workOrderId }: { workOrderId: string }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CatalogService | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!dropdownOpen || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, [dropdownOpen]);

  const { data: catalog = [], isLoading } = useCatalogServices();
  const { mutate: addService, isPending } = useAddWorkOrderService(workOrderId);

  const filtered = search.length >= 1
    ? catalog.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    : catalog;

  function handleSelect(service: CatalogService) {
    setSelected(service);
    setSearch("");
    setDropdownOpen(false);
  }

  function handleClear() {
    setSelected(null);
    setQuantity(1);
  }

  function handleAdd() {
    if (!selected) return;
    addService(
      { workOrderId, catalogServiceId: selected.id, quantity },
      {
        onSuccess: () => {
          setSelected(null);
          setQuantity(1);
          setSearch("");
        },
      },
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Servicio</Label>
        {selected ? (
          <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm bg-gray-50">
            <div>
              <p className="font-medium text-gray-900">{selected.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(selected.defaultPrice)}
                {selected.estimatedDurationMinutes > 0 && (
                  <> · {selected.estimatedDurationMinutes} min</>
                )}
              </p>
            </div>
            <button
              onClick={handleClear}
              className="text-xs text-muted-foreground hover:text-gray-700 ml-3"
            >
              Cambiar
            </button>
          </div>
        ) : (
          <div ref={containerRef} className="relative">
            <Input
              placeholder={isLoading ? "Cargando catálogo..." : "Buscar servicio..."}
              value={search}
              disabled={isLoading}
              onChange={(e) => { setSearch(e.target.value); setDropdownOpen(true); }}
              onFocus={() => setDropdownOpen(true)}
              onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
            />
            {dropdownOpen && (
              <div style={dropdownStyle} className="rounded-md border bg-white shadow-lg max-h-52 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-muted-foreground">
                    {search.length > 0 ? "Sin resultados." : "El catálogo está vacío."}
                  </p>
                ) : (
                  filtered.map((s) => (
                    <button
                      key={s.id}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 text-left border-b last:border-0"
                      onMouseDown={() => handleSelect(s)}
                    >
                      <span className="font-medium text-gray-900">{s.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums ml-4 shrink-0">
                        {formatCurrency(s.defaultPrice)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Cantidad</Label>
          <Input
            type="number"
            min={1}
            max={999}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-24"
          />
        </div>
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={!selected || isPending}
          className="mb-0.5"
        >
          {isPending ? "Agregando..." : "Agregar"}
        </Button>
      </div>
    </div>
  );
}

// ─── Form: servicio puntual (ad-hoc) ─────────────────────────────────────────

function AdHocForm({ workOrderId }: { workOrderId: string }) {
  const [name, setName]                 = useState("");
  const [description, setDescription]   = useState("");
  const [price, setPrice]               = useState<number>(0);
  const [duration, setDuration]         = useState<number>(0);
  const [quantity, setQuantity]         = useState(1);

  const { mutate: addAdHoc, isPending } = useAddAdHocWorkOrderService(workOrderId);

  const canSubmit = name.trim().length > 0 && price >= 0 && quantity >= 1;

  function handleAdd() {
    if (!canSubmit) return;
    addAdHoc(
      {
        workOrderId,
        name:                     name.trim(),
        description:              description.trim(),
        price,
        estimatedDurationMinutes: duration,
        quantity,
      },
      {
        onSuccess: () => {
          setName("");
          setDescription("");
          setPrice(0);
          setDuration(0);
          setQuantity(1);
        },
      },
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Para trabajos puntuales que <strong>no</strong> tiene sentido sumar al catálogo permanente.
        Solo se guarda en esta orden.
      </p>

      <div className="space-y-1.5">
        <Label className="text-xs">Nombre <span className="text-red-500">*</span></Label>
        <Input
          placeholder="Ej: Soldadura del soporte del escape"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={200}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Descripción (opcional)</Label>
        <textarea
          rows={2}
          placeholder="Detalle del trabajo realizado..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
          className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Precio (ARS) <span className="text-red-500">*</span></Label>
          <Input
            type="number"
            min={0}
            step={0.01}
            value={price}
            onChange={(e) => setPrice(Math.max(0, parseFloat(e.target.value) || 0))}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Duración (min)</Label>
          <Input
            type="number"
            min={0}
            max={1440}
            value={duration}
            onChange={(e) => setDuration(Math.max(0, parseInt(e.target.value) || 0))}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Cantidad</Label>
          <Input
            type="number"
            min={1}
            max={999}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          />
        </div>
      </div>

      <Button
        size="sm"
        onClick={handleAdd}
        disabled={!canSubmit || isPending}
      >
        {isPending ? "Agregando..." : "Agregar servicio puntual"}
      </Button>
    </div>
  );
}
