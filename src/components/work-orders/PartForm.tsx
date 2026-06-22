"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkOrderPartTier, WorkOrderPartTierLabel } from "@/lib/enums";
import { formatCurrency } from "@/lib/format";

export interface PartFormValues {
  productCode: string;       // se envía como undefined si está vacío
  name: string;
  unitPrice: number;         // precio de venta único (lo que ve y paga el cliente)
  quantity: number;
  tier: WorkOrderPartTier;
}

interface Props {
  initial?: Partial<PartFormValues>;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (values: PartFormValues) => void;
  onCancel?: () => void;
}

/**
 * Form reutilizable para Add/Edit de WorkOrderPart.
 * No conoce nada de hooks/mutations — solo emite los valores al submit.
 */
export function PartForm({
  initial,
  submitLabel,
  submitting,
  onSubmit,
  onCancel,
}: Props) {
  const [productCode, setProductCode] = useState(initial?.productCode ?? "");
  const [name, setName]               = useState(initial?.name ?? "");
  const [unitPrice, setUnitPrice]     = useState<string>(
    initial?.unitPrice !== undefined ? String(initial.unitPrice) : "0"
  );
  const [quantity, setQuantity]       = useState<string>(
    initial?.quantity !== undefined ? String(initial.quantity) : "1"
  );
  const [tier, setTier]               = useState<WorkOrderPartTier>(
    initial?.tier ?? WorkOrderPartTier.Generic,
  );

  const parsedPrice = parseFloat(unitPrice);
  const parsedQty   = parseInt(quantity, 10);

  const subtotal = isNaN(parsedQty) || isNaN(parsedPrice) ? 0 : parsedPrice * parsedQty;

  const canSubmit =
    name.trim().length > 0 &&
    unitPrice !== "" &&
    !isNaN(parsedPrice) &&
    parsedPrice >= 0 &&
    quantity !== "" &&
    !isNaN(parsedQty) &&
    parsedQty >= 1;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({
      productCode: productCode.trim(),
      name:        name.trim(),
      unitPrice:   parsedPrice,
      quantity:    parsedQty,
      tier,
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">
          Nombre <span className="text-red-500">*</span>
        </Label>
        <Input
          placeholder="Ej: Pastilla de freno delantera"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={200}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Código de proveedor (opcional)</Label>
        <Input
          placeholder="Ej: BSH-1234"
          value={productCode}
          onChange={(e) => setProductCode(e.target.value)}
          maxLength={100}
          className="font-mono text-sm"
        />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Si lo completás, este repuesto se enviará al depósito (GestionPGB) al aprobar el presupuesto.
          Si lo dejás vacío queda como repuesto <strong>custom</strong> y se gestiona aparte.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">
          Precio <span className="text-red-500">*</span>
        </Label>
        <Input
          type="number"
          min={0}
          step={0.01}
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value)}
        />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Precio de venta unitario (lo que paga el cliente).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">
            Cantidad <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            min={1}
            max={9999}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Categoría</Label>
          <Select
            value={String(tier)}
            onValueChange={(v) => setTier(Number(v) as WorkOrderPartTier)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(WorkOrderPartTierLabel).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {subtotal > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          Subtotal:{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {formatCurrency(subtotal)}
          </span>
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button variant="outline" size="sm" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
        )}
        <Button size="sm" onClick={handleSubmit} disabled={!canSubmit || submitting}>
          {submitting ? "Guardando..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}
