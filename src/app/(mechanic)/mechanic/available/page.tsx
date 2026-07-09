"use client";

import { useState } from "react";
import {
  Car,
  ClipboardCheck,
  Clock,
  HandCoins,
  Package,
  Sparkles,
  Wrench,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { useAvailableServices, useClaimService } from "@/hooks/useMechanicTasks";
import { AvailableService } from "@/types/api.types";

// ─── Tiempo relativo simple (sin dependencia extra) ──────────────────────────

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins   = Math.floor(diffMs / 60_000);
  if (mins < 1)  return "recién";
  if (mins < 60) return `hace ${mins} min`;
  const hours  = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days   = Math.floor(hours / 24);
  return `hace ${days} día${days > 1 ? "s" : ""}`;
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function MechanicAvailableServicesPage() {
  const { data: services, isLoading, isError, refetch, isFetching } = useAvailableServices();
  const [pending, setPending] = useState<AvailableService | null>(null);

  return (
    <div className="space-y-5 pb-12">
      {/* Header premium consistente con /mechanic/tasks */}
      <div className="bg-[#041627] text-white rounded-2xl p-5 shadow-md shadow-[#041627]/10 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-[#fea520]" />
            <h1 className="text-lg font-extrabold tracking-wide">Trabajos disponibles</h1>
          </div>
          <p className="text-xs text-white/60 mt-1 leading-snug">
            Servicios aprobados sin asignar. Tomá el que prefieras.
          </p>
          <p className="text-[10px] text-white/40 mt-2 font-medium">
            Se actualiza solo cada 30 segundos.
          </p>
        </div>
      </div>

      {/* Estado */}
      {isLoading && <SkeletonList />}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          No se pudo cargar el listado.{" "}
          <button onClick={() => refetch()} className="underline font-semibold">
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !isError && (services?.length ?? 0) === 0 && (
        <EmptyState />
      )}

      {!isLoading && (services?.length ?? 0) > 0 && (
        <div className="space-y-3">
          {services!.map((s) => (
            <AvailableServiceCard
              key={s.workOrderServiceId}
              service={s}
              onClaim={() => setPending(s)}
            />
          ))}
        </div>
      )}

      {/* Modal de confirmación */}
      {pending && (
        <ClaimConfirmDialog
          service={pending}
          onClose={() => setPending(null)}
          onClaimed={() => setPending(null)}
        />
      )}

      {/* Indicador discreto de refetch */}
      {isFetching && !isLoading && (
        <p className="text-center text-[10px] text-muted-foreground">Actualizando…</p>
      )}
    </div>
  );
}

// ─── Card de servicio ─────────────────────────────────────────────────────────

function AvailableServiceCard({
  service,
  onClaim,
}: {
  service: AvailableService;
  onClaim: () => void;
}) {
  return (
    <article className="rounded-2xl border border-[#c4c6cd]/40 bg-white p-4 shadow-sm">
      {/* Servicio */}
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#fea520] to-[#fec15d] flex items-center justify-center shrink-0 shadow-sm shadow-[#fea520]/30">
          <Wrench className="w-4 h-4 text-[#041627]" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-extrabold text-[#041627] leading-tight">
            {service.serviceName}
          </h3>
          {service.serviceDescription && (
            <p className="text-xs text-[#44474c]/80 mt-1 line-clamp-2 leading-relaxed">
              {service.serviceDescription}
            </p>
          )}
        </div>
        <span className="text-sm font-bold text-[#041627] tabular-nums whitespace-nowrap">
          {formatCurrency(service.priceSnapshot * service.quantity)}
        </span>
      </div>

      {/* Meta */}
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-[#44474c]/70">
        <Meta icon={<Car className="w-3 h-3" />} label={`${service.vehicleBrand} ${service.vehicleModel}`} />
        <Meta icon={<Package className="w-3 h-3" />} label={service.vehicleLicensePlate} mono />
        {/* Sin propietario/cliente/flota: el mecánico no ve para quién es el trabajo. */}
        {service.estimatedDurationMinutes > 0 && (
          <Meta icon={<Clock className="w-3 h-3" />} label={`${service.estimatedDurationMinutes} min`} />
        )}
        {service.quantity > 1 && (
          <Meta icon={<Sparkles className="w-3 h-3" />} label={`x${service.quantity}`} />
        )}
        <Meta icon={<Clock className="w-3 h-3" />} label={timeAgo(service.createdAt)} />
      </div>

      {/* CTA */}
      <Button
        onClick={onClaim}
        className="w-full mt-3 bg-gradient-to-r from-[#fea520] to-[#fec15d] text-[#041627] hover:from-[#fec15d] hover:to-[#fea520] font-extrabold"
      >
        <HandCoins className="w-4 h-4 mr-1.5" />
        Tomar trabajo
      </Button>
    </article>
  );
}

function Meta({ icon, label, mono }: { icon: React.ReactNode; label: string; mono?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 ${mono ? "font-mono" : ""}`}>
      {icon}
      {label}
    </span>
  );
}

// ─── Modal de confirmación ────────────────────────────────────────────────────

function ClaimConfirmDialog({
  service,
  onClose,
  onClaimed,
}: {
  service: AvailableService;
  onClose: () => void;
  onClaimed: () => void;
}) {
  const { mutate: claim, isPending } = useClaimService();

  return (
    <Dialog open onOpenChange={(o) => !o && !isPending && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Tomar este trabajo</DialogTitle>
          <DialogDescription>
            Quedás como responsable. Después tenés que <strong>aceptar</strong> el trabajo
            desde &quot;Mis trabajos&quot; para empezar a laburar — o liberarlo si te
            equivocaste.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border bg-gray-50 px-3 py-2.5 space-y-1.5 text-sm">
          <p className="font-bold text-[#041627]">{service.serviceName}</p>
          <p className="text-xs text-[#44474c]">
            {service.vehicleBrand} {service.vehicleModel}{" "}
            <span className="font-mono">({service.vehicleLicensePlate})</span>
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            onClick={() =>
              claim(service.workOrderServiceId, {
                onSuccess: onClaimed,
                // onError se maneja en el hook (incluyendo refetch en 409)
              })
            }
            disabled={isPending}
            className="bg-gradient-to-r from-[#fea520] to-[#fec15d] text-[#041627] hover:from-[#fec15d] hover:to-[#fea520] font-extrabold"
          >
            {isPending ? "Tomando…" : "Sí, tomarlo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Empty / Loading ──────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="rounded-2xl border border-[#c4c6cd]/40 bg-white p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-[#f4f6f8] flex items-center justify-center mx-auto">
        <ClipboardCheck className="w-6 h-6 text-[#44474c]/40" />
      </div>
      <p className="mt-3 text-sm font-bold text-[#041627]">No hay trabajos disponibles</p>
      <p className="text-xs text-[#44474c]/70 mt-1">
        Volvé en un rato — la lista se actualiza sola.
      </p>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-32 rounded-2xl bg-white border border-[#c4c6cd]/40 animate-pulse"
        />
      ))}
    </div>
  );
}
