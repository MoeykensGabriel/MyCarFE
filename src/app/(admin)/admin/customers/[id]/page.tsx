"use client";

import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";

import { BackButton } from "@/components/shared/BackButton";
import { ResetPasswordButton } from "@/components/shared/ResetPasswordButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentTypeLabel } from "@/lib/enums";
import { useParams } from "next/navigation";
import { useCustomer } from "@/hooks/useCustomers";

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-gray-900">{value ?? "—"}</p>
    </div>
  );
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: customer, isLoading, isError } = useCustomer(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <BackButton href="/admin/customers" label="Clientes" />
        <p className="text-sm text-muted-foreground">Cargando cliente...</p>
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="space-y-4">
        <BackButton href="/admin/customers" label="Clientes" />
        <p className="text-sm text-red-500">No se pudo cargar el cliente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <BackButton href="/admin/customers" label="Clientes" />
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">
            {customer.firstName} {customer.lastName}
          </h1>
          {customer.fleetId ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
              Flota
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
              Cliente
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Columna izquierda — 2/3 */}
        <div className="col-span-2 space-y-6">

          {/* Datos de contacto */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos de contacto</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow
                label="Nombre completo"
                value={`${customer.firstName} ${customer.lastName}`}
              />
              <InfoRow label="Email" value={customer.email} />
              <InfoRow label="Teléfono" value={customer.phone} />
            </CardContent>
          </Card>

          {/* Documento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documento</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow
                label="Tipo"
                value={DocumentTypeLabel[customer.documentType]}
              />
              <InfoRow label="Número" value={customer.documentNumber} />
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha — 1/3 */}
        <div className="space-y-6">
          {/* Flota (solo si aplica) */}
          {customer.fleetId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Flota</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="text-xs text-muted-foreground">ID de flota</p>
                <Link
                  href={`/admin/fleets/${customer.fleetId}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {customer.fleetId}
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Vehículos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Vehículos</CardTitle>
              <Link
                href={`/admin/customers/${customer.id}/add-vehicle`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#fea520] text-[#041627] text-xs font-bold hover:bg-[#865300] hover:text-white transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Registrar
              </Link>
            </CardHeader>
            <CardContent>
              <Link
                href={`/admin/vehicles?customerId=${customer.id}`}
                className="inline-flex items-center gap-1 text-sm text-[#041627] font-medium hover:text-[#fea520] transition-colors"
              >
                Ver vehículos de este cliente
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </CardContent>
          </Card>

          {/* Órdenes de trabajo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Órdenes de trabajo</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/admin/work-orders?customerId=${customer.id}`}
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                Ver órdenes de este cliente
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </CardContent>
          </Card>

          {/* Acceso */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acceso</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Si el cliente perdió su contraseña, generá una temporal nueva.
              </p>
              <ResetPasswordButton
                applicationUserId={customer.applicationUserId}
                userDisplayName={`${customer.firstName} ${customer.lastName}`}
                variant="full"
              />
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sistema</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <InfoRow
                label="Registrado"
                value={new Date(customer.createdAt).toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              />
              <InfoRow
                label="Última actualización"
                value={new Date(customer.updatedAt).toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
