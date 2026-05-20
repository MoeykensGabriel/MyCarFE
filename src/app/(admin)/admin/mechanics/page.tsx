"use client";

import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import {
  UserRoundPlus,
  X,
  Check,
  Wrench,
  AlertCircle,
  Mail,
  Phone,
  BadgeCheck,
  BadgeX,
  Eye,
  EyeOff,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";

import { Pagination } from "@/components/shared/Pagination";
import { ResetPasswordButton } from "@/components/shared/ResetPasswordButton";
import { SearchInput } from "@/components/shared/SearchInput";
import { optionalPhoneSchema } from "@/lib/argentina-validation";
import { formatDate } from "@/lib/format";
import {
  useAdminMechanics,
  useCreateMechanic,
  useUpdateMechanic,
} from "@/hooks/useAdminMechanics";
import { Mechanic, ProblemDetails } from "@/types/api.types";

// ─── Schema ───────────────────────────────────────────────────────────────────

const mechanicSchema = z.object({
  firstName: z.string().min(1, "Ingresá el nombre"),
  lastName:  z.string().min(1, "Ingresá el apellido"),
  email:     z.string().min(1, "Ingresá el email").email("Ingresá un email válido. Ej: nombre@empresa.com"),
  phone:     optionalPhoneSchema,
  specialty: z.string().max(200, "Máximo 200 caracteres").optional(),
});

type MechanicForm = z.infer<typeof mechanicSchema>;

// ─── Active Badge ─────────────────────────────────────────────────────────────

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

// ─── Avatar ───────────────────────────────────────────────────────────────────

function MechanicAvatar({ m, size = "md" }: { m: Mechanic; size?: "sm" | "md" | "lg" }) {
  const initials = `${m.firstName[0] ?? ""}${m.lastName[0] ?? ""}`.toUpperCase();
  const sz =
    size === "lg" ? "w-16 h-16 text-xl"
    : size === "sm" ? "w-8 h-8 text-xs"
    : "w-10 h-10 text-sm";

  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center font-bold shrink-0 bg-[#041627] text-white`}
    >
      {initials}
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  mechanic,
  onClose,
}: {
  mechanic: Mechanic;
  onClose: () => void;
}) {
  const [showToggle, setShowToggle] = useState(false);
  const updateMechanic = useUpdateMechanic();

  function handleToggleActive() {
    updateMechanic.mutate(
      { id: mechanic.id, data: { isActive: !mechanic.isActive } },
      { onSuccess: () => setShowToggle(false) }
    );
  }

  return (
    <aside className="w-full lg:w-80 shrink-0 bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden flex flex-col self-start lg:sticky lg:top-0">
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

        <div className="mt-3">
          <ActiveBadge isActive={mechanic.isActive} />
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

      {/* Footer: toggle activo/inactivo */}
      <div className="border-t border-[#c4c6cd]/60 px-5 py-4">
        {showToggle ? (
          <div className="space-y-2">
            <p className="text-xs text-[#44474c]">
              ¿Confirmar {mechanic.isActive ? "desactivar" : "activar"} a{" "}
              <strong>{mechanic.firstName}</strong>?
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
                Desactivar mecánico
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                Reactivar mecánico
              </>
            )}
          </button>
        )}
      </div>

      {/* Reset de contraseña */}
      <div className="border-t border-[#c4c6cd]/60 px-5 py-4">
        <ResetPasswordButton
          applicationUserId={mechanic.applicationUserId}
          userDisplayName={`${mechanic.firstName} ${mechanic.lastName}`}
          variant="compact"
        />
      </div>
    </aside>
  );
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

function CreateMechanicModal({ onClose }: { onClose: () => void }) {
  const createMechanic = useCreateMechanic();
  const [serverError, setServerError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MechanicForm>({ resolver: zodResolver(mechanicSchema) });

  const onSubmit = async (data: MechanicForm) => {
    setServerError(null);
    createMechanic.mutate(data, {
      onSuccess: (res) => {
        setTempPassword(res.tempPassword);
      },
      onError: (err) => {
        const axiosErr = err as AxiosError<ProblemDetails>;
        const detail = axiosErr.response?.data?.detail;
        const title = axiosErr.response?.data?.title;
        setServerError(detail ?? title ?? "Error al crear el mecánico");
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#c4c6cd]/60">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[#fea520]" />
            <h2 className="text-base font-bold text-[#041627]">Nuevo mecánico</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#44474c] hover:bg-[#eefcfd] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {tempPassword ? (
            /* ── Éxito: mostrar contraseña temporal ── */
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                <p className="text-sm font-semibold">Mecánico creado exitosamente</p>
              </div>
              <div className="rounded-xl border border-[#c4c6cd] bg-[#eefcfd] px-4 py-3 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">
                  Contraseña temporal
                </p>
                <p className="text-lg font-mono font-bold text-[#041627] tracking-widest">
                  {tempPassword}
                </p>
                <p className="text-xs text-[#44474c]/70">
                  Compartila con el mecánico. Deberá cambiarla en su primer acceso.
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
            /* ── Formulario ── */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* Nombre + Apellido */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-[#041627]">
                    Nombre
                  </label>
                  <input
                    type="text"
                    placeholder="Juan"
                    className={`w-full px-3 py-2.5 text-sm rounded-xl border bg-white text-[#041627] placeholder:text-[#44474c]/40 focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all ${
                      errors.firstName
                        ? "border-red-400 focus:ring-red-200"
                        : "border-[#c4c6cd]"
                    }`}
                    {...register("firstName")}
                  />
                  {errors.firstName && (
                    <p className="text-xs text-red-500">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-[#041627]">
                    Apellido
                  </label>
                  <input
                    type="text"
                    placeholder="Pérez"
                    className={`w-full px-3 py-2.5 text-sm rounded-xl border bg-white text-[#041627] placeholder:text-[#44474c]/40 focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all ${
                      errors.lastName
                        ? "border-red-400 focus:ring-red-200"
                        : "border-[#c4c6cd]"
                    }`}
                    {...register("lastName")}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-red-500">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[#041627]">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="mecanico@taller.com"
                  className={`w-full px-3 py-2.5 text-sm rounded-xl border bg-white text-[#041627] placeholder:text-[#44474c]/40 focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all ${
                    errors.email
                      ? "border-red-400 focus:ring-red-200"
                      : "border-[#c4c6cd]"
                  }`}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Teléfono */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[#041627]">
                  Teléfono <span className="font-normal text-[#44474c]/50">(opcional)</span>
                </label>
                <input
                  type="tel"
                  placeholder="+54 11 1234-5678"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#c4c6cd] bg-white text-[#041627] placeholder:text-[#44474c]/40 focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all"
                  {...register("phone")}
                />
              </div>

              {/* Especialidad */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[#041627]">
                  Especialidad <span className="font-normal text-[#44474c]/50">(opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Motor, frenos, electricidad..."
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#c4c6cd] bg-white text-[#041627] placeholder:text-[#44474c]/40 focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all"
                  {...register("specialty")}
                />
              </div>

              {/* Error servidor */}
              {serverError && (
                <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{serverError}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || createMechanic.isPending}
                className="w-full py-3 rounded-xl text-sm font-bold bg-[#fea520] text-[#041627] hover:bg-[#e8951d] active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMechanic.isPending ? "Creando..." : "Crear mecánico"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

type ActiveFilter = "all" | "active" | "inactive";

const ACTIVE_TABS: { key: ActiveFilter; label: string }[] = [
  { key: "all",      label: "Todos"    },
  { key: "active",   label: "Activos"  },
  { key: "inactive", label: "Inactivos" },
];

export default function MechanicsPage() {
  const [page,         setPage]         = useState(1);
  const [search,       setSearch]       = useState<string | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [selectedId,   setSelectedId]   = useState<string | null>(null);
  const [showCreate,   setShowCreate]   = useState(false);

  const isActiveParam =
    activeFilter === "active"   ? true
    : activeFilter === "inactive" ? false
    : undefined;

  const { data, isLoading, isError } = useAdminMechanics({
    page,
    pageSize: 20,
    search,
    isActive: isActiveParam,
  });

  const handleSearch = useDebouncedCallback((value: string) => {
    setPage(1);
    setSearch(value || undefined);
  }, 350);

  const items = data?.items ?? [];
  const selectedMechanic = items.find((m) => m.id === selectedId) ?? null;

  function selectRow(id: string) {
    setSelectedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#041627]">Mecánicos</h1>
          {data && (
            <p className="text-sm text-[#44474c] mt-0.5">
              {data.totalCount.toLocaleString("es-AR")} registrados
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tabs activo/inactivo */}
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
            Nuevo mecánico
          </button>
        </div>
      </div>

      {/* ── Búsqueda ───────────────────────────────────────────────────────── */}
      <SearchInput
        placeholder="Buscar nombre, email o especialidad..."
        onChange={handleSearch}
        className="max-w-sm"
      />

      {/* ── Contenido ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">

        {/* Tabla */}
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
                Error al cargar los mecánicos.
              </p>
            ) : items.length === 0 ? (
              <p className="px-6 py-8 text-sm text-[#44474c] text-center">
                No hay mecánicos.
              </p>
            ) : (
              <>
                {/* Cabecera */}
                <div className="grid grid-cols-[1fr_1fr_120px_90px] gap-4 px-6 py-3 bg-[#eefcfd] border-b border-[#c4c6cd]/60">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Nombre</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Contacto</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Especialidad</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Estado</p>
                </div>

                {/* Filas */}
                <div className="divide-y divide-[#c4c6cd]/40">
                  {items.map((m) => {
                    const isSelected = selectedId === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => selectRow(m.id)}
                        className={`w-full grid grid-cols-[1fr_1fr_120px_90px] gap-4 px-6 py-4 text-left transition-colors cursor-pointer border-l-4 ${
                          isSelected
                            ? "bg-[#fea520]/[0.05] border-l-[#fea520]"
                            : "hover:bg-[#eefcfd]/60 border-l-transparent"
                        }`}
                      >
                        {/* Nombre + avatar */}
                        <div className="flex items-center gap-3 min-w-0">
                          <MechanicAvatar m={m} size="sm" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#041627] truncate">
                              {m.firstName} {m.lastName}
                            </p>
                            <p className="text-xs text-[#44474c]/60 truncate">
                              Desde {formatDate(m.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Contacto */}
                        <div className="min-w-0 flex flex-col justify-center">
                          <p className="text-sm text-[#041627] truncate">{m.email}</p>
                          {m.phone && (
                            <p className="text-xs text-[#44474c] truncate">{m.phone}</p>
                          )}
                        </div>

                        {/* Especialidad */}
                        <div className="flex items-center min-w-0">
                          {m.specialty ? (
                            <p className="text-xs text-[#44474c] truncate">{m.specialty}</p>
                          ) : (
                            <p className="text-xs text-[#44474c]/40 italic">—</p>
                          )}
                        </div>

                        {/* Estado */}
                        <div className="flex items-center">
                          <ActiveBadge isActive={m.isActive} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Footer */}
            {!isLoading && !isError && data && (
              <div className="px-6 py-3 bg-[#eefcfd]/60 border-t border-[#c4c6cd]/60">
                <p className="text-xs text-[#44474c]/70">
                  Mostrando {items.length} de {data.totalCount.toLocaleString("es-AR")} mecánicos
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

        {/* Panel de detalle */}
        {selectedMechanic && (
          <DetailPanel
            mechanic={selectedMechanic}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>

      {/* Modal de creación */}
      {showCreate && (
        <CreateMechanicModal
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
