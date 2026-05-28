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
  Sparkles,
  HelpCircle,
} from "lucide-react";

import {
  AssignmentStatusLabel,
  PhotoType,
  WorkOrderServiceAssignmentStatus,
  WorkOrderStatus,
  WorkOrderStatusConfig,
} from "@/lib/enums";
import { workOrdersService } from "@/services/work-orders.service";
import { formatDateTime } from "@/lib/format";
import {
  useMechanicTasks,
  useAcceptService,
  useCompleteService,
  useReleaseService,
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
    <div className="space-y-5 pb-12">
      {/* ── Título y Header Premium ─────────────────────────────────────────── */}
      <div className="bg-[#041627] text-white rounded-2xl p-5 shadow-md shadow-[#041627]/10 relative overflow-hidden">
        {/* Decoración circular de fondo */}
        <div className="absolute -right-10 -bottom-10 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-[#fea520]" />
              <h1 className="text-lg font-extrabold tracking-wide">
                {showHistory ? "Historial de Trabajos" : "Mis trabajos"}
              </h1>
            </div>
            <p className="text-xs text-white/60 mt-1 leading-snug max-w-[200px]">
              {showHistory
                ? "Servicios finalizados con éxito."
                : "Aceptá tus servicios asignados e indicalos al finalizar."}
            </p>
          </div>

          <button
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-[#fea520] hover:text-[#fec15d] hover:bg-white/10 text-xs font-bold active:scale-[0.97] transition-all shrink-0"
          >
            <History className="w-3.5 h-3.5" />
            {showHistory ? "Activos" : "Historial"}
          </button>
        </div>
      </div>

      {/* ── Estados ────────────────────────────────────────────────────────── */}
      {isLoading && <TaskSkeletons />}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center shadow-sm">
          <p className="text-sm text-red-600 font-bold">No pudimos cargar tus trabajos.</p>
          <p className="text-xs text-red-400 mt-1">Por favor, intentá de nuevo recargando la página.</p>
        </div>
      )}

      {!isLoading && !isError && tasks.length === 0 && (
        <EmptyState showingHistory={showHistory} />
      )}

      {/* ── Lista de tareas ────────────────────────────────────────────────── */}
      {tasks.length > 0 && (
        <div className="space-y-4.5 animate-[fadeIn_0.2s_ease-out]">
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
  const [releaseModalOpen,  setReleaseModalOpen]  = useState(false);
  const acceptMut   = useAcceptService();
  const completeMut = useCompleteService();
  const releaseMut  = useReleaseService();

  const isPending   = task.assignmentStatus === WorkOrderServiceAssignmentStatus.Pending;
  const isAccepted  = task.assignmentStatus === WorkOrderServiceAssignmentStatus.Accepted;
  const isCompleted = task.assignmentStatus === WorkOrderServiceAssignmentStatus.Completed;

  // El back solo permite aceptar/completar cuando la WO está InProgress.
  const woStatus       = Number(task.workOrderCurrentStatus) as WorkOrderStatus;
  const isWoInProgress = woStatus === WorkOrderStatus.InProgress;

  const statusStyle = isPending
    ? "bg-[#fea520]/10 text-[#7a4f0f] border-[#fea520]/30 shadow-sm"
    : isAccepted
      ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm"
      : "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm";

  return (
    <article
      className={`bg-white rounded-2xl border p-5 relative overflow-hidden transition-all duration-300 ${
        isPending
          ? "border-[#fea520] shadow-[0_4px_16px_rgba(254,165,32,0.1)]"
          : "border-[#041627]/10 hover:border-[#fea520]/30 hover:shadow-md"
      }`}
    >
      {/* Indicador superior para pendientes */}
      {isPending && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#fea520] animate-pulse" />
      )}

      {/* Encabezado: vehículo + estado */}
      <div className="flex items-start justify-between gap-3 mb-3.5">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-[#041627] truncate leading-tight">
            {task.vehicleBrand} {task.vehicleModel}
          </p>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono text-[#44474c] mt-1 bg-[#f4f6f8] px-2 py-0.5 rounded border border-[#041627]/5">
            <Tag className="w-3.5 h-3.5 text-[#44474c]/50" />
            {task.vehicleLicensePlate}
          </span>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shrink-0 ${statusStyle}`}
        >
          {isPending && <Clock className="w-3 h-3 text-[#fea520] animate-pulse" />}
          {isAccepted && <PlayCircle className="w-3.5 h-3.5 text-blue-500 animate-spin" style={{ animationDuration: '3s' }} />}
          {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
          {AssignmentStatusLabel[task.assignmentStatus]}
        </span>
      </div>

      {/* Servicio Asignado */}
      <div className="bg-[#f4f6f8] rounded-xl p-3.5 border border-[#041627]/5 mb-3.5 shadow-inner">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shrink-0 shadow border border-[#041627]/5">
            <Wrench className="w-4 h-4 text-[#fea520]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-[#041627] leading-tight mt-0.5">
              {task.serviceName}
              {task.quantity > 1 && (
                <span className="ml-1 text-[10px] font-extrabold text-[#44474c] bg-[#fea520]/15 px-1.5 py-0.5 rounded">× {task.quantity}</span>
              )}
            </p>
            {task.serviceDescription && (
              <p className="text-[11px] font-semibold text-[#44474c]/85 mt-1.5 leading-relaxed">
                {task.serviceDescription}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Notas previas (cliente / técnico) */}
      {(task.customerNote || task.technicianNote) && (
        <div className="space-y-2 mb-3.5">
          {task.customerNote && (
            <NoteBlock label="Instrucción del cliente" text={task.customerNote} />
          )}
          {task.technicianNote && (
            <NoteBlock label="Diagnóstico del taller" text={task.technicianNote} />
          )}
        </div>
      )}

      {/* Si ya está completado, mostrar lo que escribió el mecánico */}
      {isCompleted && task.mechanicNotes && (
        <div className="space-y-2 mb-1">
          <NoteBlock
            label="Detalle de tu trabajo realizado"
            text={task.mechanicNotes}
            tone="success"
          />
          {task.mechanicFindings && (
            <NoteBlock
              label="Hallazgos secundarios reportados"
              text={task.mechanicFindings}
              tone="info"
            />
          )}
          {task.completedAt && (
            <p className="text-[10px] font-bold text-[#44474c]/60 pl-1 mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Finalizado el {formatDateTime(task.completedAt)}
            </p>
          )}
        </div>
      )}

      {/* Acción principal */}
      {!isCompleted && (
        <div className="pt-1.5">
          {/* Hint cuando la WO no está en progreso */}
          {!isWoInProgress && (
            <WorkOrderStatusHint status={woStatus} />
          )}

          {isPending && (
            <>
              <button
                onClick={() => acceptMut.mutate(task.workOrderServiceId)}
                disabled={acceptMut.isPending || !isWoInProgress}
                title={!isWoInProgress ? "La orden no está en progreso todavía" : undefined}
                className="w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-widest bg-gradient-to-r from-[#fea520] to-[#fec15d] text-[#041627] hover:shadow-md hover:shadow-[#fea520]/10 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 shadow shadow-[#fea520]/10"
              >
                <PlayCircle className="w-4 h-4" />
                {acceptMut.isPending ? "Aceptando..." : "Iniciar trabajo"}
              </button>
              {/* "Liberar": solo visible mientras esté Pending. Si ya inició (Accepted),
                  tiene que avisar al admin para desasignarse. */}
              <button
                onClick={() => setReleaseModalOpen(true)}
                disabled={releaseMut.isPending}
                className="w-full mt-2 py-2 text-[11px] font-bold uppercase tracking-wider text-[#44474c] hover:text-red-600 transition-colors disabled:opacity-50"
              >
                {releaseMut.isPending ? "Liberando..." : "Liberar y volver al pool"}
              </button>
            </>
          )}

          {isAccepted && (
            <button
              onClick={() => setCompleteModalOpen(true)}
              disabled={!isWoInProgress}
              title={!isWoInProgress ? "La orden no está en progreso" : undefined}
              className="w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-widest bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-700 hover:to-emerald-600 active:scale-[0.98] transition-all shadow-md shadow-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Finalizar trabajo
            </button>
          )}

          {isAccepted && task.acceptedAt && (
            <p className="text-[10px] font-bold text-[#44474c]/55 mt-2.5 text-center flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-blue-500" />
              Iniciaste el {formatDateTime(task.acceptedAt)}
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
          onSubmit={({ notes, findings, photos }) =>
            completeMut.mutate(
              { workOrderServiceId: task.workOrderServiceId, data: { notes, findings } },
              {
                onSuccess: async () => {
                  // Subir fotos post-trabajo si las hay (no bloquea el cierre del modal si falla).
                  for (const file of photos) {
                    try {
                      const fd = new FormData();
                      fd.append("file", file);
                      fd.append("photoType", String(PhotoType.After));
                      fd.append("workOrderServiceId", task.workOrderServiceId);
                      await workOrdersService.addPhoto(task.workOrderId, fd);
                    } catch {
                      // Si falla una foto, seguimos con las demás. El usuario ve
                      // si quedaron faltantes desde la pantalla del admin.
                    }
                  }
                  setCompleteModalOpen(false);
                },
              }
            )
          }
          onClose={() => setCompleteModalOpen(false)}
        />
      )}

      {/* Modal de confirmación para liberar */}
      {releaseModalOpen && (
        <ReleaseConfirmModal
          serviceName={task.serviceName}
          isSubmitting={releaseMut.isPending}
          onConfirm={() =>
            releaseMut.mutate(task.workOrderServiceId, {
              onSuccess: () => setReleaseModalOpen(false),
            })
          }
          onClose={() => setReleaseModalOpen(false)}
        />
      )}
    </article>
  );
}

// ─── Modal de confirmación para liberar ──────────────────────────────────────

function ReleaseConfirmModal({
  serviceName,
  isSubmitting,
  onConfirm,
  onClose,
}: {
  serviceName: string;
  isSubmitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-sm shadow-2xl p-5"
      >
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#fea520]">
          Liberar trabajo
        </p>
        <h2 className="text-sm font-black text-[#041627] mt-1">{serviceName}</h2>
        <p className="text-xs text-[#44474c] mt-3 leading-relaxed">
          Este trabajo vuelve al pool y cualquier otro mecánico lo puede tomar. Hacelo si te
          equivocaste o no podés con esto ahora.
        </p>

        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider border border-[#041627]/10 text-[#041627] hover:bg-[#f4f6f8] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Liberando..." : "Sí, liberar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Hint del estado de la WorkOrder ─────────────────────────────────────────

function WorkOrderStatusHint({ status }: { status: WorkOrderStatus }) {
  const message = (() => {
    switch (status) {
      case WorkOrderStatus.Received:
        return "El vehículo ingresó. Esperá a que se complete el diagnóstico y el administrador pase la orden a En Progreso.";
      case WorkOrderStatus.Diagnosing:
        return "Orden en diagnóstico. Podrás aceptar e iniciar tareas una vez el administrador la mueva a En Progreso.";
      case WorkOrderStatus.AwaitingApproval:
        return "Esperando la aprobación de presupuestos por parte del cliente.";
      case WorkOrderStatus.Approved:
        return "Cliente aprobó. Vas a poder iniciar tus tareas en cuanto el taller pase la orden a En Progreso.";
      case WorkOrderStatus.Completed:
      case WorkOrderStatus.Delivered:
        return "La orden de trabajo ya se encuentra finalizada y el auto listo para entrega.";
      case WorkOrderStatus.Cancelled:
        return "Esta orden de trabajo fue cancelada.";
      default:
        return "La orden de trabajo todavía no se encuentra en progreso.";
    }
  })();

  const statusLabel = WorkOrderStatusConfig[status]?.label ?? "—";

  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-[#eefcfd]/80 border border-[#041627]/5 px-3 py-3 mb-3.5 shadow-sm">
      <HelpCircle className="w-4.5 h-4.5 text-[#e8951d] shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#041627]/70">
          Orden en Estado: {statusLabel}
        </p>
        <p className="text-[11px] font-semibold text-[#44474c] mt-0.5 leading-relaxed">
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
      ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
      : tone === "info"
        ? "bg-blue-50/70 border-blue-200 text-blue-950"
        : "bg-[#eefcfd]/60 border-[#041627]/5 text-[#041627]";

  return (
    <div className={`rounded-xl px-3.5 py-2.5 border shadow-sm ${styles}`}>
      <p className="text-[9px] font-extrabold uppercase tracking-widest opacity-80 mb-1">
        {label}
      </p>
      <p className="text-xs font-semibold leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  );
}

// ─── Modal de finalización ────────────────────────────────────────────────────

interface CompleteModalProps {
  workOrderServiceId: string;
  serviceName: string;
  isSubmitting: boolean;
  onSubmit: (data: { notes: string; findings?: string; photos: File[] }) => void;
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
  const [photos, setPhotos]     = useState<File[]>([]);
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
      photos,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl relative"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 to-emerald-500" />
        
        <div className="sticky top-0 bg-white border-b border-[#041627]/5 px-5 py-4.5 flex items-center justify-between z-10">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#fea520]">
              Finalizar trabajo
            </p>
            <h2 className="text-sm font-black text-[#041627] truncate mt-0.5">{serviceName}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#f4f6f8] text-[#44474c]"
            aria-label="Cerrar"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Notas (obligatorias) */}
          <div className="space-y-2">
            <label
              htmlFor="notes"
              className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627] flex items-center gap-1"
            >
              ¿Qué tareas realizaste? <span className="text-red-500">*</span>
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Ej: Cambié la correa de distribución y el rodillo tensor. Verifiqué tensión y no presenta ruidos extraños."
              maxLength={2000}
              className="w-full px-3.5 py-3 text-sm rounded-xl border border-[#041627]/10 bg-white text-[#041627] placeholder:text-[#44474c]/40 focus:outline-none focus:ring-2 focus:ring-[#fea520]/20 focus:border-[#fea520] transition-all resize-none shadow-inner"
            />
            <div className="flex items-center justify-between text-[10px] font-semibold text-[#44474c]/75 pl-0.5">
              <p>Mínimo 10 caracteres · Visibilidad para cliente.</p>
              <p className="tabular-nums font-bold">{notes.length}/2000</p>
            </div>
          </div>

          {/* Hallazgos (opcionales) */}
          <div className="space-y-2">
            <label
              htmlFor="findings"
              className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627]"
            >
              Hallazgos o recomendaciones (opcional)
            </label>
            <textarea
              id="findings"
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              rows={3}
              placeholder="Ej: Se observa desgaste menor en discos delanteros, recomiendo reemplazo en el próximo service."
              maxLength={2000}
              className="w-full px-3.5 py-3 text-sm rounded-xl border border-[#041627]/10 bg-white text-[#041627] placeholder:text-[#44474c]/40 focus:outline-none focus:ring-2 focus:ring-[#fea520]/20 focus:border-[#fea520] transition-all resize-none shadow-inner"
            />
            <p className="text-[10px] font-semibold text-[#44474c]/70 pl-0.5">
              Cosas secundarias encontradas ajenas a esta tarea asignada.
            </p>
          </div>

          {/* Fotos post-trabajo (opcional) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627]">
                Fotos del trabajo terminado
              </p>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#fea520] hover:underline cursor-pointer">
                + Agregar foto
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    if (files.length > 0) setPhotos((prev) => [...prev, ...files]);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            {photos.length === 0 ? (
              <p className="text-[10px] text-[#44474c]/60 italic">
                Sacá una foto del área después del trabajo. Sirve como &ldquo;después&rdquo; comparado con la foto que sacaste en la inspección.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((f, i) => (
                  <div key={`${f.name}-${i}`} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(f)}
                      alt={`Foto ${i + 1}`}
                      className="w-full aspect-square object-cover rounded-md border border-[#041627]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow"
                      aria-label="Quitar"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 p-3.5 animate-[fadeIn_0.2s_ease-out]">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-red-700">{error}</p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-[#041627]/5 px-5 py-4 flex gap-2 z-10">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider border border-[#041627]/10 text-[#041627] hover:bg-[#f4f6f8] active:scale-[0.98] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-700 hover:to-emerald-600 active:scale-[0.98] transition-all shadow-md shadow-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Finalizando..." : "Confirmar"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Skeletons / vacío ────────────────────────────────────────────────────────

function TaskSkeletons() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(2)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-[#041627]/5 shadow-sm p-4 space-y-3"
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
    <div className="flex flex-col items-center gap-3 py-16 px-4 text-center bg-white border border-[#041627]/10 rounded-2xl shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-[#eefcfd] flex items-center justify-center">
        <ClipboardList className="w-6 h-6 text-[#041627]" />
      </div>
      <p className="text-sm font-extrabold text-[#041627]">
        {showingHistory ? "Sin historial" : "No tenés trabajos asignados"}
      </p>
      <p className="text-xs text-[#44474c]/85 max-w-xs leading-relaxed">
        {showingHistory
          ? "Los servicios que finalices en el taller aparecerán listados acá."
          : "¡Al día! Cuando el administrador te asigne una nueva tarea de reparación o service, aparecerá acá al instante."}
      </p>
    </div>
  );
}
