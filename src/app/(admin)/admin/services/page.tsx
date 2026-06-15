"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDebouncedCallback } from "use-debounce";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Clock,
  DollarSign,
  PackageOpen,
  ListChecks,
} from "lucide-react";

import { formatCurrency } from "@/lib/format";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import {
  useCatalogServices,
  useCreateCatalogService,
  useUpdateCatalogService,
  useDeleteCatalogService,
} from "@/hooks/useCatalog";
import { CatalogService, CreateCatalogServiceRequest } from "@/types/api.types";
import { M } from "@/lib/form-messages";

const serviceSchema = z.object({
  name:        z.string().min(1, "Ingresá un nombre para el servicio").max(150, M.tooLong(150)),
  description: z.string().max(500, M.tooLong(500)),
  defaultPrice: z
    .number({ message: M.notNumber })
    .min(0, M.negativeNotAllowed)
    .max(99_999_999, M.numberTooLarge(99_999_999)),
  estimatedDurationMinutes: z
    .number({ message: M.notNumber })
    .int("La duración debe ser un número entero")
    .min(1, "La duración debe ser al menos 1 minuto")
    .max(1440, "La duración no puede superar 24 horas (1440 min)"),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ─── Panel de formulario (crear / editar) ─────────────────────────────────────

type FormValues = CreateCatalogServiceRequest;

function ServiceForm({
  editing,
  onClose,
}: {
  editing: CatalogService | null; // null = nuevo
  onClose: () => void;
}) {
  const { mutate: create, isPending: creating } = useCreateCatalogService();
  const { mutate: update, isPending: updating } = useUpdateCatalogService();
  const isPending = creating || updating;

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: editing
      ? {
          name:                     editing.name,
          description:              editing.description ?? "",
          defaultPrice:             editing.defaultPrice,
          estimatedDurationMinutes: editing.estimatedDurationMinutes,
        }
      : { defaultPrice: 0, estimatedDurationMinutes: 30 },
  });

  function onSubmit(values: FormValues) {
    if (editing) {
      update({ id: editing.id, data: values }, { onSuccess: onClose });
    } else {
      create(values, { onSuccess: onClose });
    }
  }

  return (
    <aside className="w-full lg:w-80 shrink-0 bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden flex flex-col self-start lg:sticky lg:top-0">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#c4c6cd]/60">
        <h3 className="text-sm font-bold text-[#041627]">
          {editing ? "Editar servicio" : "Nuevo servicio"}
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-[#44474c] hover:bg-[#eefcfd] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1">
        <div className="px-5 py-5 space-y-4 flex-1">

          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[#041627]">
              Nombre <span className="text-[#fea520]">*</span>
            </label>
            <input
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#c4c6cd] bg-white text-[#041627] placeholder:text-[#44474c]/50 focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all"
              placeholder="Ej: Cambio de aceite"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[#041627]">
              Descripción
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#c4c6cd] bg-white text-[#041627] placeholder:text-[#44474c]/50 focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all resize-none"
              placeholder="Descripción opcional del servicio..."
              {...register("description")}
            />
          </div>

          {/* Precio */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[#041627]">
              Precio base (ARS) <span className="text-[#fea520]">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#44474c]/50" />
              <input
                type="number"
                min={0}
                step={0.01}
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-[#c4c6cd] bg-white text-[#041627] focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all"
                {...register("defaultPrice", { valueAsNumber: true })}
              />
            </div>
            {errors.defaultPrice && (
              <p className="text-xs text-red-500">{errors.defaultPrice.message}</p>
            )}
          </div>

          {/* Duración */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[#041627]">
              Duración estimada (min) <span className="text-[#fea520]">*</span>
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#44474c]/50" />
              <input
                type="number"
                min={1}
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-[#c4c6cd] bg-white text-[#041627] focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all"
                {...register("estimatedDurationMinutes", { valueAsNumber: true })}
              />
            </div>
            {errors.estimatedDurationMinutes && (
              <p className="text-xs text-red-500">{errors.estimatedDurationMinutes.message}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#c4c6cd]/60 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 px-4 py-2 rounded-lg border border-[#c4c6cd] text-sm font-semibold text-[#44474c] hover:bg-[#eefcfd] transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 px-4 py-2 rounded-lg bg-[#041627] text-white text-sm font-semibold hover:bg-[#041627]/80 transition-colors disabled:opacity-40"
          >
            {isPending ? "Guardando..." : editing ? "Guardar cambios" : "Crear servicio"}
          </button>
        </div>
      </form>
    </aside>
  );
}

// ─── Item de servicio (con confirmación de borrado inline) ──────────────────────
// variant="row" → fila de la tabla (desktop); variant="card" → card (mobile).
// La lógica de borrado se comparte; solo cambia la disposición.

function ServiceItem({
  service,
  isSelected,
  onEdit,
  variant,
}: {
  service: CatalogService;
  isSelected: boolean;
  onEdit: (s: CatalogService) => void;
  variant: "row" | "card";
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { mutate: remove, isPending } = useDeleteCatalogService();

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000); // auto-reset
      return;
    }
    remove(service.id);
  }

  const actions = (
    <div className="flex items-center gap-1 shrink-0">
      <button
        onClick={() => onEdit(service)}
        className="p-1.5 rounded-md text-[#44474c]/60 hover:text-[#041627] hover:bg-[#eefcfd] transition-colors"
        title="Editar"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className={`p-1.5 rounded-md transition-colors disabled:opacity-40 ${
          confirmDelete
            ? "bg-red-500 text-white hover:bg-red-600"
            : "text-[#44474c]/60 hover:text-red-500 hover:bg-red-50"
        }`}
        title={confirmDelete ? "Clic para confirmar" : "Eliminar"}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  if (variant === "card") {
    return (
      <div
        className={`bg-white rounded-xl border shadow-sm p-4 transition-all ${
          isSelected ? "border-[#fea520] ring-1 ring-[#fea520]/40" : "border-[#c4c6cd]"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#041627] truncate">{service.name}</p>
            {service.description && (
              <p className="text-xs text-[#44474c] truncate mt-0.5">{service.description}</p>
            )}
          </div>
          {actions}
        </div>
        <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-[#c4c6cd]/40">
          <span className="flex items-center gap-1.5 text-sm text-[#44474c]">
            <Clock className="w-3.5 h-3.5 text-[#44474c]/50" />
            {formatDuration(service.estimatedDurationMinutes)}
          </span>
          <span className="text-sm font-bold text-[#041627] tabular-nums">
            {formatCurrency(service.defaultPrice)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-[1fr_120px_90px_80px] gap-4 items-center px-6 py-4 border-l-4 transition-colors ${
        isSelected
          ? "bg-[#fea520]/[0.05] border-l-[#fea520]"
          : "hover:bg-[#eefcfd]/60 border-l-transparent"
      }`}
    >
      {/* Info */}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#041627] truncate">{service.name}</p>
        {service.description && (
          <p className="text-xs text-[#44474c] truncate mt-0.5">{service.description}</p>
        )}
      </div>

      {/* Precio */}
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-[#041627] tabular-nums">
          {formatCurrency(service.defaultPrice)}
        </p>
        <p className="text-[10px] text-[#44474c]/60 mt-0.5">precio base</p>
      </div>

      {/* Duración */}
      <div className="flex items-center gap-1.5 shrink-0 text-[#44474c]">
        <Clock className="w-3.5 h-3.5 text-[#44474c]/50" />
        <span className="text-sm tabular-nums">{formatDuration(service.estimatedDurationMinutes)}</span>
      </div>

      {/* Acciones */}
      {actions}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

type PanelState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; service: CatalogService };

export default function ServicesPage() {
  const [search, setSearch] = useState<string | undefined>(undefined);
  const [panel, setPanel] = useState<PanelState>({ mode: "closed" });

  const { data: services = [], isLoading, isError } = useCatalogServices({ search });

  const handleSearch = useDebouncedCallback((value: string) => {
    setSearch(value || undefined);
  }, 350);

  const selectedId = panel.mode === "edit" ? panel.service.id : null;

  const panelOpen = panel.mode !== "closed";

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <PageHeader
        title="Servicios"
        subtitle={!isLoading ? `${services.length} servicio${services.length !== 1 ? "s" : ""} en el catálogo` : "Cargando catálogo..."}
        Icon={ListChecks}
        actions={
          <button
            onClick={() => setPanel({ mode: "create" })}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#fea520] text-[#041627] text-sm font-bold rounded-lg hover:bg-[#865300] hover:text-white shadow-sm transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nuevo servicio
          </button>
        }
      />

      {/* ── Búsqueda ───────────────────────────────────────────────────────── */}
      <SearchInput
        placeholder="Buscar servicio..."
        onChange={handleSearch}
        className="max-w-sm"
      />

      {/* ── Contenido principal ────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">

        {/* Tabla / cards */}
        <div className="flex-1 min-w-0 space-y-3">
          {isLoading ? (
            <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden divide-y divide-[#c4c6cd]/40">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 sm:px-6 py-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 max-w-[60%] bg-[#c4c6cd]/30 rounded animate-pulse" />
                    <div className="h-3 w-72 max-w-[80%] bg-[#c4c6cd]/20 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-20 bg-[#c4c6cd]/20 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm px-6 py-8 text-center">
              <p className="text-sm text-red-500">Error al cargar el catálogo.</p>
            </div>
          ) : services.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm flex flex-col items-center gap-3 px-6 py-16 text-center">
              <PackageOpen className="w-10 h-10 text-[#c4c6cd]" />
              <p className="text-sm font-semibold text-[#041627]">
                {search ? "Sin resultados" : "Catálogo vacío"}
              </p>
              <p className="text-xs text-[#44474c]">
                {search
                  ? "Probá con otro término de búsqueda."
                  : "Creá el primer servicio para empezar."}
              </p>
            </div>
          ) : (
            <>
              {/* ── Tabla (desktop) ───────────────────────────────────────────── */}
              <div className="hidden lg:block bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden">
                {/* Cabecera */}
                <div className="grid grid-cols-[1fr_120px_90px_80px] gap-4 px-6 py-3 bg-[#eefcfd] border-b border-[#c4c6cd]/60">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Servicio</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70 text-right">Precio</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Duración</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">Acciones</p>
                </div>

                <div className="divide-y divide-[#c4c6cd]/40">
                  {services.map((s) => (
                    <ServiceItem
                      key={s.id}
                      service={s}
                      isSelected={selectedId === s.id}
                      onEdit={(svc) => setPanel({ mode: "edit", service: svc })}
                      variant="row"
                    />
                  ))}
                </div>

                <div className="px-6 py-3 bg-[#eefcfd]/60 border-t border-[#c4c6cd]/60">
                  <p className="text-xs text-[#44474c]/70">
                    {services.length} servicio{services.length !== 1 ? "s" : ""} encontrado{services.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* ── Cards (mobile / tablet) ───────────────────────────────────── */}
              <div className="lg:hidden space-y-3">
                {services.map((s) => (
                  <ServiceItem
                    key={s.id}
                    service={s}
                    isSelected={selectedId === s.id}
                    onEdit={(svc) => setPanel({ mode: "edit", service: svc })}
                    variant="card"
                  />
                ))}
                <p className="text-xs text-[#44474c]/70 px-1 pt-1">
                  {services.length} servicio{services.length !== 1 ? "s" : ""} encontrado{services.length !== 1 ? "s" : ""}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Panel lateral */}
        {panelOpen && (
          <ServiceForm
            editing={panel.mode === "edit" ? panel.service : null}
            onClose={() => setPanel({ mode: "closed" })}
          />
        )}
      </div>
    </div>
  );
}
