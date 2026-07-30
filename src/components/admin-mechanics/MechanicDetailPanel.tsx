"use client";

import { useState } from "react";
import { X, Wrench, Mail, Phone, Eye, EyeOff, HardHat, Layers, Pencil } from "lucide-react";

import { DetailSheet } from "@/components/shared/DetailSheet";
import { AccessActions } from "@/components/shared/AccessActions";
import { formatDate } from "@/lib/format";
import { useUpdateMechanic } from "@/hooks/useAdminMechanics";
import { useAuthStore } from "@/store/auth.store";
import { Mechanic } from "@/types/api.types";

import { buildMechanicUpdate } from "./mechanic-form";
import { ActiveBadge, MechanicAvatar } from "./MechanicBadges";
import { EditMechanicAreasModal } from "./EditMechanicAreasModal";

interface Props {
  mechanic: Mechanic;
  onClose: () => void;
}

/**
 * Panel lateral con el detalle del mecánico seleccionado: contacto, áreas,
 * flag generalista, activar/desactivar y reset de contraseña.
 *
 * Cuando la fila es el propio perfil de ejecutante del admin, el panel cambia de tono:
 * desactivar deja de ser "dar de baja a un empleado" y pasa a ser "dejar de trabajar",
 * y se esconde el reset de contraseña — apunta al applicationUserId, que en esta fila
 * es el del propio admin, así que se estaría reseteando su propia clave de acceso.
 */
export function MechanicDetailPanel({ mechanic, onClose }: Props) {
  const [showToggle, setShowToggle]       = useState(false);
  const [showAreasEdit, setShowAreasEdit] = useState(false);
  const updateMechanic = useUpdateMechanic();

  const myUserId = useAuthStore((s) => s.userId);
  const isSelf   = !!myUserId && mechanic.applicationUserId === myUserId;

  function handleToggleActive() {
    updateMechanic.mutate(
      { id: mechanic.id, data: buildMechanicUpdate(mechanic, { isActive: !mechanic.isActive }) },
      { onSuccess: () => setShowToggle(false) }
    );
  }

  function handleToggleGeneralist() {
    updateMechanic.mutate({
      id: mechanic.id,
      data: buildMechanicUpdate(mechanic, { isGeneralist: !mechanic.isGeneralist }),
    });
  }

  return (
    <>
    {showAreasEdit && (
      <EditMechanicAreasModal
        mechanic={mechanic}
        onClose={() => setShowAreasEdit(false)}
      />
    )}
    <DetailSheet onClose={onClose}>
      {/* Header */}
      <div className="border-b border-[#c4c6cd]/60 px-5 py-4">
        <div className="flex items-start justify-between mb-4">
          <MechanicAvatar m={mechanic} size="lg" />
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#44474c] hover:bg-[#eefcfd] hover:text-[#041627] transition-colors"
            aria-label="Cerrar panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-base font-bold text-[#041627]">
          {mechanic.firstName} {mechanic.lastName}
        </h3>
        <p className="text-xs text-[#44474c] mt-0.5">
          Mecánico desde {formatDate(mechanic.createdAt)}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <ActiveBadge isActive={mechanic.isActive} />
          {isSelf && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#fea520]/15 border border-[#fea520]/40 text-[#865300]">
              <HardHat className="w-3 h-3" />
              Sos vos
            </span>
          )}
          {mechanic.isGeneralist && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#fea520]/15 border border-[#fea520]/40 text-[#865300]">
              <Layers className="w-3 h-3" />
              Generalista
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-[#041627]">
          <Mail className="w-4 h-4 text-[#44474c]/50 shrink-0" />
          <span className="truncate">{mechanic.email}</span>
        </div>

        {mechanic.phone && (
          <div className="flex items-center gap-2 text-sm text-[#041627]">
            <Phone className="w-4 h-4 text-[#44474c]/50 shrink-0" />
            <span>{mechanic.phone}</span>
          </div>
        )}

        {mechanic.specialty && (
          <div className="flex items-center gap-2 text-sm text-[#041627]">
            <Wrench className="w-4 h-4 text-[#44474c]/50 shrink-0" />
            <span>{mechanic.specialty}</span>
          </div>
        )}
      </div>

      {/* Áreas asignadas */}
      <div className="border-t border-[#c4c6cd]/60 px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">
            <Layers className="w-3 h-3" />
            Áreas
          </div>
          <button
            onClick={() => setShowAreasEdit(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest text-[#041627] bg-[#fea520]/15 border border-[#fea520]/40 hover:bg-[#fea520]/25 transition-colors"
          >
            <Pencil className="w-3 h-3" />
            Editar áreas
          </button>
        </div>
        {mechanic.areas && mechanic.areas.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {mechanic.areas.map((area) => (
              <span
                key={area.id}
                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#eefcfd] border border-[#c4c6cd] text-[#041627]"
              >
                {area.name}
              </span>
            ))}
          </div>
        ) : (
          <button
            onClick={() => setShowAreasEdit(true)}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-[#fea520]/50 text-[11px] font-bold text-[#041627]/70 hover:bg-[#fea520]/10 hover:text-[#041627] transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            Asignar áreas
          </button>
        )}
      </div>

      {/* Generalista (trabaja en todas las áreas) */}
      <div className="border-t border-[#c4c6cd]/60 px-5 py-4">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={mechanic.isGeneralist}
            onChange={handleToggleGeneralist}
            disabled={updateMechanic.isPending}
            className="mt-0.5 accent-[#fea520] w-4 h-4 disabled:opacity-50"
          />
          <span>
            <span className="block text-xs font-bold text-[#041627]">Mecánico generalista</span>
            <span className="block text-[10px] text-[#44474c]/70 mt-0.5">
              Reporta y trabaja en <strong>todas las áreas</strong> activas, sin asignación previa.
            </span>
          </span>
        </label>
      </div>

      {/* Footer: toggle activo/inactivo */}
      <div className="border-t border-[#c4c6cd]/60 px-5 py-4">
        {showToggle ? (
          <div className="space-y-2">
            <p className="text-xs text-[#44474c]">
              {isSelf ? (
                mechanic.isActive ? (
                  <>
                    ¿Dejar de trabajar como mecánico? Vas a perder los botones para tomar y
                    hacer trabajos. Tu acceso de admin no cambia, y podés volver a activarlo
                    cuando quieras.
                  </>
                ) : (
                  <>¿Volver a trabajar como mecánico?</>
                )
              ) : (
                <>
                  ¿Confirmar {mechanic.isActive ? "desactivar" : "activar"} a{" "}
                  <strong>{mechanic.firstName}</strong>?
                </>
              )}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleToggleActive}
                disabled={updateMechanic.isPending}
                className={`flex-1 py-2 rounded-md text-xs font-bold transition-colors disabled:opacity-50 ${
                  mechanic.isActive
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {updateMechanic.isPending ? "Guardando..." : "Confirmar"}
              </button>
              <button
                onClick={() => setShowToggle(false)}
                className="flex-1 py-2 rounded-md text-xs font-bold bg-[#eefcfd] text-[#041627] border border-[#c4c6cd] hover:bg-[#c4c6cd]/30 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowToggle(true)}
            className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-bold transition-colors ${
              mechanic.isActive
                ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                : "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
            }`}
          >
            {mechanic.isActive ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                {isSelf ? "Dejar de trabajar como mecánico" : "Desactivar mecánico"}
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                {isSelf ? "Volver a trabajar como mecánico" : "Reactivar mecánico"}
              </>
            )}
          </button>
        )}
      </div>

      {/* Reset de contraseña — nunca sobre uno mismo: este botón apunta al
          applicationUserId, así que en la fila propia le volaría la clave con la
          que el admin entra al sistema. Para su propia clave está Configuración. */}
      {!isSelf && (
        <div className="border-t border-[#c4c6cd]/60 px-5 py-4">
          <AccessActions
            applicationUserId={mechanic.applicationUserId}
            userDisplayName={`${mechanic.firstName} ${mechanic.lastName}`}
            firstName={mechanic.firstName}
            email={mechanic.email}
            phone={mechanic.phone}
            audience="staff"
            variant="compact"
          />
        </div>
      )}
    </DetailSheet>
    </>
  );
}
