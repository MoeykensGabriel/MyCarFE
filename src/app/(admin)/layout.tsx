"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Wrench,
  LayoutDashboard,
  ClipboardList,
  Users,
  Car,
  Truck,
  ListChecks,
  Settings,
  Plus,
  Menu,
  X,
  ConciergeBell,
  Layers,
  Package,
  CalendarDays,
  Building2,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";

import { SessionGuard } from "@/components/shared/SessionGuard";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  href?: string;
  label: string;
  Icon: LucideIcon;
  subItems?: { href: string; label: string; Icon: LucideIcon }[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard",   label: "Dashboard",          Icon: LayoutDashboard },
  { href: "/admin/work-orders", label: "Órdenes de trabajo", Icon: ClipboardList   },
  { href: "/admin/calendar",    label: "Calendario",         Icon: CalendarDays    },
  { href: "/admin/customers",   label: "Clientes",           Icon: Users           },
  { href: "/admin/vehicles",    label: "Vehículos",          Icon: Car             },
  { href: "/admin/fleets",      label: "Flotas",             Icon: Truck           },
  {
    label: "Empresa",
    Icon: Building2,
    subItems: [
      { href: "/admin/areas",          label: "Áreas",              Icon: Layers          },
      { href: "/admin/mechanics",      label: "Mecánicos",          Icon: Wrench          },
      { href: "/admin/receptionists",  label: "Recepcionistas",     Icon: ConciergeBell   },
      { href: "/admin/services",       label: "Servicios",          Icon: ListChecks      },
    ]
  },
  { href: "/admin/stock",          label: "Stock",              Icon: Package         },
  { href: "/admin/settings",    label: "Configuración",      Icon: Settings        },
];

const INTAKE_HREF = "/admin/intake";

// ─── Sidebar (contenido compartido entre desktop y drawer móvil) ──────────────

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    NAV_ITEMS.forEach((item) => {
      if (item.subItems) {
        const hasActiveSubItem = item.subItems.some(
          (sub) => pathname === sub.href || pathname.startsWith(sub.href + "/")
        );
        initial[item.label] = hasActiveSubItem;
      }
    });
    return initial;
  });

  useEffect(() => {
    NAV_ITEMS.forEach((item) => {
      if (item.subItems) {
        const hasActiveSubItem = item.subItems.some(
          (sub) => pathname === sub.href || pathname.startsWith(sub.href + "/")
        );
        if (hasActiveSubItem) {
          setOpenMenus((prev) => {
            if (!prev[item.label]) {
              return { ...prev, [item.label]: true };
            }
            return prev;
          });
        }
      }
    });
  }, [pathname]);

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  return (
    <>
      {/* Brand */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-[#fea520] shrink-0" />
          <span className="text-lg font-bold tracking-tight text-white">MyCarApp</span>
        </div>
        <p className="text-[11px] text-white/40 mt-0.5 ml-7">Panel Admin</p>
      </div>

      {/* CTA */}
      <div className="px-4 pb-4">
        <Link
          href={INTAKE_HREF}
          onClick={onNavClick}
          className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-md text-sm font-semibold bg-[#fea520] text-[#041627] hover:bg-[#865300] hover:text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo ingreso
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          if (item.subItems) {
            const isOpen = !!openMenus[item.label];
            const isAnySubActive = item.subItems.some(
              (sub) => pathname === sub.href || pathname.startsWith(sub.href + "/")
            );

            return (
              <div key={item.label} className="space-y-0.5">
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isAnySubActive
                      ? "bg-white/5 text-white"
                      : "text-white/60 hover:bg-white/7 hover:text-white/90"
                  }`}
                >
                  <item.Icon className="w-4 h-4 shrink-0 text-white/70" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 shrink-0 ${
                      isOpen ? "rotate-180 text-white" : "text-white/40"
                    }`}
                  />
                </button>

                {/* Submenu with height transition */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out pl-3 ml-5 border-l border-white/10 space-y-0.5 ${
                    isOpen ? "max-h-48 opacity-100 py-1" : "max-h-0 opacity-0 pointer-events-none"
                  }`}
                >
                  {item.subItems.map((sub) => {
                    const isSubActive = pathname === sub.href || pathname.startsWith(sub.href + "/");
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={onNavClick}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                          isSubActive
                            ? "bg-white/10 text-white font-semibold"
                            : "text-white/50 hover:bg-white/5 hover:text-white/80"
                        }`}
                      >
                        <sub.Icon className="w-3.5 h-3.5 shrink-0" />
                        <span>{sub.label}</span>
                        {isSubActive && (
                          <span className="ml-auto w-1 h-3 rounded-full bg-[#fea520] shrink-0" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }

          const isActive = item.href && (pathname === item.href || pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href || "#"}
              onClick={onNavClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/7 hover:text-white/90"
              }`}
            >
              <item.Icon className="w-4 h-4 shrink-0 text-white/70" />
              <span className="flex-1 text-left">{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1 h-4 rounded-full bg-[#fea520] shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 pb-5 pt-4 border-t border-white/8">
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

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <SessionGuard>
      <div className="flex min-h-screen lg:h-screen lg:overflow-hidden bg-[#eefcfd]">

        {/* ── Sidebar desktop (lg+) ─────────────────────────────────────── */}
        <aside className="hidden lg:flex lg:w-56 flex-col shrink-0 bg-[#041627] text-white/85 h-screen sticky top-0">
          <SidebarContent />
        </aside>

        {/* ── Drawer móvil ─────────────────────────────────────────────── */}

        {/* Overlay */}
        {drawerOpen && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
        )}

        {/* Drawer panel */}
        <aside
          className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-[#041627] text-white/85 transition-transform duration-300 ease-in-out ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Botón cerrar */}
          <button
            onClick={() => setDrawerOpen(false)}
            className="absolute top-4 right-4 p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <SidebarContent onNavClick={() => setDrawerOpen(false)} />
        </aside>

        {/* ── Contenido principal ───────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 lg:overflow-hidden">

          {/* Header móvil */}
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

          <main className="flex-1 p-4 lg:p-8 lg:overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SessionGuard>
  );
}
