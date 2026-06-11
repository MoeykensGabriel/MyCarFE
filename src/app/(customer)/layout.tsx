"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, Car, LogOut, Settings } from "lucide-react";

import { SessionGuard } from "@/components/shared/SessionGuard";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth.store";
import { useSessionSync } from "@/hooks/useSessionSync";

// ─── Íconos de la barra inferior (BottomNav) ────────────────────────────────────────

function BottomNav() {
  const pathname = usePathname();

  // Tres destinos frecuentes. La configuración (perfil / empresa) vive arriba,
  // en el engranaje del header — no gasta un lugar de la barra.
  const tabs = [
    { href: "/home",        label: "Inicio",     Icon: Home          },
    { href: "/my-orders",   label: "Órdenes",    Icon: ClipboardList },
    { href: "/my-vehicles", label: "Vehículos",  Icon: Car           },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-md border-t border-[#c4c6cd]/40 safe-area-pb shadow-[0_-8px_30px_rgba(4,22,39,0.06)]">
      <div className="flex max-w-lg mx-auto px-4 justify-around items-center h-16">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-300 ${
                active ? "text-[#fea520]" : "text-[#44474c]/70 hover:text-[#041627]"
              }`}
            >
              <div className={`flex flex-col items-center gap-0.5 transition-all duration-300 ${active ? "scale-105" : "active:scale-95"}`}>
                <Icon 
                  className={`w-5 h-5 transition-colors duration-300 ${active ? "text-[#fea520]" : "text-[#44474c]/70"}`} 
                  strokeWidth={active ? 2.5 : 1.75} 
                />
                <span className={`text-[9px] font-extrabold uppercase tracking-widest transition-colors duration-300 ${active ? "text-[#041627]" : "text-[#44474c]/60"}`}>
                  {label}
                </span>
              </div>
              {active && (
                <span className="absolute -bottom-1.5 w-1.5 h-1.5 rounded-full bg-[#fea520] shadow-[0_0_8px_#fea520]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Layout principal ─────────────────────────────────────────────────────────

function CustomerLayoutInner({ children }: { children: React.ReactNode }) {
  useSessionSync(); // Hidrata fleetId desde /api/customers/me si el JWT no lo trae

  const { logout } = useAuth();
  const fullName = useAuthStore((s) => s.fullName);

  const greeting = fullName ? `Hola, ${fullName.split(" ")[0]}` : "Hola";

  return (
    <div className="min-h-screen bg-[#f4f6f8] flex flex-col">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[#041627] text-white border-b border-[#fea520]/20 shadow-[0_4px_20px_rgba(4,22,39,0.15)]">
        <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#fea520] to-[#fec15d] flex items-center justify-center shrink-0 shadow-md shadow-[#fea520]/20">
              <Car className="w-4.5 h-4.5 text-[#041627]" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#fea520] leading-none">MyCarApp</p>
              <p className="text-xs font-semibold text-white/80 leading-none mt-1">{greeting}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Configuración / perfil — reemplaza los tabs de cuenta del bottom nav */}
            <Link
              href="/my-account"
              aria-label="Configuración y perfil"
              className="flex items-center justify-center w-8 h-8 rounded-xl border border-white/10 bg-white/5 text-white/90 hover:bg-white/10 active:scale-[0.95] transition-all shadow-sm"
            >
              <Settings className="w-4 h-4 text-[#fea520]" />
            </Link>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-white/90 text-xs font-bold hover:bg-white/10 active:scale-[0.97] transition-all shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5 text-[#fea520]" />
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* ── Contenido ───────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-5 pb-24">
        {children}
      </main>

      {/* ── Barra inferior ──────────────────────────────────────────────────── */}
      <BottomNav />
    </div>
  );
}

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionGuard>
      <CustomerLayoutInner>{children}</CustomerLayoutInner>
    </SessionGuard>
  );
}
