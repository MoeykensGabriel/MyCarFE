import type { Metadata } from "next";
import Link from "next/link";

import { InstallGuide } from "@/components/shared/InstallGuide";

/**
 * Guía pública para dejar la app en la pantalla de inicio.
 *
 * Sin sesión a propósito: es el link que viaja en el WhatsApp de bienvenida y el que apunta
 * el QR del mostrador, así que tiene que abrir antes del primer ingreso. Está declarada como
 * ruta pública en src/proxy.ts.
 */
export const metadata: Metadata = {
  title: "Instalar GB Service",
  description: "Cómo dejar la app de GB Service en la pantalla de inicio de tu teléfono.",
};

export default function InstalarPage() {
  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center gap-5 px-4 py-10 overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at top left, #0d2744 0%, transparent 55%)," +
          "radial-gradient(ellipse at bottom right, #11526a 0%, transparent 55%)," +
          "linear-gradient(135deg, #0a1f35 0%, #041627 50%, #061f2e 100%)",
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-white/[0.02] blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-64 sm:w-80 h-64 sm:h-80 rounded-full bg-[#fea520]/[0.05] blur-3xl" />
      </div>

      <div className="relative w-full flex justify-center">
        <InstallGuide />
      </div>

      <Link
        href="/login"
        className="relative text-sm font-semibold text-white/70 hover:text-white transition-colors"
      >
        Ir a mi cuenta
      </Link>
    </main>
  );
}
