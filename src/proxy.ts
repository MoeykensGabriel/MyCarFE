import { NextRequest, NextResponse } from "next/server";

// "/trip" es la estación pública de viajes (QR pegado en el auto): el chofer
// entra sin sesión — el token de la URL es la credencial, lo valida el backend.
const PUBLIC_ROUTES = ["/login", "/approve", "/trip"];

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

  // Rutas admin: solo Admin
  if (pathname.startsWith("/admin") && role !== "Admin") {
    return NextResponse.redirect(new URL("/login", request.url));
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
