import { Car, CheckCircle2, ClipboardList, Clock, PackageCheck, Search, Wrench } from "lucide-react";
import { WorkOrderStatus } from "@/lib/enums";

// ─── Config de banners contextuales por estado ────────────────────────────────

export const STATUS_BANNERS: Partial<Record<WorkOrderStatus, {
  color: string;
  iconColor: string;
  pulse: boolean;
  title: string;
  message: string;
  actionLabel?: string;
}>> = {
  [WorkOrderStatus.UnderInspection]: {
    color: "bg-slate-50 border-slate-200",
    iconColor: "text-slate-600",
    pulse: false,
    title: "Inspección en curso",
    message: "Las áreas están relevando el vehículo. Cuando cierres la inspección podés pasar a Diagnóstico.",
    actionLabel: "Pasar a Diagnóstico",
  },
  [WorkOrderStatus.Received]: {
    color: "bg-blue-50 border-blue-200",
    iconColor: "text-blue-700",
    pulse: false,
    title: "Orden recibida",
    message: "Pasala a Diagnóstico cuando el mecánico empiece a revisar el vehículo.",
    actionLabel: "Iniciar diagnóstico",
  },
  [WorkOrderStatus.Diagnosing]: {
    color: "bg-amber-50 border-amber-200",
    iconColor: "text-amber-700",
    pulse: true,
    title: "En diagnóstico — armando presupuesto",
    message: "Cargá los servicios y repuestos en base a los hallazgos. Cuando el presupuesto esté listo, enviáselo al cliente.",
  },
  [WorkOrderStatus.AwaitingApproval]: {
    color: "bg-purple-50 border-purple-200",
    iconColor: "text-purple-700",
    pulse: false,
    title: "Esperando aprobación del cliente",
    message: "El presupuesto fue enviado. Cuando el cliente apruebe — por el link o por teléfono — avanzá al siguiente paso.",
    actionLabel: "Cliente aprobó → continuar",
  },
  [WorkOrderStatus.Approved]: {
    color: "bg-emerald-50 border-emerald-300",
    iconColor: "text-emerald-700",
    pulse: true,
    title: "¡Presupuesto aprobado — listo para iniciar!",
    message: "El cliente dio el OK. Cuando el vehículo esté en el taller, iniciá el trabajo — los mecánicos van a ver los servicios automáticamente en su panel.",
    actionLabel: "Auto en el taller → Iniciar trabajo",
  },
  [WorkOrderStatus.InProgress]: {
    color: "bg-orange-50 border-orange-200",
    iconColor: "text-orange-700",
    pulse: false,
    title: "Trabajo en curso",
    message: "Los mecánicos están trabajando. Podés cerrar la orden cuando todos los servicios estén completados.",
    actionLabel: "Marcar como completado",
  },
  [WorkOrderStatus.Completed]: {
    color: "bg-green-50 border-green-200",
    iconColor: "text-green-700",
    pulse: true,
    title: "¡Trabajo finalizado!",
    message: "Todos los servicios fueron completados. Registrá la entrega cuando el cliente retire el vehículo.",
    actionLabel: "Registrar entrega al cliente",
  },
};

export const STATUS_ICONS: Partial<Record<WorkOrderStatus, typeof Car>> = {
  [WorkOrderStatus.UnderInspection]:  Search,
  [WorkOrderStatus.Received]:         ClipboardList,
  [WorkOrderStatus.Diagnosing]:       Wrench,
  [WorkOrderStatus.AwaitingApproval]: Clock,
  [WorkOrderStatus.Approved]:         CheckCircle2,
  [WorkOrderStatus.InProgress]:       Wrench,
  [WorkOrderStatus.Completed]:        PackageCheck,
};

// ─── Banner contextual ────────────────────────────────────────────────────────

export function StatusBanner({ status }: { status: WorkOrderStatus }) {
  const banner = STATUS_BANNERS[status];
  const BannerIcon = STATUS_ICONS[status];
  if (!banner) return null;

  return (
    <div className={`rounded-xl border-2 px-5 py-4 ${banner.color}`}>
      <div className="flex items-start gap-3">
        {BannerIcon && (
          <div className={banner.pulse ? "animate-pulse" : ""}>
            <BannerIcon className={`w-5 h-5 mt-0.5 shrink-0 ${banner.iconColor}`} />
          </div>
        )}
        <div>
          <p className={`font-bold text-sm ${banner.iconColor}`}>{banner.title}</p>
          <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">{banner.message}</p>
        </div>
      </div>
    </div>
  );
}
