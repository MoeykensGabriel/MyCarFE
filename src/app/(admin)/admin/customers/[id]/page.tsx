"use client";

import Link from "next/link";
import { 
  ChevronRight, 
  Plus, 
  User, 
  Building2,
  Mail,
  Phone,
  CreditCard,
  Key,
  Calendar,
  Clock,
  Car,
  ClipboardList,
  ExternalLink
} from "lucide-react";

import { BackButton } from "@/components/shared/BackButton";
import { ResetPasswordButton } from "@/components/shared/ResetPasswordButton";
import { DocumentTypeLabel } from "@/lib/enums";
import { useParams } from "next/navigation";
import { useCustomer } from "@/hooks/useCustomers";

// ─── Custom Premium InfoRow ──────────────────────────────────────────────────

function InfoRow({ 
  label, 
  value, 
  icon: Icon 
}: { 
  label: string; 
  value?: string | null; 
  icon?: any 
}) {
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-[#eefcfd]/10 hover:border-[#eefcfd]/60 transition-all duration-200">
      {Icon && (
        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/60 text-[#041627] flex items-center justify-center shrink-0 shadow-sm">
          <Icon className="w-4 h-4 text-[#fea520]" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-sm font-bold text-slate-800 mt-1 truncate">{value ?? "—"}</p>
      </div>
    </div>
  );
}

// ─── Custom Premium Card Layout ──────────────────────────────────────────────

interface PremiumCardProps {
  title: string;
  subtitle?: string;
  icon: any;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

function PremiumCard({ title, subtitle, icon: Icon, actions, children }: PremiumCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#c4c6cd] shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#c4c6cd]/50 bg-gradient-to-r from-[#eefcfd]/20 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#041627] text-white flex items-center justify-center shadow-inner">
            <Icon className="w-4 h-4 text-[#fea520]" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#041627] tracking-tight">{title}</h3>
            {subtitle && (
              <p className="text-[10px] text-[#44474c]/70 leading-none mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: customer, isLoading, isError } = useCustomer(id);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <BackButton href="/admin/customers" label="Clientes" />
        <div className="bg-white rounded-2xl border border-[#c4c6cd] p-8 shadow-sm flex flex-col items-center justify-center gap-3 min-h-[300px]">
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-[#041627] shrink-0 animate-pulse">
            <User className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-sm text-slate-400 font-bold animate-pulse">Cargando datos del cliente...</p>
        </div>
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="space-y-5">
        <BackButton href="/admin/customers" label="Clientes" />
        <div className="bg-white rounded-2xl border border-red-200 p-8 shadow-sm flex flex-col items-center justify-center gap-3 min-h-[300px] text-center">
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
            <User className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-sm text-red-600 font-bold">No se pudo cargar el perfil del cliente.</p>
        </div>
      </div>
    );
  }

  const initials = `${customer.firstName[0] ?? ""}${customer.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="space-y-3">
        <BackButton href="/admin/customers" label="Clientes" />
        
        {/* Dynamic Ticket Header Card */}
        <div className="bg-white rounded-2xl border border-[#c4c6cd] border-l-4 border-l-[#041627] shadow-sm p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 hover:shadow-md">
          <div className="flex items-center gap-4">
            {/* Custom high-contrast brand avatar */}
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-black shadow-inner shrink-0 ${
              customer.fleetId
                ? "bg-[#041627] text-[#fea520] border border-[#041627]"
                : "bg-[#eefcfd] border-2 border-[#041627]/10 text-[#041627]"
            }`}>
              {initials}
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-[#041627] tracking-tight leading-tight">
                {customer.firstName} {customer.lastName}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-bold mt-1.5 leading-none">
                <span className="text-slate-400 font-semibold">Ficha de Cliente</span>
                <span className="text-slate-300 font-normal select-none">•</span>
                {customer.fleetId ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#041627] text-white text-[10px] uppercase font-extrabold tracking-wider">
                    <span className="w-1 h-1 rounded-full bg-[#fea520] animate-pulse" />
                    Flota
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] uppercase font-extrabold tracking-wider">
                    <span className="w-1 h-1 rounded-full bg-emerald-500" />
                    Particular
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda — 2/3 */}
        <div className="lg:col-span-2 space-y-6">

          {/* Datos de contacto */}
          <PremiumCard 
            title="Datos de contacto" 
            subtitle="Información básica para comunicación del taller."
            icon={User}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <InfoRow
                  label="Nombre completo"
                  value={`${customer.firstName} ${customer.lastName}`}
                  icon={User}
                />
              </div>
              <InfoRow label="Email corporativo / personal" value={customer.email} icon={Mail} />
              <InfoRow label="Teléfono de contacto" value={customer.phone} icon={Phone} />
            </div>
          </PremiumCard>

          {/* Documento de Identidad */}
          <PremiumCard 
            title="Documento de Identidad" 
            subtitle="Datos de facturación e identificación oficial."
            icon={CreditCard}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <InfoRow
                label="Tipo de identificación"
                value={DocumentTypeLabel[customer.documentType]}
                icon={CreditCard}
              />
              <InfoRow label="Número de documento" value={customer.documentNumber} icon={CreditCard} />
            </div>
          </PremiumCard>
        </div>

        {/* Columna derecha — 1/3 */}
        <div className="space-y-6">
          {/* Flota (solo si aplica) */}
          {customer.fleetId && (
            <PremiumCard 
              title="Flota Asociada" 
              subtitle="Cuenta vinculada a una flota corporativa."
              icon={Building2}
            >
              <div className="space-y-2">
                <p className="text-xs text-slate-400 font-semibold">Identificación de Empresa</p>
                <Link
                  href={`/admin/fleets/${customer.fleetId}`}
                  className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                >
                  Ver empresa patrocinadora
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </PremiumCard>
          )}

          {/* Vehículos */}
          <PremiumCard 
            title="Vehículos" 
            subtitle="Flota privada de este cliente."
            icon={Car}
            actions={
              <Link
                href={`/admin/customers/${customer.id}/add-vehicle`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fea520] text-[#041627] text-xs font-bold hover:bg-[#865300] hover:text-white transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Registrar
              </Link>
            }
          >
            <div className="pt-1">
              <Link
                href={`/admin/vehicles?customerId=${customer.id}`}
                className="inline-flex items-center justify-between w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#041627] font-bold bg-slate-50 hover:bg-[#eefcfd]/30 hover:border-[#041627] transition-all group"
              >
                <span>Ver vehículos registrados</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 group-hover:text-[#041627] transition-all" />
              </Link>
            </div>
          </PremiumCard>

          {/* Órdenes de trabajo */}
          <PremiumCard 
            title="Órdenes de Trabajo" 
            subtitle="Historial técnico en nuestro taller."
            icon={ClipboardList}
          >
            <div className="pt-1">
              <Link
                href={`/admin/work-orders?customerId=${customer.id}`}
                className="inline-flex items-center justify-between w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-blue-600 font-bold bg-slate-50 hover:bg-blue-50/40 hover:border-blue-500 transition-all group"
              >
                <span>Historial de órdenes</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 group-hover:text-blue-600 transition-all" />
              </Link>
            </div>
          </PremiumCard>

          {/* Acceso */}
          <PremiumCard 
            title="Seguridad y Acceso" 
            subtitle="Control de claves para la app cliente."
            icon={Key}
          >
            <div className="space-y-3">
              <p className="text-xs text-[#44474c]/80 leading-relaxed font-semibold">
                ¿El cliente olvidó su contraseña? Generá una clave temporal para que restablezca su acceso al instante.
              </p>
              <ResetPasswordButton
                applicationUserId={customer.applicationUserId}
                userDisplayName={`${customer.firstName} ${customer.lastName}`}
                variant="full"
              />
            </div>
          </PremiumCard>

          {/* Metadata */}
          <PremiumCard 
            title="Sistema" 
            subtitle="Fechas de registro en base de datos."
            icon={Calendar}
          >
            <div className="grid grid-cols-1 gap-2.5">
              <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                <span className="text-slate-400 font-bold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-300" />
                  Alta en sistema
                </span>
                <span className="text-slate-800 font-bold">
                  {new Date(customer.createdAt).toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-400 font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-300" />
                  Último cambio
                </span>
                <span className="text-slate-800 font-bold">
                  {new Date(customer.updatedAt).toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </PremiumCard>
        </div>
      </div>
    </div>
  );
}
