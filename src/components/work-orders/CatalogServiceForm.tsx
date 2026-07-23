"use client";

import { useRef, useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { useCatalogServices } from "@/hooks/useCatalog";
import { useAddWorkOrderService } from "@/hooks/useWorkOrders";
import { CatalogService } from "@/types/api.types";

interface Props {
  workOrderId: string;
  /** Se llama después de un alta exitosa (el modal la usa para cerrarse). */
  onSuccess?: () => void;
}

/** Alta de un servicio del catálogo: buscador + cantidad. */
export function CatalogServiceForm({ workOrderId, onSuccess }: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CatalogService | null>(null);
  const [quantity, setQuantity] = useState("1");
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
    setQuantity("1");
  }

  const parsedQty = parseInt(quantity, 10);
  const canAdd = selected && !isPending && !isNaN(parsedQty) && parsedQty >= 1;

  function handleAdd() {
    if (!canAdd) return;
    addService(
      { workOrderId, catalogServiceId: selected.id, quantity: parsedQty },
      {
        onSuccess: () => {
          setSelected(null);
          setQuantity("1");
          setSearch("");
          onSuccess?.();
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
            onChange={(e) => setQuantity(e.target.value)}
            className="w-24"
          />
        </div>
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={!canAdd}
          className="mb-0.5"
        >
          {isPending ? "Agregando..." : "Agregar"}
        </Button>
      </div>
    </div>
  );
}
