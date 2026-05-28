"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddAdHocWorkOrderService } from "@/hooks/useWorkOrders";

export interface AdHocServiceFormInitial {
  name?: string;
  description?: string;
  price?: number;
  estimatedDurationMinutes?: number;
  quantity?: number;
}

interface Props {
  workOrderId: string;
  initial?: AdHocServiceFormInitial;
  /** Si se pasa, se llama después de un add exitoso (además de limpiar el form). */
  onSuccess?: () => void;
  /** Si se pasa, se renderiza un botón Cancelar al lado del submit. */
  onCancel?: () => void;
  submitLabel?: string;
}

/**
 * Form de servicio puntual (ad-hoc) reusable.
 * Manejado por hook propio porque la mayoría de llamadores quiere limpieza post-add automática.
 */
export function AdHocServiceForm({
  workOrderId,
  initial,
  onSuccess,
  onCancel,
  submitLabel = "Agregar servicio puntual",
}: Props) {
  const [name, setName]               = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice]             = useState<string>(
    initial?.price !== undefined ? String(initial.price) : "0"
  );
  const [duration, setDuration]       = useState<string>(
    initial?.estimatedDurationMinutes !== undefined ? String(initial.estimatedDurationMinutes) : "0"
  );
  const [quantity, setQuantity]       = useState<string>(
    initial?.quantity !== undefined ? String(initial.quantity) : "1"
  );

  const { mutate: addAdHoc, isPending } = useAddAdHocWorkOrderService(workOrderId);

  const parsedPrice    = parseFloat(price);
  const parsedDuration = parseInt(duration, 10);
  const parsedQty      = parseInt(quantity, 10);

  const canSubmit =
    name.trim().length > 0 &&
    price !== "" &&
    !isNaN(parsedPrice) &&
    parsedPrice >= 0 &&
    quantity !== "" &&
    !isNaN(parsedQty) &&
    parsedQty >= 1;

  function handleAdd() {
    if (!canSubmit) return;
    addAdHoc(
      {
        workOrderId,
        name:                     name.trim(),
        description:              description.trim(),
        price:                    parsedPrice,
        estimatedDurationMinutes: isNaN(parsedDuration) ? 0 : parsedDuration,
        quantity:                 parsedQty,
      },
      {
        onSuccess: () => {
          setName("");
          setDescription("");
          setPrice("0");
          setDuration("0");
          setQuantity("1");
          onSuccess?.();
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
          rows={3}
          placeholder="Detalle del trabajo a realizar..."
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
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Duración (min)</Label>
          <Input
            type="number"
            min={0}
            max={1440}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Cantidad</Label>
          <Input
            type="number"
            min={1}
            max={999}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
        )}
        <Button size="sm" onClick={handleAdd} disabled={!canSubmit || isPending}>
          {isPending ? "Agregando..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}
