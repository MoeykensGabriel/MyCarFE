"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut,
  ClipboardList,
  ClipboardCheck,
  HandCoins,
  type LucideIcon,
} from "lucide-react";

import { SessionGuard } from "@/components/shared/SessionGuard";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth.store";
import { UserRole } from "@/lib/enums";
import { useAvailableServices } from "@/hooks/useMechanicTasks";

const NAV_TABS: { href: string; label: string; Icon: LucideIcon; key: string }[] = [
  { href: "/mechanic/tasks",       label: "Mis trabajos", Icon: ClipboardList,  key: "tasks" },
  { href: "/mechanic/available",   label: "Disponibles",  Icon: HandCoins,      key: "available" },
  { href: "/mechanic/inspections", label: "Inspecciones", Icon: ClipboardCheck, key: "inspections" },
];

function MechanicLayoutInner({ children }: { children: React.ReactNode }) {
  const router    = useRouter();
  const pathname  = usePathname();
  const { logout } = useAuth();
  const role      = useAuthStore((s) => s.role);
  const fullName  = useAuthStore((s) => s.fullName);

  // Contador para el badge del tab "Disponibles". Solo se consulta si el usuario
  // es mecánico (el endpoint lo exige y el guard ya lo asegura).
  const { data: availableServices } = useAvailableServices();
  const availableCount = availableServices?.length ?? 0;

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

      {/* ── Header Premium ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[#041627] text-white border-b border-[#fea520]/20 shadow-[0_4px_20px_rgba(4,22,39,0.15)]">
        <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 shadow-md shadow-[#fea520]/20">
              <Image src="/logoGB.png" alt="GB Service" width={32} height={32} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#fea520] leading-none">
                GB Service · Taller
              </p>
              <p className="text-xs font-semibold text-white/80 leading-none mt-1">{greeting}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-white/90 text-xs font-bold hover:bg-white/10 active:scale-[0.97] transition-all shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5 text-[#fea520]" />
            Salir
          </button>
        </div>
      </header>

      {/* ── Contenido ─────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-5 pb-24">
        {children}
      </main>

      {/* ── Barra Navegación Inferior (BottomNav) ─────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-md border-t border-[#c4c6cd]/40 safe-area-pb shadow-[0_-8px_30px_rgba(4,22,39,0.06)]">
        <div className="flex max-w-lg mx-auto px-4 justify-around items-center h-16">
          {NAV_TABS.map(({ href, label, Icon, key }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            const showBadge = key === "available" && availableCount > 0;
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex-1 flex flex-col items-center justify-center py-1 rounded-2xl transition-all duration-300 ${
                  active ? "text-[#fea520]" : "text-[#44474c]/70 hover:text-[#041627]"
                }`}
              >
                <div className={`relative flex flex-col items-center gap-0.5 transition-all duration-300 ${active ? "scale-105" : "active:scale-95"}`}>
                  <Icon
                    className={`w-5 h-5 transition-colors duration-300 ${active ? "text-[#fea520]" : "text-[#44474c]/70"}`}
                    strokeWidth={active ? 2.5 : 1.75}
                  />
                  {/* Badge contador: discreto, encima del ícono a la derecha */}
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-3 min-w-[16px] h-[16px] px-1 rounded-full bg-[#fea520] text-[#041627] text-[9px] font-black flex items-center justify-center shadow-md shadow-[#fea520]/40">
                      {availableCount > 9 ? "9+" : availableCount}
                    </span>
                  )}
                  <span className={`text-[10px] font-extrabold uppercase tracking-widest transition-colors duration-300 ${active ? "text-[#041627]" : "text-[#44474c]/60"}`}>
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
