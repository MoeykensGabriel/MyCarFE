"use client";

import { useState } from "react";
import {
  Plus,
  X,
  Check,
  AlertCircle,
  BadgeCheck,
  BadgeX,
  Pencil,
  EyeOff,
  Eye,
  Layers,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";

import { PageHeader } from "@/components/shared/PageHeader";
import {
  useAreas,
  useCreateArea,
  useUpdateArea,
  useDeleteArea,
} from "@/hooks/useAreas";
import { Area, ProblemDetails } from "@/types/api.types";

// ─── Schema ───────────────────────────────────────────────────────────────────

const areaSchema = z.object({
  name: z.string().min(1, "Ingresá el nombre del área").max(100, "Máximo 100 caracteres"),
});

type AreaForm = z.infer<typeof areaSchema>;

// ─── Active Badge ─────────────────────────────────────────────────────────────

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-50 border border-green-200 text-green-700">
      <BadgeCheck className="w-3 h-3" />
      Activa
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 border border-red-200 text-red-600">
      <BadgeX className="w-3 h-3" />
      Inactiva
    </span>
  );
}

// ─── Create / Edit Modal ──────────────────────────────────────────────────────

function AreaFormModal({
  area,
  onClose,
}: {
  area?: Area;
  onClose: () => void;
}) {
  const createArea = useCreateArea();
  const updateArea = useUpdateArea();
  const [serverError, setServerError] = useState<string | null>(null);

  const isEdit = !!area;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AreaForm>({
    resolver: zodResolver(areaSchema),
    defaultValues: { name: area?.name ?? "" },
  });

  const onSubmit = async (data: AreaForm) => {
    setServerError(null);

    const onError = (err: unknown) => {
      const axiosErr = err as AxiosError<ProblemDetails>;
      const detail = axiosErr.response?.data?.detail;
      const title = axiosErr.response?.data?.title;
      setServerError(detail ?? title ?? "Error al guardar el área");
    };

    if (isEdit) {
      updateArea.mutate(
        {
          id: area!.id,
          data: { id: area!.id, name: data.name, isActive: area!.isActive },
        },
        { onSuccess: () => onClose(), onError },
      );
    } else {
      createArea.mutate(
        { name: data.name },
        { onSuccess: () => onClose(), onError },
      );
    }
  };

  const pending = createArea.isPending || updateArea.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#c4c6cd]/60">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#fea520]" />
            <h2 className="text-base font-bold text-[#041627]">
              {isEdit ? "Editar área" : "Nueva área"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#44474c] hover:bg-[#eefcfd] transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4" noValidate>
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[#041627]">
              Nombre
            </label>
            <input
              type="text"
              placeholder="Ej: Motor, Frenos, Tren delantero"
              className={`w-full px-3 py-2.5 text-sm rounded-xl border bg-white text-[#041627] placeholder:text-[#44474c]/40 focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all ${
                errors.name ? "border-red-400 focus:ring-red-200" : "border-[#c4c6cd]"
              }`}
              autoFocus
              {...register("name")}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          {serverError && (
            <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{serverError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || pending}
            className="w-full py-3 rounded-xl text-sm font-bold bg-[#fea520] text-[#041627] hover:bg-[#e8951d] active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear área"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

type ActiveFilter = "all" | "active" | "inactive";

const ACTIVE_TABS: { key: ActiveFilter; label: string }[] = [
  { key: "all",      label: "Todas"    },
  { key: "active",   label: "Activas"  },
  { key: "inactive", label: "Inactivas" },
];

export default function AreasPage() {
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [editing, setEditing]           = useState<Area | null>(null);
  const [showCreate, setShowCreate]     = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  // Pedimos siempre includeInactive=true para tener todas en memoria y filtrar localmente
  const { data, isLoading, isError } = useAreas(true);
  const updateArea = useUpdateArea();
  const deleteArea = useDeleteArea();

  const all = data ?? [];
  const items =
    activeFilter === "active"   ? all.filter((a) => a.isActive)
    : activeFilter === "inactive" ? all.filter((a) => !a.isActive)
    : all;

  function handleToggleActive(area: Area) {
    updateArea.mutate({
      id: area.id,
      data: { id: area.id, name: area.name, isActive: !area.isActive },
    });
  }

  function handleDelete(id: string) {
    deleteArea.mutate(id, { onSettled: () => setConfirmingDelete(null) });
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader
        title="Áreas del taller"
        subtitle="Cada mecánico puede tener una o varias áreas. Durante la inspección colectiva, cada área debe reportar."
        Icon={Layers}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-white border border-[#c4c6cd] p-1 rounded-lg gap-0.5">
              {ACTIVE_TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    activeFilter === key
                      ? "bg-[#041627] text-white"
                      : "text-[#44474c] hover:bg-[#eefcfd]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#fea520] text-[#041627] text-sm font-bold rounded-lg hover:bg-[#865300] hover:text-white shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Nueva área
            </button>
          </div>
        }
      />

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-[#c4c6cd]/40">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="h-4 w-48 bg-[#c4c6cd]/30 rounded animate-pulse" />
                <div className="ml-auto h-5 w-16 bg-[#c4c6cd]/20 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <p className="px-6 py-8 text-sm text-red-500 text-center">Error al cargar las áreas.</p>
        ) : items.length === 0 ? (
          <p className="px-6 py-8 text-sm text-[#44474c] text-center">No hay áreas registradas.</p>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_120px_160px] gap-4 px-6 py-3 bg-[#eefcfd] border-b border-[#c4c6cd]/60">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Nombre</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Estado</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70 text-right">Acciones</p>
            </div>

            <div className="divide-y divide-[#c4c6cd]/40">
              {items.map((area) => (
                <div
                  key={area.id}
                  className="grid grid-cols-[1fr_120px_160px] gap-4 px-6 py-3 items-center"
                >
                  <span className="text-sm font-medium text-[#041627] truncate">{area.name}</span>
                  <ActiveBadge isActive={area.isActive} />
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={() => setEditing(area)}
                      title="Editar"
                      className="p-1.5 rounded-md text-[#44474c] hover:bg-[#eefcfd] hover:text-[#041627] transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(area)}
                      disabled={updateArea.isPending}
                      title={area.isActive ? "Desactivar" : "Reactivar"}
                      className={`p-1.5 rounded-md transition-colors disabled:opacity-50 ${
                        area.isActive
                          ? "text-red-600 hover:bg-red-50"
                          : "text-green-700 hover:bg-green-50"
                      }`}
                    >
                      {area.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {area.isActive && (
                      confirmingDelete === area.id ? (
                        <div className="flex items-center gap-1 pl-2 border-l border-[#c4c6cd]">
                          <button
                            onClick={() => handleDelete(area.id)}
                            disabled={deleteArea.isPending}
                            className="px-2 py-1 text-[10px] font-bold rounded bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setConfirmingDelete(null)}
                            className="px-2 py-1 text-[10px] font-bold rounded bg-[#eefcfd] text-[#041627] border border-[#c4c6cd]"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-3 bg-[#eefcfd]/60 border-t border-[#c4c6cd]/60">
              <p className="text-xs text-[#44474c]/70">
                {items.length} de {all.length} {all.length === 1 ? "área" : "áreas"}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Modal crear */}
      {showCreate && <AreaFormModal onClose={() => setShowCreate(false)} />}

      {/* Modal editar */}
      {editing && <AreaFormModal area={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
