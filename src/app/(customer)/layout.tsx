"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Car, LogOut, Building2, UserCircle } from "lucide-react";

import { SessionGuard } from "@/components/shared/SessionGuard";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth.store";
import { useSessionSync } from "@/hooks/useSessionSync";

// ─── Íconos de la barra inferior ──────────────────────────────────────────────

function BottomNav({ isFleet }: { isFleet: boolean }) {
  const pathname = usePathname();

  const tabs = [
    { href: "/my-orders",   label: "Órdenes",   Icon: ClipboardList },
    { href: "/my-vehicles", label: "Vehículos",  Icon: Car           },
    ...(isFleet ? [{ href: "/my-fleet", label: "Mi empresa", Icon: Building2 }] : []),
    { href: "/my-account",  label: "Perfil",     Icon: UserCircle    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-[#c4c6cd]/60 safe-area-pb">
      <div className="flex max-w-lg mx-auto">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                active ? "text-[#fea520]" : "text-[#44474c]/60 hover:text-[#041627]"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "text-[#fea520]" : ""}`} strokeWidth={active ? 2.5 : 1.75} />
              {label}
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
  const fleetId  = useAuthStore((s) => s.fleetId);
  const fullName = useAuthStore((s) => s.fullName);
  const isFleet  = !!fleetId;

  const greeting = fullName ? `Hola, ${fullName.split(" ")[0]}` : "Hola";

  return (
    <div className="min-h-screen bg-[#f4f6f8] flex flex-col">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-[#041627] text-white shadow-md">
        <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#fea520] flex items-center justify-center shrink-0">
              <Car className="w-4 h-4 text-[#041627]" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#fea520] leading-none">MyCarApp</p>
              <p className="text-xs text-white/70 leading-none mt-0.5">{greeting}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 text-white/80 text-xs font-semibold hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Salir
          </button>
        </div>
      </header>

      {/* ── Contenido ───────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-5 pb-24">
        {children}
      </main>

      {/* ── Barra inferior ──────────────────────────────────────────────────── */}
      <BottomNav isFleet={isFleet} />
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
