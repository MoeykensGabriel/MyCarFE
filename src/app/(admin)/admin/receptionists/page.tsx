"use client";

import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import {
  UserRoundPlus,
  X,
  Check,
  ConciergeBell,
  AlertCircle,
  Mail,
  BadgeCheck,
  BadgeX,
  Eye,
  EyeOff,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";

import { PageHeader } from "@/components/shared/PageHeader";
import { Pagination } from "@/components/shared/Pagination";
import { ResetPasswordButton } from "@/components/shared/ResetPasswordButton";
import { SearchInput } from "@/components/shared/SearchInput";
import { formatDate } from "@/lib/format";
import {
  useAdminReceptionists,
  useCreateReceptionist,
  useUpdateReceptionist,
} from "@/hooks/useAdminReceptionists";
import { Receptionist, ProblemDetails } from "@/types/api.types";

const receptionistSchema = z.object({
  firstName: z.string().min(1, "Ingresá el nombre"),
  lastName:  z.string().min(1, "Ingresá el apellido"),
  email:     z.string().min(1, "Ingresá el email").email("Ingresá un email válido. Ej: nombre@empresa.com"),
});

type ReceptionistForm = z.infer<typeof receptionistSchema>;

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-50 border border-green-200 text-green-700">
      <BadgeCheck className="w-3 h-3" />
      Activo
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 border border-red-200 text-red-600">
      <BadgeX className="w-3 h-3" />
      Inactivo
    </span>
  );
}

function ReceptionistAvatar({ r, size = "md" }: { r: Receptionist; size?: "sm" | "md" | "lg" }) {
  const initials = `${r.firstName[0] ?? ""}${r.lastName[0] ?? ""}`.toUpperCase();
  const sz =
    size === "lg" ? "w-16 h-16 text-xl"
    : size === "sm" ? "w-8 h-8 text-xs"
    : "w-10 h-10 text-sm";

  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-bold shrink-0 bg-[#041627] text-white`}>
      {initials}
    </div>
  );
}

function DetailPanel({
  receptionist,
  onClose,
}: {
  receptionist: Receptionist;
  onClose: () => void;
}) {
  const [showToggle, setShowToggle] = useState(false);
  const updateReceptionist = useUpdateReceptionist();

  function handleToggleActive() {
    updateReceptionist.mutate(
      {
        id: receptionist.id,
        data: {
          id:        receptionist.id,
          firstName: receptionist.firstName,
          lastName:  receptionist.lastName,
          isActive:  !receptionist.isActive,
        },
      },
      { onSuccess: () => setShowToggle(false) }
    );
  }

  return (
    <aside className="w-full lg:w-80 shrink-0 bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden flex flex-col self-start lg:sticky lg:top-0">
      <div className="border-b border-[#c4c6cd]/60 px-5 py-4">
        <div className="flex items-start justify-between mb-4">
          <ReceptionistAvatar r={receptionist} size="lg" />
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#44474c] hover:bg-[#eefcfd] hover:text-[#041627] transition-colors"
            aria-label="Cerrar panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-base font-bold text-[#041627]">
          {receptionist.firstName} {receptionist.lastName}
        </h3>
        <p className="text-xs text-[#44474c] mt-0.5">
          Recepcionista desde {formatDate(receptionist.createdAt)}
        </p>

        <div className="mt-3">
          <ActiveBadge isActive={receptionist.isActive} />
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-[#041627]">
          <Mail className="w-4 h-4 text-[#44474c]/50 shrink-0" />
          <span className="truncate">{receptionist.email}</span>
        </div>
      </div>

      <div className="border-t border-[#c4c6cd]/60 px-5 py-4">
        {showToggle ? (
          <div className="space-y-2">
            <p className="text-xs text-[#44474c]">
              ¿Confirmar {receptionist.isActive ? "desactivar" : "activar"} a{" "}
              <strong>{receptionist.firstName}</strong>?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleToggleActive}
                disabled={updateReceptionist.isPending}
                className={`flex-1 py-2 rounded-md text-xs font-bold transition-colors disabled:opacity-50 ${
                  receptionist.isActive
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {updateReceptionist.isPending ? "Guardando..." : "Confirmar"}
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
              receptionist.isActive
                ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                : "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
            }`}
          >
            {receptionist.isActive ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                Desactivar recepcionista
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                Reactivar recepcionista
              </>
            )}
          </button>
        )}
      </div>

      <div className="border-t border-[#c4c6cd]/60 px-5 py-4">
        <ResetPasswordButton
          applicationUserId={receptionist.applicationUserId}
          userDisplayName={`${receptionist.firstName} ${receptionist.lastName}`}
          variant="compact"
        />
      </div>
    </aside>
  );
}

function CreateReceptionistModal({ onClose }: { onClose: () => void }) {
  const createReceptionist = useCreateReceptionist();
  const [serverError, setServerError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReceptionistForm>({ resolver: zodResolver(receptionistSchema) });

  const onSubmit = async (data: ReceptionistForm) => {
    setServerError(null);
    createReceptionist.mutate(data, {
      onSuccess: (res) => {
        setTempPassword(res.tempPassword);
      },
      onError: (err) => {
        const axiosErr = err as AxiosError<ProblemDetails>;
        const detail = axiosErr.response?.data?.detail;
        const title = axiosErr.response?.data?.title;
        setServerError(detail ?? title ?? "Error al crear el recepcionista");
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#c4c6cd]/60">
          <div className="flex items-center gap-2">
            <ConciergeBell className="w-4 h-4 text-[#fea520]" />
            <h2 className="text-base font-bold text-[#041627]">Nuevo recepcionista</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#44474c] hover:bg-[#eefcfd] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          {tempPassword ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                <p className="text-sm font-semibold">Recepcionista creado exitosamente</p>
              </div>
              <div className="rounded-xl border border-[#c4c6cd] bg-[#eefcfd] px-4 py-3 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">
                  Contraseña temporal
                </p>
                <p className="text-lg font-mono font-bold text-[#041627] tracking-widest">
                  {tempPassword}
                </p>
                <p className="text-xs text-[#44474c]/70">
                  Compartila con el recepcionista. Deberá cambiarla en su primer acceso.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-sm font-bold bg-[#fea520] text-[#041627] hover:bg-[#e8951d] transition-all"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-[#041627]">Nombre</label>
                  <input
                    type="text"
                    placeholder="Ana"
                    className={`w-full px-3 py-2.5 text-sm rounded-xl border bg-white text-[#041627] placeholder:text-[#44474c]/40 focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all ${
                      errors.firstName ? "border-red-400 focus:ring-red-200" : "border-[#c4c6cd]"
                    }`}
                    {...register("firstName")}
                  />
                  {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-[#041627]">Apellido</label>
                  <input
                    type="text"
                    placeholder="López"
                    className={`w-full px-3 py-2.5 text-sm rounded-xl border bg-white text-[#041627] placeholder:text-[#44474c]/40 focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all ${
                      errors.lastName ? "border-red-400 focus:ring-red-200" : "border-[#c4c6cd]"
                    }`}
                    {...register("lastName")}
                  />
                  {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[#041627]">Email</label>
                <input
                  type="email"
                  placeholder="recepcion@taller.com"
                  className={`w-full px-3 py-2.5 text-sm rounded-xl border bg-white text-[#041627] placeholder:text-[#44474c]/40 focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all ${
                    errors.email ? "border-red-400 focus:ring-red-200" : "border-[#c4c6cd]"
                  }`}
                  {...register("email")}
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              {serverError && (
                <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{serverError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || createReceptionist.isPending}
                className="w-full py-3 rounded-xl text-sm font-bold bg-[#fea520] text-[#041627] hover:bg-[#e8951d] active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createReceptionist.isPending ? "Creando..." : "Crear recepcionista"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

type ActiveFilter = "all" | "active" | "inactive";

const ACTIVE_TABS: { key: ActiveFilter; label: string }[] = [
  { key: "all",      label: "Todos"    },
  { key: "active",   label: "Activos"  },
  { key: "inactive", label: "Inactivos" },
];

export default function ReceptionistsPage() {
  const [page,         setPage]         = useState(1);
  const [search,       setSearch]       = useState<string | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [selectedId,   setSelectedId]   = useState<string | null>(null);
  const [showCreate,   setShowCreate]   = useState(false);

  const includeInactive = activeFilter !== "active";

  const { data, isLoading, isError } = useAdminReceptionists({
    page,
    pageSize: 20,
    search,
    includeInactive,
  });

  const handleSearch = useDebouncedCallback((value: string) => {
    setPage(1);
    setSearch(value || undefined);
  }, 350);

  const allItems = data?.items ?? [];
  const items =
    activeFilter === "inactive" ? allItems.filter((r) => !r.isActive)
    : activeFilter === "active" ? allItems.filter((r) => r.isActive)
    : allItems;

  const selectedReceptionist = items.find((r) => r.id === selectedId) ?? null;

  function selectRow(id: string) {
    setSelectedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader
        title="Recepcionistas"
        subtitle={data ? `${data.totalCount.toLocaleString("es-AR")} registrados` : "Cargando recepcionistas..."}
        Icon={ConciergeBell}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-white border border-[#c4c6cd] p-1 rounded-lg gap-0.5">
              {ACTIVE_TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => { setActiveFilter(key); setPage(1); setSelectedId(null); }}
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
              <UserRoundPlus className="w-4 h-4" />
              Nuevo recepcionista
            </button>
          </div>
        }
      />

      <SearchInput
        placeholder="Buscar nombre o email..."
        onChange={handleSearch}
        className="max-w-sm"
      />

      <div className="flex flex-col lg:flex-row gap-5 items-start">
        <div className="flex-1 min-w-0 space-y-3">
          <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="divide-y divide-[#c4c6cd]/40">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <div className="w-10 h-10 rounded-full bg-[#c4c6cd]/30 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-40 bg-[#c4c6cd]/30 rounded animate-pulse" />
                      <div className="h-3 w-28 bg-[#c4c6cd]/20 rounded animate-pulse" />
                    </div>
                    <div className="h-5 w-16 bg-[#c4c6cd]/20 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : isError ? (
              <p className="px-6 py-8 text-sm text-red-500 text-center">
                Error al cargar los recepcionistas.
              </p>
            ) : items.length === 0 ? (
              <p className="px-6 py-8 text-sm text-[#44474c] text-center">
                No hay recepcionistas.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-[1fr_1fr_90px] gap-4 px-6 py-3 bg-[#eefcfd] border-b border-[#c4c6cd]/60">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Nombre</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Email</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Estado</p>
                </div>

                <div className="divide-y divide-[#c4c6cd]/40">
                  {items.map((r) => {
                    const isSelected = selectedId === r.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => selectRow(r.id)}
                        className={`w-full grid grid-cols-[1fr_1fr_90px] gap-4 px-6 py-4 text-left transition-colors cursor-pointer border-l-4 ${
                          isSelected
                            ? "bg-[#fea520]/[0.05] border-l-[#fea520]"
                            : "hover:bg-[#eefcfd]/60 border-l-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <ReceptionistAvatar r={r} size="sm" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#041627] truncate">
                              {r.firstName} {r.lastName}
                            </p>
                            <p className="text-xs text-[#44474c]/60 truncate">
                              Desde {formatDate(r.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="min-w-0 flex items-center">
                          <p className="text-sm text-[#041627] truncate">{r.email}</p>
                        </div>

                        <div className="flex items-center">
                          <ActiveBadge isActive={r.isActive} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {!isLoading && !isError && data && (
              <div className="px-6 py-3 bg-[#eefcfd]/60 border-t border-[#c4c6cd]/60">
                <p className="text-xs text-[#44474c]/70">
                  Mostrando {items.length} de {data.totalCount.toLocaleString("es-AR")} recepcionistas
                </p>
              </div>
            )}
          </div>

          {data && (
            <Pagination
              currentPage={data.page}
              totalPages={data.totalPages}
              hasNextPage={data.hasNextPage}
              hasPreviousPage={data.hasPreviousPage}
              onPageChange={(p) => { setPage(p); setSelectedId(null); }}
            />
          )}
        </div>

        {selectedReceptionist && (
          <DetailPanel
            receptionist={selectedReceptionist}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>

      {showCreate && (
        <CreateReceptionistModal onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}
