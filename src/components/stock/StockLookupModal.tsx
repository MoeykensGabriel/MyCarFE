"use client";

import { useState } from "react";
import { PackageSearch, CheckCircle2, XCircle, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStockAvailability } from "@/hooks/useStock";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultCode?: string;
}

/**
 * Modal para consultar la disponibilidad de un repuesto por código en el sistema
 * del taller (GestionPGB). Read-only — no carga el repuesto a la orden.
 */
export function StockLookupModal({ open, onClose, defaultCode = "" }: Props) {
  const [code, setCode] = useState(defaultCode);
  const { mutate, data: result, isPending, reset } = useStockAvailability();

  const trimmed = code.trim();
  const canSubmit = trimmed.length > 0 && !isPending;

  function handleClose() {
    reset();          // limpia el resultado para la próxima apertura
    setCode(defaultCode);
    onClose();
  }

  function handleLookup() {
    if (!canSubmit) return;
    mutate(trimmed);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageSearch className="w-5 h-5 text-[#fea520]" />
            Consultar stock
          </DialogTitle>
          <DialogDescription>
            Ingresá el código del producto para ver si el taller lo tiene disponible.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              autoFocus
              placeholder="Ej: BSH-1234"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleLookup();
                }
              }}
              maxLength={100}
              className="font-mono"
            />
            <Button onClick={handleLookup} disabled={!canSubmit}>
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Consultar"}
            </Button>
          </div>

          {/* Resultado */}
          {isPending ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Consultando depósito...
            </div>
          ) : result ? (
            <ResultPanel
              available={result.available}
              productCode={result.productCode}
              name={result.name}
              quantityOnHand={result.quantityOnHand}
            />
          ) : (
            <p className="text-xs text-muted-foreground">
              El resultado de la consulta aparecerá acá.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Panel de resultado ─────────────────────────────────────────────────────────

function ResultPanel({
  available,
  productCode,
  name,
  quantityOnHand,
}: {
  available: boolean;
  productCode: string;
  name?: string | null;
  quantityOnHand?: number | null;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        available
          ? "bg-emerald-50 border-emerald-200"
          : "bg-gray-50 border-gray-200"
      }`}
    >
      <div className="flex items-center gap-2">
        {available ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        ) : (
          <XCircle className="w-5 h-5 text-gray-400 shrink-0" />
        )}
        <div className="min-w-0">
          <p className={`text-sm font-bold ${available ? "text-emerald-800" : "text-gray-700"}`}>
            {available ? "En stock" : "Sin stock"}
          </p>
          <p className="text-xs text-muted-foreground font-mono">{productCode}</p>
        </div>
      </div>

      {(name || quantityOnHand != null) && (
        <div className="mt-3 pt-3 border-t border-black/5 space-y-1 text-xs text-gray-700">
          {name && (
            <p>
              <span className="text-muted-foreground">Producto: </span>
              {name}
            </p>
          )}
          {available && quantityOnHand != null && (
            <p>
              <span className="text-muted-foreground">Cantidad disponible: </span>
              {quantityOnHand}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
