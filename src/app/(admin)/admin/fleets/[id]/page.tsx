"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, Plus } from "lucide-react";
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
      <div>
        <BackButton href="/admin/fleets" label="Flotas" />
        <div className="mt-2 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{fleet.companyName}</h1>
            {fleet.taxId && (
              <p className="text-sm text-muted-foreground mt-0.5">CUIT {fleet.taxId}</p>
            )}
          </div>
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              Editar
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Columna izquierda — 2/3 */}
        <div className="col-span-2 space-y-6">

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
              <CardTitle className="text-base">
                Contactos
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({fleet.contacts.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fleet.contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin contactos registrados.</p>
              ) : (
                <div className="divide-y">
                  {fleet.contacts.map((c) => (
                    <div key={c.id} className="py-3 flex items-center justify-between">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">
                          {c.firstName} {c.lastName}
                        </p>
                        <p className="text-muted-foreground">{c.email}</p>
                        {c.phone && (
                          <p className="text-xs text-muted-foreground">{c.phone}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {DocumentTypeLabel[c.documentType]} {c.documentNumber}
                        </p>
                      </div>
                      <Link
                        href={`/admin/customers/${c.id}`}
                        className="inline-flex items-center gap-0.5 text-sm text-blue-600 hover:underline shrink-0"
                      >
                        Ver <ChevronRight className="w-3.5 h-3.5" />
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
              <CardTitle className="text-base">
                Vehículos
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({fleet.vehicles.length})
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
            <CardContent className="space-y-2">
              {fleet.vehicles.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin vehículos.</p>
              ) : (
                <>
                  <div className="divide-y">
                    {fleet.vehicles.map((v) => (
                      <div key={v.id} className="py-2 flex items-center justify-between">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">
                            {v.brand} {v.model} ({v.year})
                          </p>
                          <p className="text-xs font-mono text-muted-foreground">
                            {v.licensePlate}
                          </p>
                        </div>
                        <Link
                          href={`/admin/vehicles/${v.id}`}
                          className="inline-flex items-center gap-0.5 text-sm text-blue-600 hover:underline shrink-0"
                        >
                          Ver <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    ))}
                  </div>
                  <Link
                    href={`/admin/vehicles?fleetId=${fleet.id}`}
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline pt-1"
                  >
                    Ver todos los vehículos
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </>
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
