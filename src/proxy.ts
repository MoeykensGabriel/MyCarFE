import { NextRequest, NextResponse } from "next/server";

// "/trip" es la estación pública de viajes (QR pegado en el auto): el chofer
// entra sin sesión — el token de la URL es la credencial, lo valida el backend.
//
// "/instalar" es la guía para dejar la app en la pantalla de inicio. Va sin sesión a
// propósito: el cliente llega desde el link de WhatsApp antes de entrar por primera vez.
//
// "/manifest.webmanifest" y "/sw.js" NO son rutas de pantalla, pero pasan por acá igual:
// el matcher de abajo solo excluye imágenes y fuentes por extensión. Sin sesión, el guard
// los redirigía al login — y un manifest que responde 302 hace que Chrome considere la app
// NO instalable, así que en Android el botón de instalar no aparecía nunca. Tienen que ser
// públicos para que el navegador pueda leerlos antes del primer login.
const PUBLIC_ROUTES = [
  "/login",
  "/approve",
  "/trip",
  "/instalar",
  "/manifest.webmanifest",
  "/sw.js",
];

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
