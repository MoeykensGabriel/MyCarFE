"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Wrench, LogOut } from "lucide-react";

import { SessionGuard } from "@/components/shared/SessionGuard";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth.store";
import { UserRole } from "@/lib/enums";

function MechanicLayoutInner({ children }: { children: React.ReactNode }) {
  const router    = useRouter();
  const { logout } = useAuth();
  const role      = useAuthStore((s) => s.role);
  const fullName  = useAuthStore((s) => s.fullName);

  // Hard guard: si el usuario no es Mechanic, lo sacamos.
  useEffect(() => {
    if (role && role !== UserRole.Mechanic) {
      if (role === UserRole.Admin)  router.replace("/admin/dashboard");
      else                           router.replace("/my-orders");
    }
  }, [role, router]);

  const greeting = fullName ? `Hola, ${fullName.split(" ")[0]}` : "Hola";

  return (
    <div className="min-h-screen bg-[#f4f6f8] flex flex-col">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-[#041627] text-white shadow-md">
        <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#fea520] flex items-center justify-center shrink-0">
              <Wrench className="w-4 h-4 text-[#041627]" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#fea520] leading-none">
                MyCarApp · Taller
              </p>
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

      {/* ── Contenido ─────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-5 pb-10">
        {children}
      </main>
    </div>
  );
}

export default function MechanicLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionGuard>
      <MechanicLayoutInner>{children}</MechanicLayoutInner>
    </SessionGuard>
  );
}
