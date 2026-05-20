"use client";

import { useState } from "react";
import {
  Wrench,
  Tag,
  CheckCircle2,
  PlayCircle,
  Clock,
  ClipboardList,
  AlertCircle,
  X,
  History,
} from "lucide-react";

import {
  AssignmentStatusLabel,
  WorkOrderServiceAssignmentStatus,
  WorkOrderStatus,
  WorkOrderStatusConfig,
} from "@/lib/enums";
import { formatDateTime } from "@/lib/format";
import {
  useMechanicTasks,
  useAcceptService,
  useCompleteService,
} from "@/hooks/useMechanicTasks";
import { MechanicTask } from "@/types/api.types";

// ─── Página principal ─────────────────────────────────────────────────────────

export default function MechanicTasksPage() {
  const [showHistory, setShowHistory] = useState(false);

  const { data: activeTasks, isLoading, isError } = useMechanicTasks();
  const { data: completedTasks } = useMechanicTasks(
    showHistory ? WorkOrderServiceAssignmentStatus.Completed : undefined
  );

  const tasks = showHistory ? completedTasks ?? [] : activeTasks ?? [];

  return (
    <div className="space-y-5">
      {/* ── Título ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#041627]">
            {showHistory ? "Historial" : "Mis trabajos"}
          </h1>
          <p className="text-sm text-[#44474c] mt-0.5">
            {showHistory
              ? "Servicios que finalizaste."
              : "Servicios asignados a vos. Aceptalos cuando empieces y finalizalos al terminar."}
          </p>
        </div>

        <button
          onClick={() => setShowHistory((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#c4c6cd] text-[#041627] text-xs font-semibold hover:bg-white transition-colors shrink-0"
        >
          <History className="w-3.5 h-3.5" />
          {showHistory ? "Activos" : "Historial"}
        </button>
      </div>

      {/* ── Estados ────────────────────────────────────────────────────────── */}
      {isLoading && <TaskSkeletons />}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
          <p className="text-sm text-red-600 font-medium">No pudimos cargar tus trabajos.</p>
          <p className="text-xs text-red-400 mt-0.5">Intentá recargar la página.</p>
        </div>
      )}

      {!isLoading && !isError && tasks.length === 0 && (
        <EmptyState showingHistory={showHistory} />
      )}

      {/* ── Lista de tareas ────────────────────────────────────────────────── */}
      {tasks.length > 0 && (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard key={task.workOrderServiceId} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Card de tarea ────────────────────────────────────────────────────────────

function TaskCard({ task }: { task: MechanicTask }) {
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const acceptMut   = useAcceptService();
  const completeMut = useCompleteService();

  const isPending   = task.assignmentStatus === WorkOrderServiceAssignmentStatus.Pending;
  const isAccepted  = task.assignmentStatus === WorkOrderServiceAssignmentStatus.Accepted;
  const isCompleted = task.assignmentStatus === WorkOrderServiceAssignmentStatus.Completed;

  // El back solo permite aceptar/completar cuando la WO está InProgress.
  // Si no lo está, deshabilitamos el botón y mostramos un hint claro.
  const woStatus       = Number(task.workOrderCurrentStatus) as WorkOrderStatus;
  const isWoInProgress = woStatus === WorkOrderStatus.InProgress;

  const statusStyle = isPending
    ? "bg-[#fea520]/15 text-[#7a4f0f] border-[#fea520]/40"
    : isAccepted
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";

  return (
    <article
      className={`bg-white rounded-2xl border shadow-sm p-4 ${
        isPending ? "border-[#fea520]/60" : "border-[#c4c6cd]/60"
      }`}
    >
      {/* Encabezado: vehículo + estado */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#041627] truncate">
            {task.vehicleBrand} {task.vehicleModel}
          </p>
          <span className="inline-flex items-center gap-1 text-xs text-[#44474c] font-mono mt-0.5">
            <Tag className="w-3 h-3 text-[#44474c]/50" />
            {task.vehicleLicensePlate}
          </span>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0 ${statusStyle}`}
        >
          {isPending && <Clock className="w-3 h-3" />}
          {isAccepted && <PlayCircle className="w-3 h-3" />}
          {isCompleted && <CheckCircle2 className="w-3 h-3" />}
          {AssignmentStatusLabel[task.assignmentStatus]}
        </span>
      </div>

      {/* Servicio */}
      <div className="bg-[#f4f6f8] rounded-xl px-3 py-2.5 mb-3">
        <div className="flex items-start gap-2">
          <Wrench className="w-3.5 h-3.5 text-[#fea520] shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#041627] leading-tight">
              {task.serviceName}
              {task.quantity > 1 && (
                <span className="ml-1 text-xs text-[#44474c]">× {task.quantity}</span>
              )}
            </p>
            {task.serviceDescription && (
              <p className="text-xs text-[#44474c] mt-1 leading-relaxed">
                {task.serviceDescription}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Notas previas (cliente / técnico) */}
      {(task.customerNote || task.technicianNote) && (
        <div className="space-y-2 mb-3">
          {task.customerNote && (
            <NoteBlock label="Lo que pidió el cliente" text={task.customerNote} />
          )}
          {task.technicianNote && (
            <NoteBlock label="Diagnóstico del técnico" text={task.technicianNote} />
          )}
        </div>
      )}

      {/* Si ya está completado, mostrar lo que escribió el mecánico */}
      {isCompleted && task.mechanicNotes && (
        <div className="space-y-2 mb-1">
          <NoteBlock
            label="Lo que hiciste"
            text={task.mechanicNotes}
            tone="success"
          />
          {task.mechanicFindings && (
            <NoteBlock
              label="Hallazgos / recomendaciones"
              text={task.mechanicFindings}
              tone="info"
            />
          )}
          {task.completedAt && (
            <p className="text-[11px] text-[#44474c]/70 pl-1">
              Finalizado el {formatDateTime(task.completedAt)}
            </p>
          )}
        </div>
      )}

      {/* Acción principal */}
      {!isCompleted && (
        <div className="pt-1">
          {/* Hint cuando la WO no está en progreso — el back rechazaría el accept/complete */}
          {!isWoInProgress && (
            <WorkOrderStatusHint status={woStatus} />
          )}

          {isPending && (
            <button
              onClick={() => acceptMut.mutate(task.workOrderServiceId)}
              disabled={acceptMut.isPending || !isWoInProgress}
              title={!isWoInProgress ? "La orden no está en progreso todavía" : undefined}
              className="w-full py-3 rounded-xl text-sm font-bold bg-[#fea520] text-[#041627] hover:bg-[#e8951d] active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              {acceptMut.isPending ? "Aceptando..." : "Aceptar trabajo"}
            </button>
          )}

          {isAccepted && (
            <button
              onClick={() => setCompleteModalOpen(true)}
              disabled={!isWoInProgress}
              title={!isWoInProgress ? "La orden no está en progreso" : undefined}
              className="w-full py-3 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Finalizar trabajo
            </button>
          )}

          {isAccepted && task.acceptedAt && (
            <p className="text-[11px] text-[#44474c]/70 mt-2 text-center">
              Aceptado el {formatDateTime(task.acceptedAt)}
            </p>
          )}
        </div>
      )}

      {/* Modal de finalización */}
      {completeModalOpen && (
        <CompleteModal
          workOrderServiceId={task.workOrderServiceId}
          serviceName={task.serviceName}
          isSubmitting={completeMut.isPending}
          onSubmit={(data) =>
            completeMut.mutate(
              { workOrderServiceId: task.workOrderServiceId, data },
              { onSuccess: () => setCompleteModalOpen(false) }
            )
          }
          onClose={() => setCompleteModalOpen(false)}
        />
      )}
    </article>
  );
}

// ─── Hint del estado de la WorkOrder ─────────────────────────────────────────

function WorkOrderStatusHint({ status }: { status: WorkOrderStatus }) {
  // Mensajes específicos por estado para que el mecánico sepa por qué no
  // puede aceptar/finalizar todavía. El back hace el chequeo final.
  const message = (() => {
    switch (status) {
      case WorkOrderStatus.Received:
        return "El vehículo recién entró. Esperá a que el diagnóstico esté listo y el admin la pase a En progreso.";
      case WorkOrderStatus.Diagnosing:
        return "La orden está en diagnóstico. Vas a poder aceptar el trabajo cuando pase a En progreso.";
      case WorkOrderStatus.AwaitingApproval:
        return "Esperando que el cliente apruebe el presupuesto.";
      case WorkOrderStatus.Approved:
        return "El cliente aprobó, pero el vehículo aún no arrancó el trabajo. Vas a poder aceptar cuando pase a En progreso.";
      case WorkOrderStatus.Completed:
      case WorkOrderStatus.Delivered:
        return "La orden ya fue finalizada.";
      case WorkOrderStatus.Cancelled:
        return "La orden fue cancelada.";
      default:
        return "La orden todavía no está en progreso.";
    }
  })();

  const statusLabel = WorkOrderStatusConfig[status]?.label ?? "—";

  return (
    <div className="flex items-start gap-2 rounded-xl bg-[#eefcfd] border border-[#c4c6cd]/60 px-3 py-2.5 mb-3">
      <AlertCircle className="w-4 h-4 text-[#fea520] shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">
          Orden en estado &ldquo;{statusLabel}&rdquo;
        </p>
        <p className="text-xs text-[#041627] mt-0.5 leading-relaxed">
          {message}
        </p>
      </div>
    </div>
  );
}

// ─── Bloque de nota ───────────────────────────────────────────────────────────

function NoteBlock({
  label,
  text,
  tone = "neutral",
}: {
  label: string;
  text: string;
  tone?: "neutral" | "success" | "info";
}) {
  const styles =
    tone === "success"
      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
      : tone === "info"
        ? "bg-blue-50 border-blue-200 text-blue-900"
        : "bg-[#eefcfd] border-[#c4c6cd]/40 text-[#041627]";

  return (
    <div className={`rounded-xl px-3 py-2 border ${styles}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-0.5">
        {label}
      </p>
      <p className="text-xs leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  );
}

// ─── Modal de finalización ────────────────────────────────────────────────────

interface CompleteModalProps {
  workOrderServiceId: string;
  serviceName: string;
  isSubmitting: boolean;
  onSubmit: (data: { notes: string; findings?: string }) => void;
  onClose: () => void;
}

function CompleteModal({
  serviceName,
  isSubmitting,
  onSubmit,
  onClose,
}: CompleteModalProps) {
  const [notes, setNotes]       = useState("");
  const [findings, setFindings] = useState("");
  const [error, setError]       = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (notes.trim().length < 10) {
      setError("Las notas deben tener al menos 10 caracteres.");
      return;
    }
    setError(null);
    onSubmit({
      notes: notes.trim(),
      findings: findings.trim() || undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="sticky top-0 bg-white border-b border-[#c4c6cd]/40 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#fea520]">
              Finalizar trabajo
            </p>
            <h2 className="text-base font-bold text-[#041627] truncate">{serviceName}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#f4f6f8] text-[#44474c]"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Notas (obligatorias) */}
          <div className="space-y-1.5">
            <label
              htmlFor="notes"
              className="text-[11px] font-bold uppercase tracking-widest text-[#041627] flex items-center gap-1"
            >
              ¿Qué hiciste? <span className="text-red-500">*</span>
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Ej: Cambié la correa de distribución y el tensor. Verifiqué tensión y giro libre del cigüeñal."
              maxLength={2000}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#c4c6cd] bg-white text-[#041627] placeholder:text-[#44474c]/40 focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all resize-none"
            />
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-[#44474c]/70">
                Mínimo 10 caracteres · Esto lo ve el admin y el cliente.
              </p>
              <p className="text-[11px] text-[#44474c]/60 tabular-nums">
                {notes.length}/2000
              </p>
            </div>
          </div>

          {/* Hallazgos (opcionales) */}
          <div className="space-y-1.5">
            <label
              htmlFor="findings"
              className="text-[11px] font-bold uppercase tracking-widest text-[#041627]"
            >
              Hallazgos / recomendaciones (opcional)
            </label>
            <textarea
              id="findings"
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              rows={3}
              placeholder="Ej: Detecté pastillas de freno gastadas, recomiendo cambio en próxima visita."
              maxLength={2000}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#c4c6cd] bg-white text-[#041627] placeholder:text-[#44474c]/40 focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all resize-none"
            />
            <p className="text-[11px] text-[#44474c]/70">
              Cosas que detectaste pero no estaban en el trabajo asignado.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-[#c4c6cd]/40 px-5 py-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 rounded-xl text-sm font-bold border border-[#c4c6cd] text-[#041627] hover:bg-[#f4f6f8] disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-3 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Finalizando..." : "Finalizar"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Skeletons / vacío ────────────────────────────────────────────────────────

function TaskSkeletons() {
  return (
    <div className="space-y-3">
      {[...Array(2)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-[#c4c6cd]/60 shadow-sm p-4 space-y-3 animate-pulse"
        >
          <div className="flex justify-between">
            <div className="h-4 w-32 bg-[#c4c6cd]/40 rounded" />
            <div className="h-5 w-20 bg-[#c4c6cd]/30 rounded-full" />
          </div>
          <div className="h-12 w-full bg-[#c4c6cd]/20 rounded-xl" />
          <div className="h-10 w-full bg-[#c4c6cd]/30 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ showingHistory }: { showingHistory: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <ClipboardList className="w-12 h-12 text-[#c4c6cd]" />
      <p className="text-sm font-semibold text-[#041627]">
        {showingHistory ? "Sin historial" : "No tenés trabajos asignados"}
      </p>
      <p className="text-xs text-[#44474c] max-w-xs">
        {showingHistory
          ? "Los trabajos que finalices van a aparecer acá."
          : "Cuando el admin te asigne un servicio, va a aparecer en esta pantalla."}
      </p>
    </div>
  );
}
