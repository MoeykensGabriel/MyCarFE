"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Wrench, Plus, Menu, X } from "lucide-react";

import { SessionGuard } from "@/components/shared/SessionGuard";
import { useAuth } from "@/hooks/useAuth";

const INTAKE_HREF = "/reception/intake";

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();
  const { logout, fullName } = useAuth();

  const isIntakeActive = pathname === INTAKE_HREF || pathname.startsWith(INTAKE_HREF + "/");

  return (
    <>
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-[#fea520] shrink-0" />
          <span className="text-lg font-bold tracking-tight text-white">MyCarApp</span>
        </div>
        <p className="text-[11px] text-white/40 mt-0.5 ml-7">Recepción</p>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        <Link
          href={INTAKE_HREF}
          onClick={onNavClick}
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isIntakeActive
              ? "bg-[#fea520] text-[#041627]"
              : "bg-white/10 text-white hover:bg-white/15"
          }`}
        >
          <Plus className="w-4 h-4 shrink-0" />
          Nuevo ingreso
        </Link>
      </nav>

      <div className="px-4 pb-5 pt-4 border-t border-white/8">
        {fullName && (
          <p className="px-3 pb-2 text-xs text-white/40 truncate" title={fullName}>
            {fullName}
          </p>
        )}
        <button
          onClick={logout}
          className="w-full text-left px-3 py-2 rounded-md text-sm text-white/50 hover:bg-white/7 hover:text-white/80 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </>
  );
}

export default function ReceptionistLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <SessionGuard>
      <div className="flex min-h-screen lg:h-screen lg:overflow-hidden bg-[#eefcfd]">
        <aside className="hidden lg:flex lg:w-56 flex-col shrink-0 bg-[#041627] text-white/85 h-screen sticky top-0">
          <SidebarContent />
        </aside>

        {drawerOpen && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
        )}

        <aside
          className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-[#041627] text-white/85 transition-transform duration-300 ease-in-out ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <button
            onClick={() => setDrawerOpen(false)}
            className="absolute top-4 right-4 p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <SidebarContent onNavClick={() => setDrawerOpen(false)} />
        </aside>

        <div className="flex-1 flex flex-col min-w-0 lg:overflow-hidden">
          <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-[#041627] shrink-0">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#fea520]" />
              <span className="text-sm font-bold text-white">MyCarApp</span>
            </div>
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>
          </header>

          <main className="flex-1 p-4 lg:p-8 lg:overflow-y-auto">{children}</main>
        </div>
      </div>
    </SessionGuard>
  );
}
