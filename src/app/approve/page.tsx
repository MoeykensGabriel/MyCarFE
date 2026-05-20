"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Car, Wrench, AlertTriangle } from "lucide-react";
import { workOrdersService } from "@/services/work-orders.service";
import { ApproveQuotePreview } from "@/types/api.types";
import { formatCurrency } from "@/lib/format";

type PageState = "loading" | "preview" | "approving" | "success" | "error";

export default function ApprovePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state,    setState]    = useState<PageState>("loading");
  const [preview,  setPreview]  = useState<ApproveQuotePreview | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setErrorMsg("El link de aprobación no es válido.");
      setState("error");
      return;
    }

    workOrdersService.getApprovePreview(token)
      .then((data) => {
        // El back puede devolver isExpired=true para tokens vencidos o ya usados.
        // En ese caso mostramos el error directo en vez del preview.
        if (data.isExpired) {
          setErrorMsg("El link de aprobación expiró o ya fue utilizado. Pedile al taller que genere uno nuevo.");
          setState("error");
          return;
        }
        setPreview(data);
        setState("preview");
      })
      .catch((err) => {
        const detail = err?.response?.data?.detail ?? err?.response?.data?.title;
        setErrorMsg(detail ?? "No se pudo cargar el presupuesto. El link puede haber expirado.");
        setState("error");
      });
  }, [token]);

  async function handleApprove() {
    if (!token) return;
    setState("approving");
    try {
      await workOrdersService.approveQuote(token);
      setState("success");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string; title?: string } } };
      const detail = e?.response?.data?.detail ?? e?.response?.data?.title;
      setErrorMsg(detail ?? "No se pudo aprobar el presupuesto.");
      setState("error");
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (state === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f5f6f8] px-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-4 border-[#041627] border-t-transparent animate-spin mx-auto" />
          <p className="text-sm text-[#44474c]">Cargando tu presupuesto...</p>
        </div>
      </main>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (state === "error") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f5f6f8] px-4">
        <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm p-8 max-w-md w-full text-center space-y-4">
          <XCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h1 className="text-xl font-bold text-[#041627]">Link no válido</h1>
          <p className="text-sm text-[#44474c]">{errorMsg}</p>
        </div>
      </main>
    );
  }

  // ── Éxito ──────────────────────────────────────────────────────────────────
  if (state === "success") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f5f6f8] px-4">
        <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm p-8 max-w-md w-full text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
          <h1 className="text-xl font-bold text-[#041627]">¡Presupuesto aprobado!</h1>
          <p className="text-sm text-[#44474c]">
            Quedó registrada tu aprobación. Te avisaremos cuando comencemos a trabajar en el vehículo.
          </p>
        </div>
      </main>
    );
  }

  // ── Preview ────────────────────────────────────────────────────────────────
  if (!preview) return null;

  return (
    <main className="min-h-screen bg-[#f5f6f8] px-4 py-10">
      <div className="max-w-lg mx-auto space-y-5">

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#041627] text-white mb-2">
            <Wrench className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-[#041627]">Presupuesto de reparación</h1>
          <p className="text-sm text-[#44474c]">
            Hola <span className="font-semibold">{preview.customerName}</span>, revisá el detalle y aprobá para que el trabajo comience.
          </p>
        </div>

        {/* Vehículo */}
        <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#041627] text-white flex items-center justify-center shrink-0">
            <Car className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#041627]">
              {preview.vehicleBrand} {preview.vehicleModel}
            </p>
            <p className="text-xs text-[#44474c] font-mono">{preview.vehicleLicensePlate}</p>
          </div>
        </div>

        {/* Servicios */}
        <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-[#eefcfd] border-b border-[#c4c6cd]/60">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">
              Servicios incluidos
            </p>
          </div>
          <div className="divide-y divide-[#c4c6cd]/40">
            {preview.services.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#041627] truncate">{s.name}</p>
                  {s.description && (
                    <p className="text-xs text-[#44474c]/70 truncate">{s.description}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-[#041627]">{formatCurrency(s.subtotal)}</p>
                  {s.quantity > 1 && (
                    <p className="text-[10px] text-[#44474c]/50">
                      {s.quantity} × {formatCurrency(s.unitPrice)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between px-5 py-3 bg-[#eefcfd]/60 border-t border-[#c4c6cd]/60">
            <p className="text-sm font-bold text-[#041627]">Total</p>
            <p className="text-lg font-bold text-[#041627]">{formatCurrency(preview.totalAmount)}</p>
          </div>
        </div>

        {/* Aviso legal */}
        <div className="flex items-start gap-2 rounded-md bg-[#fea520]/10 border border-[#fea520]/30 px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-[#fea520] shrink-0 mt-0.5" />
          <p className="text-xs text-[#44474c]">
            Al aprobar este presupuesto autorizás la realización de los servicios indicados y el cobro del monto total al momento de la entrega.
          </p>
        </div>

        {/* Botón */}
        <button
          onClick={handleApprove}
          disabled={state === "approving"}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-base font-bold text-[#041627] bg-[#fea520] hover:bg-[#865300] hover:text-white transition-all disabled:opacity-50"
        >
          <CheckCircle2 className="w-5 h-5" />
          {state === "approving" ? "Aprobando..." : "Aprobar presupuesto"}
        </button>

      </div>
    </main>
  );
}
