"use client";

import Link from "next/link";
import {
  Building2, MapPin, Phone, Mail, Hash,
  Car, Tag, ClipboardList, ChevronRight, User,
} from "lucide-react";

import { useFleetMine } from "@/hooks/useFleets";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="bg-white rounded-2xl border border-[#c4c6cd]/60 p-5 space-y-4">
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
    <div className="flex items-start gap-3 py-2.5 border-b border-[#c4c6cd]/30 last:border-0">
      <Icon className="w-4 h-4 text-[#44474c]/50 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#44474c]/60">{label}</p>
        <p className="text-sm font-semibold text-[#041627] mt-0.5">{value}</p>
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
    <section className="bg-white rounded-2xl border border-[#c4c6cd]/60 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#c4c6cd]/40 bg-[#eefcfd]">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-[#44474c]/60" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">{title}</p>
        </div>
        {count !== undefined && (
          <span className="text-[10px] font-bold text-[#041627] bg-white border border-[#c4c6cd]/60 rounded-full px-2 py-0.5">
            {count}
          </span>
        )}
      </div>
      <div className="px-4 py-1">{children}</div>
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
    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mt-4">
      <p className="text-sm text-red-600 font-medium">No pudimos cargar los datos de tu empresa.</p>
      <p className="text-xs text-red-400 mt-0.5">Intentá recargar la página.</p>
    </div>
  );

  return (
    <div className="space-y-4">

      {/* ── Título ──────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-[#041627]">Mi empresa</h1>
        <p className="text-sm text-[#44474c] mt-0.5">Información de tu flota</p>
      </div>

      {/* ── Header empresa ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#c4c6cd]/60 shadow-sm p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-[#041627] text-white flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#041627] truncate">{fleet.companyName}</h2>
            {fleet.taxId && (
              <p className="text-xs font-mono text-[#44474c] mt-0.5">CUIT {fleet.taxId}</p>
            )}
          </div>
        </div>

        <div className="divide-y divide-[#c4c6cd]/30">
          <DataRow icon={Hash}    label="CUIT"      value={fleet.taxId} />
          <DataRow icon={MapPin}  label="Dirección" value={fleet.address} />
          <DataRow icon={Phone}   label="Teléfono"  value={fleet.phone} />
          <DataRow icon={Mail}    label="Email"     value={fleet.email} />
        </div>
      </div>

      {/* ── Contactos ───────────────────────────────────────────────────────── */}
      {fleet.contacts?.length > 0 && (
        <Section icon={User} title="Contactos" count={fleet.contacts.length}>
          {fleet.contacts.map((c, i) => (
            <div
              key={c.id}
              className={`py-3 ${i < fleet.contacts.length - 1 ? "border-b border-[#c4c6cd]/30" : ""}`}
            >
              <p className="text-sm font-semibold text-[#041627]">
                {c.firstName} {c.lastName}
              </p>
              <div className="flex flex-wrap gap-3 mt-1">
                {c.email && (
                  <span className="inline-flex items-center gap-1 text-xs text-[#44474c]">
                    <Mail className="w-3 h-3 text-[#44474c]/50" />
                    {c.email}
                  </span>
                )}
                {c.phone && (
                  <span className="inline-flex items-center gap-1 text-xs text-[#44474c]">
                    <Phone className="w-3 h-3 text-[#44474c]/50" />
                    {c.phone}
                  </span>
                )}
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* ── Vehículos ───────────────────────────────────────────────────────── */}
      {fleet.vehicles?.length > 0 && (
        <Section icon={Car} title="Vehículos de la flota" count={fleet.vehicles.length}>
          {fleet.vehicles.map((v, i) => (
            <Link
              key={v.id}
              href={`/my-vehicles/${v.id}`}
              className={`flex items-center justify-between gap-3 py-3 transition-colors hover:opacity-70 ${
                i < fleet.vehicles.length - 1 ? "border-b border-[#c4c6cd]/30" : ""
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#041627] text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {`${v.brand[0]}${v.model[0]}`.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#041627] truncate">
                    {v.brand} {v.model}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-mono text-[#44474c]">
                    <Tag className="w-3 h-3 text-[#44474c]/50" />
                    {v.licensePlate}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#c4c6cd] shrink-0" />
            </Link>
          ))}
        </Section>
      )}

      {/* ── Acceso rápido a órdenes ─────────────────────────────────────────── */}
      <Link
        href="/my-orders"
        className="flex items-center justify-between w-full bg-white rounded-2xl border border-[#c4c6cd]/60 shadow-sm px-4 py-4 hover:border-[#fea520]/60 transition-all active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#eefcfd] border border-[#c4c6cd]/60 flex items-center justify-center shrink-0">
            <ClipboardList className="w-4 h-4 text-[#041627]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#041627]">Órdenes de trabajo</p>
            <p className="text-xs text-[#44474c]">Ver todas las órdenes de la flota</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-[#c4c6cd]" />
      </Link>

    </div>
  );
}
