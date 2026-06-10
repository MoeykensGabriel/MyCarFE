"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, Plus, Building2, Car, User, Mail, Phone } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { BackButton } from "@/components/shared/BackButton";
import { InfoRow } from "@/components/shared/InfoRow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DocumentTypeLabel } from "@/lib/enums";
import { useFleet, useUpdateFleet } from "@/hooks/useFleets";
import { UpdateFleetRequest } from "@/types/api.types";
import { cuitSchema, phoneSchema } from "@/lib/argentina-validation";
import { optionalEmailSchema, shortStringSchema } from "@/lib/form-validation";
import { M } from "@/lib/form-messages";

// ─── Schema de edición ───────────────────────────────────────────────────────
const editFleetSchema = z.object({
  companyName: shortStringSchema({ max: 200, requiredMessage: M.required }),
  taxId:       cuitSchema,
  phone:       phoneSchema,
  email:       optionalEmailSchema,
  address:     z.string().max(300, M.tooLong(300)).optional(),
});

type EditFleetValues = z.infer<typeof editFleetSchema>;

// ─── Formulario de edición inline ────────────────────────────────────────────

function EditFleetForm({
  id,
  defaultValues,
  onCancel,
}: {
  id: string;
  defaultValues: UpdateFleetRequest;
  onCancel: () => void;
}) {
  const { mutate: update, isPending } = useUpdateFleet(id);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditFleetValues>({
    resolver: zodResolver(editFleetSchema),
    defaultValues: defaultValues as EditFleetValues,
  });

  return (
    <form
      onSubmit={handleSubmit((data) => update(data as UpdateFleetRequest, { onSuccess: onCancel }))}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-1.5">
          <Label>Razón social</Label>
          <Input placeholder="Vicente Trapani SA" {...register("companyName")} />
          {errors.companyName && <p className="text-xs text-red-500">{errors.companyName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>CUIT</Label>
          <Input placeholder="30-12345678-9" {...register("taxId")} />
          {errors.taxId && <p className="text-xs text-red-500">{errors.taxId.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" placeholder="empresa@ejemplo.com" {...register("email")} />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Teléfono</Label>
          <Input placeholder="+54 9 11 1234 5678" {...register("phone")} />
          {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Dirección</Label>
          <Input {...register("address")} />
          {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function FleetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: fleet, isLoading, isError } = useFleet(id);
  const [editing, setEditing] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <BackButton href="/admin/fleets" label="Flotas" />
        <p className="text-sm text-muted-foreground">Cargando flota...</p>
      </div>
    );
  }

  if (isError || !fleet) {
    return (
      <div className="space-y-4">
        <BackButton href="/admin/fleets" label="Flotas" />
        <p className="text-sm text-red-500">No se pudo cargar la flota.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <BackButton href="/admin/fleets" label="Flotas" />
        
        <div className="bg-white rounded-xl border border-[#c4c6cd] border-l-4 border-l-[#041627] shadow-sm p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 hover:shadow-md">
          <div className="flex items-start md:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-[#041627] shrink-0 shadow-inner">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-none">
                  {fleet.companyName}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-slate-500 font-bold mt-1.5 leading-none">
                <span>Ficha de Flota / Empresa</span>
                {fleet.taxId && (
                  <>
                    <span className="text-slate-300 font-normal select-none">•</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-mono font-semibold uppercase text-[11px] tracking-wide">
                      CUIT {fleet.taxId}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 rounded-lg border border-[#c4c6cd] hover:border-[#041627] text-sm font-semibold text-[#041627] hover:bg-[#eefcfd] transition-all shrink-0 shadow-sm"
            >
              Editar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda — 2/3 */}
        <div className="lg:col-span-2 space-y-6">

          {/* Datos de la empresa */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos de la empresa</CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <EditFleetForm
                  id={id}
                  defaultValues={{
                    companyName: fleet.companyName,
                    taxId: fleet.taxId,
                    email: fleet.email,
                    phone: fleet.phone,
                    address: fleet.address,
                  }}
                  onCancel={() => setEditing(false)}
                />
              ) : (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <InfoRow label="Razón social" value={fleet.companyName} />
                  <InfoRow label="CUIT" value={fleet.taxId} />
                  <InfoRow label="Email" value={fleet.email} />
                  <InfoRow label="Teléfono" value={fleet.phone} />
                  <InfoRow label="Dirección" value={fleet.address} />
                  <InfoRow
                    label="Alta"
                    value={new Date(fleet.createdAt).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contactos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span>Contactos</span>
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold font-mono">
                  {fleet.contacts.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fleet.contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Sin contactos registrados.</p>
              ) : (
                <div className="space-y-3">
                  {fleet.contacts.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-3 p-3.5 bg-slate-50/50 rounded-xl border border-slate-200/40 hover:border-[#041627]/20 hover:bg-[#eefcfd]/10 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0 group-hover:text-[#041627] group-hover:bg-[#eefcfd]/20 transition-all shadow-sm">
                          <User className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 text-sm">
                          <p className="font-bold text-slate-800 truncate leading-tight group-hover:text-[#041627] transition-colors">
                            {c.firstName} {c.lastName}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-slate-500 font-medium">
                            <span className="inline-flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              {c.email}
                            </span>
                            {c.phone && (
                              <>
                                <span className="text-slate-300 select-none font-normal">•</span>
                                <span className="inline-flex items-center gap-1">
                                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                                  {c.phone}
                                </span>
                              </>
                            )}
                            <span className="text-slate-300 select-none font-normal">•</span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {DocumentTypeLabel[c.documentType]} {c.documentNumber}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Link
                        href={`/admin/customers/${c.id}`}
                        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#041627] hover:bg-white border border-transparent hover:border-slate-200 transition-all shadow-none hover:shadow-sm"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha — 1/3 */}
        <div className="space-y-6">

          {/* Vehículos de la flota */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <span>Vehículos</span>
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold font-mono">
                  {fleet.vehicles.length}
                </span>
              </CardTitle>
              <Link
                href={`/admin/fleets/${fleet.id}/add-vehicle`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#041627] bg-[#fea520] hover:bg-[#e8951d] px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Nuevo vehículo
              </Link>
            </CardHeader>
            <CardContent className="pt-2">
              {fleet.vehicles.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Sin vehículos asignados.</p>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    {fleet.vehicles.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between gap-3 p-3 bg-[#eefcfd]/20 rounded-xl border border-slate-200/30 hover:border-[#041627]/20 hover:bg-[#eefcfd]/50 transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-white border border-slate-200/50 flex items-center justify-center text-slate-500 shrink-0 group-hover:text-[#041627] transition-all shadow-sm">
                            <Car className="w-4.5 h-4.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate leading-tight group-hover:text-[#041627] transition-colors">
                              {v.brand} {v.model}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-slate-400 font-bold">{v.year}</span>
                              <span className="text-slate-300 font-normal select-none text-[10px]">•</span>
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[9px] font-semibold uppercase tracking-wider">
                                {v.licensePlate}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Link
                          href={`/admin/vehicles/${v.id}`}
                          className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#041627] hover:bg-white border border-transparent hover:border-slate-250 transition-all shadow-none hover:shadow-sm"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    ))}
                  </div>
                  
                  <Link
                    href={`/admin/vehicles?fleetId=${fleet.id}`}
                    className="inline-flex items-center gap-1 text-xs text-[#041627] font-bold hover:text-[#fea520] transition-colors pt-1"
                  >
                    Ver todos los vehículos
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Órdenes de la flota */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Órdenes de trabajo</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/admin/work-orders?fleetId=${fleet.id}`}
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                Ver órdenes de esta flota
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
