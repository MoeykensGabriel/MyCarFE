"use client";

import Link from "next/link";
import {
  Building2, MapPin, Phone, Mail, Hash,
  Car, Tag, ClipboardList, ChevronRight, User, Sparkles
} from "lucide-react";

import { useFleetMine } from "@/hooks/useFleets";
import { UpcomingExpirationsBanner } from "@/components/vehicle-documents/UpcomingExpirationsBanner";
import { OpenTripsCard } from "@/components/vehicle-trips/OpenTripsCard";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="bg-white rounded-2xl border border-[#041627]/10 p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#c4c6cd]/30 shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-40 bg-[#c4c6cd]/40 rounded" />
            <div className="h-3 w-24 bg-[#c4c6cd]/30 rounded" />
          </div>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-3 w-20 bg-[#c4c6cd]/20 rounded" />
            <div className="h-3 w-32 bg-[#c4c6cd]/30 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Fila de dato ─────────────────────────────────────────────────────────────

function DataRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3.5 py-3.5 border-b border-[#041627]/5 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-[#eefcfd] border border-[#041627]/5 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-[#041627]/80" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#44474c]/65">{label}</p>
        <p className="text-xs font-bold text-[#041627] mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ─── Sección con título ───────────────────────────────────────────────────────

function Section({ icon: Icon, title, count, children }: {
  icon: React.ElementType;
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-[#041627]/10 shadow-sm overflow-hidden transition-all duration-300 hover:border-[#fea520]/20 hover:shadow-md">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#041627]/5 bg-gradient-to-r from-[#eefcfd] to-white">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-[#041627]" strokeWidth={2} />
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#041627]/80">{title}</p>
        </div>
        {count !== undefined && (
          <span className="text-[10px] font-extrabold text-[#041627] bg-[#fea520]/15 border border-[#fea520]/20 rounded-full px-2.5 py-0.5">
            {count}
          </span>
        )}
      </div>
      <div className="px-4 py-2">{children}</div>
    </section>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function MyFleetPage() {
  const { data: fleet, isLoading, isError } = useFleetMine();

  if (isLoading) return (
    <div className="space-y-4">
      <div className="h-6 w-32 bg-[#c4c6cd]/40 rounded animate-pulse" />
      <Skeleton />
    </div>
  );

  if (isError || !fleet) return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center mt-4">
      <p className="text-sm text-red-600 font-extrabold">No pudimos cargar los datos de tu empresa.</p>
      <p className="text-xs text-red-400 mt-1">Intentá recargar la página.</p>
    </div>
  );

  return (
    <div className="space-y-4.5 pb-12">

      {/* ── Título y Header Premium ─────────────────────────────────────────── */}
      <div className="bg-[#041627] text-white rounded-2xl p-5 shadow-md shadow-[#041627]/10 relative overflow-hidden">
        {/* Decoración circular de fondo */}
        <div className="absolute -right-10 -bottom-10 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-[#fea520]" />
            <h1 className="text-lg font-extrabold tracking-wide">Mi Empresa</h1>
          </div>
          <p className="text-xs font-semibold text-white/60 mt-1">Información corporativa y de flota</p>
        </div>
      </div>

      {/* ── Viajes en curso de toda la flota ────────────────────────────────── */}
      <OpenTripsCard />

      {/* ── Vencimientos de toda la flota ───────────────────────────────────── */}
      <UpcomingExpirationsBanner
        maxItems={50}
        title="Vencimientos de la flota"
        hideWhenEmpty={false}
      />

      {/* ── Header Empresa / Card Corporativa ────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#041627]/10 shadow-md relative overflow-hidden p-5">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#fea520]" />
        
        <div className="flex items-center gap-4 mb-5">
          <div className="w-13 h-13 rounded-xl bg-gradient-to-br from-[#041627] to-[#0a2540] text-[#fea520] flex items-center justify-center shrink-0 border border-[#fea520]/20 shadow-md shadow-[#041627]/10">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#fea520] animate-pulse" />
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#fea520]">Cuenta Corporativa</p>
            </div>
            <h2 className="text-base font-black text-[#041627] truncate mt-0.5">{fleet.companyName}</h2>
            {fleet.taxId && (
              <p className="text-[10px] font-bold font-mono text-[#44474c]/70 mt-1 bg-[#f4f6f8] px-2 py-0.5 rounded border border-[#041627]/5 w-fit">
                CUIT {fleet.taxId}
              </p>
            )}
          </div>
        </div>

        <div className="divide-y divide-[#041627]/5 border-t border-[#041627]/5">
          <DataRow icon={Hash}    label="Identificación Tributaria (CUIT)" value={fleet.taxId} />
          <DataRow icon={MapPin}  label="Domicilio Fiscal"                  value={fleet.address} />
          <DataRow icon={Phone}   label="Teléfono Corporativo"              value={fleet.phone} />
          <DataRow icon={Mail}    label="Email de la Empresa"                value={fleet.email} />
        </div>
      </div>

      {/* ── Contactos ───────────────────────────────────────────────────────── */}
      {fleet.contacts?.length > 0 && (
        <Section icon={User} title="Representantes Autorizados" count={fleet.contacts.length}>
          <div className="space-y-0.5 divide-y divide-[#041627]/5">
            {fleet.contacts.map((c) => (
              <div key={c.id} className="py-3.5 first:pt-1.5 last:pb-1.5">
                <p className="text-xs font-extrabold text-[#041627] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#fea520]" />
                  {c.firstName} {c.lastName}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 pl-3">
                  {c.email && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#44474c]">
                      <Mail className="w-3.5 h-3.5 text-[#e8951d]" />
                      {c.email}
                    </span>
                  )}
                  {c.phone && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#44474c]">
                      <Phone className="w-3.5 h-3.5 text-[#e8951d]" />
                      {c.phone}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Vehículos de la Flota ───────────────────────────────────────────── */}
      {fleet.vehicles?.length > 0 && (
        <Section icon={Car} title="Vehículos Registrados" count={fleet.vehicles.length}>
          <div className="space-y-0.5 divide-y divide-[#041627]/5">
            {fleet.vehicles.map((v) => {
              const initials = `${v.brand[0]}${v.model[0]}`.toUpperCase();
              return (
                <Link
                  key={v.id}
                  href={`/my-vehicles/${v.id}`}
                  className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-black/5 active:scale-[0.99] rounded-xl px-2 -mx-2 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#041627] to-[#0a2540] text-[#fea520] flex items-center justify-center text-xs font-black shrink-0 border border-[#fea520]/20 shadow">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-[#041627] truncate group-hover:text-[#fea520] transition-colors leading-tight">
                        {v.brand} {v.model}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono text-[#44474c]/85 mt-1 bg-[#f4f6f8] px-2 py-0.5 rounded border border-[#041627]/5">
                        <Tag className="w-3.5 h-3.5 text-[#44474c]/50" />
                        {v.licensePlate}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#c4c6cd] group-hover:text-[#fea520] group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              );
            })}
          </div>
        </Section>
      )}

      {/* ── Acceso Rápido a Órdenes ─────────────────────────────────────────── */}
      <Link
        href="/my-orders"
        className="flex items-center justify-between w-full bg-[#041627] text-white rounded-2xl p-4.5 hover:bg-[#0a2540] active:scale-[0.98] transition-all duration-300 shadow-md shadow-[#041627]/10 group border border-[#fea520]/15"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-105 transition-transform duration-300">
            <ClipboardList className="w-5 h-5 text-[#fea520]" />
          </div>
          <div className="text-left">
            <p className="text-xs font-black uppercase tracking-wider text-[#fea520]">Órdenes de Trabajo</p>
            <p className="text-[11px] text-white/70 font-semibold mt-0.5">Controlá los estados y presupuestos de la flota</p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
          <ChevronRight className="w-4 h-4 text-[#fea520]" />
        </div>
      </Link>

    </div>
  );
}
