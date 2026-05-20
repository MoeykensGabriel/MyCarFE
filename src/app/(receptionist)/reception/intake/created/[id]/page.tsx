"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Printer, Plus, AlertCircle } from "lucide-react";

import { workOrdersService } from "@/services/work-orders.service";
import { WorkOrder } from "@/types/api.types";

export default function OrderCreatedPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [order, setOrder]     = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await workOrdersService.getById(id);
        if (!cancelled) setOrder(data);
      } catch {
        if (!cancelled) setError("No se pudo cargar el detalle de la orden.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden">
        <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-5 flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h1 className="text-lg font-bold text-emerald-900">
              Orden creada correctamente
            </h1>
            <p className="text-sm text-emerald-800/80 mt-0.5">
              El cliente y vehículo quedaron registrados. El taller ya puede tomar el trabajo.
            </p>
          </div>
        </div>

        <div className="px-6 py-6 space-y-5">
          {loading && (
            <p className="text-sm text-[#44474c]">Cargando detalle...</p>
          )}

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {order && (
            <>
              <Row label="ID de orden"      value={order.id} mono />
              <Row label="Vehículo"         value={[order.vehicleBrand, order.vehicleModel].filter(Boolean).join(" ") || "—"} />
              <Row label="Patente"          value={order.vehicleLicensePlate ?? "—"} />
              <Row label="Propietario"      value={order.ownerName ?? "—"} />
              <Row label="Kilometraje"      value={order.mileageAtEntry != null ? `${order.mileageAtEntry.toLocaleString("es-AR")} km` : "—"} />
              {order.contactPersonName && (
                <Row label="Contacto"       value={`${order.contactPersonName}${order.contactPersonPhone ? " — " + order.contactPersonPhone : ""}`} />
              )}
              {order.customerNote && (
                <Row label="Nota del cliente" value={order.customerNote} />
              )}
              <Row label="Creada"           value={new Date(order.createdAt).toLocaleString("es-AR")} />
            </>
          )}
        </div>

        <div className="border-t border-[#c4c6cd]/60 px-6 py-4 flex flex-wrap gap-2 justify-end bg-[#eefcfd]/40 print:hidden">
          <button
            onClick={() => window.print()}
            disabled={!order}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium border border-[#c4c6cd] text-[#041627] hover:bg-white disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
          <Link
            href="/reception/intake"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-semibold bg-[#fea520] text-[#041627] hover:bg-[#865300] hover:text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            Cargar otra orden
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 items-baseline">
      <span className="text-xs font-bold uppercase tracking-wider text-[#44474c]/70">{label}</span>
      <span className={`text-sm text-[#041627] ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
