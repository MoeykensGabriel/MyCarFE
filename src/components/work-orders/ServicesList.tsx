"use client";

import { useState } from "react";
import { CheckCircle2, Clock, HardHat, Lock, PlayCircle, X } from "lucide-react";

import { WorkOrderService } from "@/types/api.types";
import { formatCurrency, formatDateTime } from "@/lib/format";
// totalAmount: prop deprecada — el total global de la WO vive en el footer de la página
// porque ahora incluye servicios + repuestos. Lo dejamos en la signature para no romper
// llamadores, pero ya no se renderiza acá.
import {
  AssignmentStatusLabel,
  QuoteItemApprovalStatus,
  QuoteItemApprovalStatusLabel,
  UserRole,
  WorkOrderServiceAssignmentStatus,
  WorkOrderStatus,
} from "@/lib/enums";
import {
  useAcceptServiceAsAdmin,
  useClaimServiceAsAdmin,
  useCompleteServiceAsAdmin,
  useCompleteServiceAsWorkshop,
  useRemoveWorkOrderService,
  useUpdateWorkOrderServicePrice,
} from "@/hooks/useWorkOrders";
import { useAuthStore } from "@/store/auth.store";
import { MechanicAssignSelect } from "@/components/work-orders/MechanicAssignSelect";
import { CopyRowButton } from "@/components/shared/CopyRowButton";
import { serviceToRow } from "@/lib/quote-copy";

interface ServicesListProps {
  workOrderId: string;
  services: WorkOrderService[];
  /** @deprecated El total global ahora se renderiza fuera (incluye servicios + repuestos). */
  totalAmount?: number;
  /** Si true, permite quitar servicios (solo en Diagnosing). */
  editable?: boolean;
  /** Si true, muestra un botón para copiar cada ítem (vista final/aprobada). */
  copyable?: boolean;
  /** Estado actual de la WO. Determina si la asignación de mecánicos es editable. */
  workOrderStatus?: WorkOrderStatus;
}

export function ServicesList({
  workOrderId,
  services,
  editable = false,
  copyable = false,
  workOrderStatus,
}: ServicesListProps) {
  const { mutate: removeService, isPending } = useRemoveWorkOrderService(workOrderId);

  // Asignación de mecánicos: bloqueada solo en estados terminales de la WO.
  // En Diagnosing, AwaitingApproval e InProgress el admin puede asignar/reasignar.
  const isWoTerminal =
    workOrderStatus === WorkOrderStatus.Completed ||
    workOrderStatus === WorkOrderStatus.Delivered ||
    workOrderStatus === WorkOrderStatus.Cancelled;
  const canAssignMechanic = workOrderStatus !== undefined && !isWoTerminal;

  // El admin que habilitó su perfil de ejecutante puede hacer los trabajos él mismo,
  // desde acá mismo. Sin perfil (mechanicId null) no ve ninguno de esos botones.
  const role         = useAuthStore((s) => s.role);
  const myMechanicId = useAuthStore((s) => s.mechanicId);
  const canExecute   = role === UserRole.Admin && !!myMechanicId;
  const isWoInProgress = workOrderStatus === WorkOrderStatus.InProgress;

  if (!services.length) {
    return (
      <p className="text-sm text-muted-foreground">
        {editable
          ? "Aún no hay servicios. Agregá los que correspondan al diagnóstico."
          : "Sin servicios registrados."}
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {services.map((s) => (
        <ServiceRow
          key={s.id}
          workOrderId={workOrderId}
          service={s}
          editable={editable}
          copyable={copyable}
          canAssignMechanic={canAssignMechanic}
          canAct={canExecute && isWoInProgress}
          myMechanicId={myMechanicId}
          onRemove={() => removeService(s.id)}
          removing={isPending}
        />
      ))}

    </div>
  );
}

// ─── Fila de servicio ─────────────────────────────────────────────────────────

function ServiceRow({
  workOrderId,
  service: s,
  editable,
  copyable,
  canAssignMechanic,
  canAct,
  myMechanicId,
  onRemove,
  removing,
}: {
  workOrderId: string;
  service: WorkOrderService;
  editable: boolean;
  copyable: boolean;
  canAssignMechanic: boolean;
  /** El usuario puede ejecutar trabajos y la orden está en progreso. */
  canAct: boolean;
  /** Perfil de ejecutante del usuario logueado, si tiene. */
  myMechanicId: string | null;
  onRemove: () => void;
  removing: boolean;
}) {
  const status = s.assignmentStatus ?? WorkOrderServiceAssignmentStatus.Unassigned;
  const isMine = !!myMechanicId && s.assignedMechanicId === myMechanicId;

  return (
    <div className="py-3 border-b last:border-0">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{s.nameSnapshot}</p>
          {s.descriptionSnapshot && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {s.descriptionSnapshot}
            </p>
          )}
          {s.quantity > 1 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {s.quantity} × {formatCurrency(s.priceSnapshot)}
            </p>
          )}

          {/* Asignación + estado + aprobación */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <AssignmentBadge status={status} />
            {isMine && status !== WorkOrderServiceAssignmentStatus.Completed && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-[#fea520]/15 border-[#fea520]/40 text-[#865300]"
                title="Este trabajo lo tomaste vos"
              >
                <HardHat className="w-3 h-3" />
                Lo hago yo
              </span>
            )}
            {s.approvalStatus !== undefined && (
              <ApprovalBadge status={s.approvalStatus} />
            )}
            {s.frozenAt && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200"
                title="Congelado al enviar el presupuesto"
              >
                <Lock className="w-2.5 h-2.5" />
                Congelado
              </span>
            )}
            <MechanicAssignSelect
              workOrderId={workOrderId}
              workOrderServiceId={s.id}
              assignedMechanicId={s.assignedMechanicId}
              assignedMechanicName={s.assignedMechanicName}
              assignmentStatus={status}
              readOnly={!canAssignMechanic}
            />
          </div>

          {/* ── Lo hago yo: el admin ejecuta el trabajo con sus propias manos ──
              Las condiciones espejan las precondiciones del backend, así que ningún
              botón visible puede terminar en un rechazo del server. */}
          {canAct && status === WorkOrderServiceAssignmentStatus.Unassigned &&
            s.approvalStatus === QuoteItemApprovalStatus.Approved && (
              <SelfClaimButton workOrderId={workOrderId} workOrderServiceId={s.id} />
            )}

          {canAct && isMine && status === WorkOrderServiceAssignmentStatus.Pending && (
            <SelfAcceptButton workOrderId={workOrderId} workOrderServiceId={s.id} />
          )}

          {canAct && isMine && status === WorkOrderServiceAssignmentStatus.Accepted && (
            <SelfCompleteControl workOrderId={workOrderId} workOrderServiceId={s.id} />
          )}

          {/* Trabajo de OTRO: la oficina lo finaliza en nombre del taller cuando el
              mecánico no va a continuar — tanto si lo tenía en curso (Accepted) como
              si lo tomó y nunca arrancó (Pending), que si no traba la orden entera.
              Liberar ya lo cubre la X de la asignación. */}
          {canAssignMechanic && !isMine &&
            (status === WorkOrderServiceAssignmentStatus.Accepted ||
             status === WorkOrderServiceAssignmentStatus.Pending) && (
              <WorkshopCompleteControl workOrderId={workOrderId} workOrderServiceId={s.id} />
            )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {editable && !s.frozenAt ? (
            <ServicePriceInput workOrderId={workOrderId} service={s} />
          ) : (
            <span
              className={`text-sm font-medium tabular-nums ${
                s.approvalStatus === QuoteItemApprovalStatus.Rejected
                  ? "text-gray-400 line-through"
                  : "text-gray-900"
              }`}
            >
              {formatCurrency(s.subtotal)}
            </span>
          )}
          {editable && (
            <button
              onClick={onRemove}
              disabled={removing}
              className="tap-target text-muted-foreground hover:text-red-500 disabled:opacity-40 transition-colors"
              title="Quitar servicio"
              aria-label="Quitar servicio"
            >
              <X className="w-5 h-5 sm:w-4 sm:h-4" />
            </button>
          )}
          {copyable && <CopyRowButton text={serviceToRow(s)} label="servicio" />}
        </div>
      </div>

      {/* Notas del mecánico cuando finalizó */}
      {status === WorkOrderServiceAssignmentStatus.Completed && s.mechanicNotes && (
        <div className="mt-2 ml-0 space-y-1.5">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/80">
              Lo que hizo el mecánico
            </p>
            <p className="text-xs text-emerald-900 mt-0.5 whitespace-pre-wrap leading-relaxed">
              {s.mechanicNotes}
            </p>
          </div>
          {s.mechanicFindings && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700/80">
                Novedades / recomendaciones
              </p>
              <p className="text-xs text-blue-900 mt-0.5 whitespace-pre-wrap leading-relaxed">
                {s.mechanicFindings}
              </p>
            </div>
          )}
          {s.completedAt && (
            <p className="text-[10px] text-gray-500 pl-1">
              Finalizado el {formatDateTime(s.completedAt)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── El admin ejecuta el trabajo ──────────────────────────────────────────────
// Mismo ciclo que el mecánico (tomar → iniciar → finalizar), pero desde la ficha de
// la orden en vez del panel /mechanic. Pegan a los mismos endpoints, así que el
// trabajo queda a nombre del admin en el historial y en el dashboard.

function SelfClaimButton({
  workOrderId,
  workOrderServiceId,
}: {
  workOrderId: string;
  workOrderServiceId: string;
}) {
  const { mutate, isPending } = useClaimServiceAsAdmin(workOrderId);

  return (
    <button
      type="button"
      onClick={() => mutate(workOrderServiceId)}
      disabled={isPending}
      className="mt-2 inline-flex items-center gap-1.5 px-3 py-2.5 sm:px-2 sm:py-1 rounded-md border border-[#fea520]/50 bg-[#fea520]/15 text-[#865300] text-xs sm:text-[11px] font-semibold hover:bg-[#fea520]/25 transition-colors disabled:opacity-40"
      title="Tomar este trabajo para hacerlo vos"
    >
      <HardHat className="w-4 h-4 sm:w-3 sm:h-3" />
      {isPending ? "Tomando..." : "Tomar yo"}
    </button>
  );
}

function SelfAcceptButton({
  workOrderId,
  workOrderServiceId,
}: {
  workOrderId: string;
  workOrderServiceId: string;
}) {
  const { mutate, isPending } = useAcceptServiceAsAdmin(workOrderId);

  return (
    <button
      type="button"
      onClick={() => mutate(workOrderServiceId)}
      disabled={isPending}
      className="mt-2 inline-flex items-center gap-1.5 px-3 py-2.5 sm:px-2 sm:py-1 rounded-md border border-blue-300 bg-blue-50 text-blue-800 text-xs sm:text-[11px] font-semibold hover:bg-blue-100 transition-colors disabled:opacity-40"
      title="Empezar a trabajar en esta tarea"
    >
      <PlayCircle className="w-4 h-4 sm:w-3 sm:h-3" />
      {isPending ? "Iniciando..." : "Iniciar trabajo"}
    </button>
  );
}

/**
 * Cierre del trabajo propio. Va por /complete (no complete-as-workshop) porque es la
 * única vía que guarda los hallazgos además de las notas.
 */
function SelfCompleteControl({
  workOrderId,
  workOrderServiceId,
}: {
  workOrderId: string;
  workOrderServiceId: string;
}) {
  const [open, setOpen]         = useState(false);
  const [notes, setNotes]       = useState("");
  const [findings, setFindings] = useState("");
  const { mutate, isPending } = useCompleteServiceAsAdmin(workOrderId);

  const canConfirm = notes.trim().length >= 10 && !isPending;

  function close() {
    setOpen(false);
    setNotes("");
    setFindings("");
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex items-center gap-1.5 px-3 py-2.5 sm:px-2 sm:py-1 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs sm:text-[11px] font-semibold hover:bg-emerald-100 transition-colors"
        title="Marcar tu trabajo como terminado"
      >
        <CheckCircle2 className="w-4 h-4 sm:w-3 sm:h-3" />
        Finalizar trabajo
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5 space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-800">
        Finalizar tu trabajo
      </p>

      <div className="space-y-1">
        <textarea
          rows={3}
          autoFocus
          placeholder="¿Qué tareas realizaste? (mín. 10 caracteres — lo ve el cliente)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={2000}
          className="w-full px-2.5 py-1.5 text-xs rounded-md border border-emerald-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none"
        />
        <p className="text-[10px] text-emerald-800/70 text-right tabular-nums">
          {notes.length}/2000
        </p>
      </div>

      <textarea
        rows={2}
        placeholder="Novedades o recomendaciones (opcional): cosas que viste ajenas a esta tarea..."
        value={findings}
        onChange={(e) => setFindings(e.target.value)}
        maxLength={2000}
        className="w-full px-2.5 py-1.5 text-xs rounded-md border border-emerald-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none"
      />

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={close}
          disabled={isPending}
          className="px-3 py-2.5 sm:px-2.5 sm:py-1 rounded-md text-xs sm:text-[11px] font-semibold text-gray-600 border border-gray-300 hover:bg-white transition-colors disabled:opacity-40"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() =>
            mutate(
              {
                workOrderServiceId,
                notes: notes.trim(),
                findings: findings.trim() || undefined,
              },
              { onSuccess: close },
            )
          }
          disabled={!canConfirm}
          className="inline-flex items-center gap-1 px-3 py-2.5 sm:px-2.5 sm:py-1 rounded-md text-xs sm:text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-40"
        >
          <CheckCircle2 className="w-3 h-3" />
          {isPending ? "Finalizando..." : "Confirmar"}
        </button>
      </div>
    </div>
  );
}

// ─── Finalizar por taller ─────────────────────────────────────────────────────
// Para trabajos de OTRO mecánico que no va a continuar: admin/oficina los cierra en
// nombre del taller con una nota obligatoria (queda en el historial). Vale tanto si
// el trabajo estaba en curso como si quedó tomado sin arrancar.

function WorkshopCompleteControl({
  workOrderId,
  workOrderServiceId,
}: {
  workOrderId: string;
  workOrderServiceId: string;
}) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const { mutate, isPending } = useCompleteServiceAsWorkshop(workOrderId);

  const canConfirm = notes.trim().length >= 10 && !isPending;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex items-center gap-1.5 px-3 py-2.5 sm:px-2 sm:py-1 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs sm:text-[11px] font-semibold hover:bg-emerald-100 transition-colors"
        title="Cerrar el trabajo en nombre del taller cuando su mecánico no va a continuar"
      >
        <CheckCircle2 className="w-4 h-4 sm:w-3 sm:h-3" />
        Finalizar por taller
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5 space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-800">
        Finalizar en nombre del taller
      </p>
      <textarea
        rows={2}
        autoFocus
        placeholder="Qué se hizo, o por qué lo cierra la oficina si el mecánico no llegó a hacerlo (mín. 10 caracteres)..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        maxLength={2000}
        className="w-full px-2.5 py-1.5 text-xs rounded-md border border-emerald-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none"
      />
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => { setOpen(false); setNotes(""); }}
          disabled={isPending}
          className="px-3 py-2.5 sm:px-2.5 sm:py-1 rounded-md text-xs sm:text-[11px] font-semibold text-gray-600 border border-gray-300 hover:bg-white transition-colors disabled:opacity-40"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() =>
            mutate(
              { workOrderServiceId, notes: notes.trim() },
              { onSuccess: () => { setOpen(false); setNotes(""); } },
            )
          }
          disabled={!canConfirm}
          className="inline-flex items-center gap-1 px-3 py-2.5 sm:px-2.5 sm:py-1 rounded-md text-xs sm:text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-40"
        >
          <CheckCircle2 className="w-3 h-3" />
          {isPending ? "Finalizando..." : "Confirmar"}
        </button>
      </div>
    </div>
  );
}

// ─── Precio editable inline ───────────────────────────────────────────────────
// Edita el precio de venta del servicio (por unidad). Guarda al salir/Enter.

function ServicePriceInput({
  workOrderId,
  service,
}: {
  workOrderId: string;
  service: WorkOrderService;
}) {
  const { mutate, isPending } = useUpdateWorkOrderServicePrice(workOrderId);
  const [value, setValue] = useState(String(service.priceSnapshot));

  function save() {
    const price = parseFloat(value);
    if (isNaN(price) || price < 0 || price === service.priceSnapshot) {
      setValue(String(service.priceSnapshot));
      return;
    }
    mutate({ serviceId: service.id, price });
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted-foreground">$</span>
      <input
        type="number"
        min={0}
        step={0.01}
        value={value}
        disabled={isPending}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        className="w-24 px-2 py-1 text-sm text-right rounded border border-[#c4c6cd] focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] tabular-nums disabled:opacity-50"
      />
    </div>
  );
}

// ─── Badge de asignación ──────────────────────────────────────────────────────

function AssignmentBadge({ status }: { status: WorkOrderServiceAssignmentStatus }) {
  const config = {
    [WorkOrderServiceAssignmentStatus.Unassigned]: {
      icon: <Clock className="w-3 h-3" />,
      cls: "bg-gray-100 text-gray-600 border-gray-200",
    },
    [WorkOrderServiceAssignmentStatus.Pending]: {
      icon: <Clock className="w-3 h-3" />,
      cls: "bg-amber-50 text-amber-700 border-amber-200",
    },
    [WorkOrderServiceAssignmentStatus.Accepted]: {
      icon: <PlayCircle className="w-3 h-3" />,
      cls: "bg-blue-50 text-blue-700 border-blue-200",
    },
    [WorkOrderServiceAssignmentStatus.Completed]: {
      icon: <CheckCircle2 className="w-3 h-3" />,
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${config.cls}`}
    >
      {config.icon}
      {AssignmentStatusLabel[status]}
    </span>
  );
}

// ─── Badge de aprobación item-by-item ─────────────────────────────────────────

function ApprovalBadge({ status }: { status: QuoteItemApprovalStatus }) {
  if (status === QuoteItemApprovalStatus.Pending) return null;
  const cls =
    status === QuoteItemApprovalStatus.Approved
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-red-50 text-red-700 border-red-200";
  return (
    <span
      className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${cls}`}
    >
      {QuoteItemApprovalStatusLabel[status]}
    </span>
  );
}
