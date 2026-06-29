import { NextRequest, NextResponse } from "next/server";

// "/trip" es la estación pública de viajes (QR pegado en el auto): el chofer
// entra sin sesión — el token de la URL es la credencial, lo valida el backend.
const PUBLIC_ROUTES = ["/login", "/approve", "/trip"];

// Sub-rutas del panel reservadas SOLO para Admin: información sensible (dashboard,
// ventas/comisiones), configuración de empresa (áreas, mecánicos, servicios), gestión
// de usuarios (recepcionistas) y ajustes. La oficina entra al resto del panel pero acá no.
const ADMIN_ONLY_PREFIXES = [
  "/admin/dashboard",
  "/admin/sales",
  "/admin/areas",
  "/admin/mechanics",
  "/admin/receptionists",
  "/admin/services",
  "/admin/settings",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas: siempre pasan
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // El token y role los guardamos en cookies para que el proxy
  // (que corre en Edge) los pueda leer sin acceso a localStorage
  const token = request.cookies.get("token")?.value;
  const role = request.cookies.get("role")?.value;

  // Sin token → login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Rutas del panel (/admin): entran Admin y Recepcionista (la oficina gestiona
  // órdenes, clientes, vehículos, flotas, calendario, stock e ingreso desde acá).
  if (pathname.startsWith("/admin")) {
    if (role !== "Admin" && role !== "Receptionist") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    // Sub-rutas sensibles: solo Admin. Al recepcionista lo mandamos a su landing operativo.
    if (
      role !== "Admin" &&
      ADMIN_ONLY_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))
    ) {
      return NextResponse.redirect(new URL("/admin/work-orders", request.url));
    }
  }

  // Rutas mechanic: solo Mechanic
  if (pathname.startsWith("/mechanic") && role !== "Mechanic") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Rutas reception: solo Receptionist y Admin
  if (pathname.startsWith("/reception") && role !== "Receptionist" && role !== "Admin") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Rutas customer: solo Customer
  if (
    (pathname.startsWith("/home") ||
      pathname.startsWith("/my-orders") ||
      pathname.startsWith("/my-vehicles") ||
      pathname.startsWith("/my-fleet") ||
      pathname.startsWith("/my-account")) &&
    role !== "Customer"
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Aplica a todas las rutas EXCEPTO:
     * - _next/static, _next/image (assets internos de Next.js)
     * - favicon.ico, archivos con extensión (imágenes, fuentes, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)).*)",
  ],
};
