"use client";

import { buildCredentialsMessage, toWhatsappNumber, whatsappUrlTo } from "@/lib/whatsapp";
import { WhatsappActionButton } from "@/components/shared/WhatsappActionButton";

interface SendCredentialsWhatsappButtonProps {
  /** Teléfono del cliente tal como está guardado. Si no se puede interpretar, no se ofrece el botón. */
  phone?: string | null;
  /** Nombre de pila, para el saludo del mensaje. */
  firstName?: string;
  /** Usuario de acceso (el mail de contacto). */
  email: string;
  password: string;
  /** true = la clave viene de un reseteo, no de un alta nueva. Cambia el texto del mensaje. */
  isReset?: boolean;
  /** "compact" para paneles laterales, "full" para fila completa. */
  variant?: "compact" | "full";
}

/**
 * Abre WhatsApp con las credenciales ya escritas en el chat del cliente.
 *
 * No manda nada solo: el envío lo confirma la persona desde WhatsApp, que además
 * puede revisar el mensaje antes. Es el reemplazo manual del mail de bienvenida
 * mientras el SMTP no sea confiable.
 */
export function SendCredentialsWhatsappButton({
  phone,
  firstName,
  email,
  password,
  isReset,
  variant = "full",
}: SendCredentialsWhatsappButtonProps) {
  // Sin un número interpretable no hay botón: es preferible que el mostrador
  // copie la clave a mano antes que abrir un chat con un número equivocado.
  if (!toWhatsappNumber(phone)) {
    return (
      <p className="text-[10px] text-[#44474c]/70 leading-relaxed">
        El cliente no tiene un teléfono válido para WhatsApp. Copiá los datos y pasáselos por otro medio.
      </p>
    );
  }

  function handleSend() {
    // window.location solo existe en el browser: se arma acá, no en el render.
    const url = whatsappUrlTo(
      phone,
      buildCredentialsMessage({
        firstName,
        email,
        password,
        loginUrl: `${window.location.origin}/login`,
        isReset,
      }),
    );
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <WhatsappActionButton
      label="Enviar por WhatsApp"
      onClick={handleSend}
      variant={variant}
    />
  );
}
