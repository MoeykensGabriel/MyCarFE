"use client";

import { ResetPasswordButton } from "@/components/shared/ResetPasswordButton";
import { SendAccessWhatsappButton } from "@/components/shared/SendAccessWhatsappButton";

interface AccessActionsProps {
  /** ApplicationUserId del usuario — lo necesita el reseteo. */
  applicationUserId: string;
  /** Nombre completo, para la confirmación del reseteo. */
  userDisplayName: string;
  /** Nombre de pila, para el saludo del WhatsApp. */
  firstName?: string;
  /** Mail de la cuenta. Sin esto no se puede reenviar el acceso (es el usuario). */
  email?: string;
  /** Teléfono guardado. Sin uno interpretable, el botón se reemplaza por una aclaración. */
  phone?: string | null;
  /** "customer" (default) o "staff" (mecánico / recepcionista). */
  audience?: "customer" | "staff";
  /** "compact" para paneles y bottom-sheets, "full" para fichas anchas. */
  variant?: "compact" | "full";
  /** Título del bloque. `null` para no mostrarlo (cuando la tarjeta ya tiene el suyo). */
  title?: string | null;
}

/**
 * Las dos acciones de acceso, juntas y en el orden correcto.
 *
 * Son dos situaciones distintas y por eso son dos botones:
 *   - Reenviar acceso: el mensaje nunca llegó o lo borró, pero su contraseña funciona.
 *     No toca nada. Va primero porque es el inofensivo y el caso más común.
 *   - Resetear contraseña: además perdió la clave. Genera una nueva y rompe la anterior.
 *
 * Se apilan siempre, en cualquier ancho: el reseteo se despliega en confirmación y después
 * en el resultado con la clave, así que en fila haría saltar al botón de al lado. Apilados,
 * el bloque crece hacia abajo y en el bottom-sheet de mobile se lee igual que en desktop.
 */
export function AccessActions({
  applicationUserId,
  userDisplayName,
  firstName,
  email,
  phone,
  audience,
  variant = "compact",
  title = "Acceso",
}: AccessActionsProps) {
  return (
    <div className="space-y-2">
      {title && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">
          {title}
        </p>
      )}

      {email && (
        <SendAccessWhatsappButton
          phone={phone}
          firstName={firstName}
          email={email}
          audience={audience}
          variant={variant}
        />
      )}

      <ResetPasswordButton
        applicationUserId={applicationUserId}
        userDisplayName={userDisplayName}
        variant={variant}
        userEmail={email}
        phone={phone}
        firstName={firstName}
        audience={audience}
      />
    </div>
  );
}
