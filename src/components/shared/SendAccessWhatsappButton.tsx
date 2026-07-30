"use client";

import { buildAccessMessage, toWhatsappNumber, whatsappUrlTo } from "@/lib/whatsapp";
import {
  WhatsappActionButton,
  WhatsappUnavailableNote,
} from "@/components/shared/WhatsappActionButton";

interface SendAccessWhatsappButtonProps {
  /** Teléfono tal como está guardado. Si no se puede interpretar, no se ofrece el botón. */
  phone?: string | null;
  /** Nombre de pila, para el saludo del mensaje. */
  firstName?: string;
  /** Usuario de acceso (el mail de la cuenta). */
  email: string;
  /** A quién va: "customer" (default) o "staff" (mecánico/oficina). */
  audience?: "customer" | "staff";
  /** "compact" para paneles laterales, "full" para fila completa. */
  variant?: "compact" | "full";
}

/**
 * Reenvía el acceso por WhatsApp SIN tocar la cuenta: usuario, link para entrar y guía de
 * instalación.
 *
 * Es el botón para el caso frecuente —nunca le llegó el mensaje, o lo borró— donde resetear
 * la contraseña sería un daño gratuito: le rompería una clave que funciona. La contraseña no
 * viaja porque el sistema no la tiene (se guarda hasheada); si además la perdió, el camino es
 * el botón de resetear, que el mensaje le ofrece pedir.
 */
export function SendAccessWhatsappButton({
  phone,
  firstName,
  email,
  audience,
  variant = "full",
}: SendAccessWhatsappButtonProps) {
  if (!toWhatsappNumber(phone)) return <WhatsappUnavailableNote />;

  function handleSend() {
    // window.location solo existe en el browser: se arma acá, no en el render.
    const url = whatsappUrlTo(
      phone,
      buildAccessMessage({
        firstName,
        email,
        loginUrl: `${window.location.origin}/login`,
        audience,
      }),
    );
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <WhatsappActionButton label="Reenviar acceso" onClick={handleSend} variant={variant} />
  );
}
