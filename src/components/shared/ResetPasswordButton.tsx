"use client";

import { useState } from "react";
import { KeyRound, Check, AlertCircle, Copy, X } from "lucide-react";

import { useAdminResetPassword } from "@/hooks/useAdminResetPassword";
import { SendCredentialsWhatsappButton } from "@/components/shared/SendCredentialsWhatsappButton";

interface ResetPasswordButtonProps {
  /** ApplicationUserId del usuario al que se le va a resetear la contraseña. */
  applicationUserId: string;
  /** Nombre que se muestra en la confirmación (ej: "Juan Pérez"). */
  userDisplayName: string;
  /** Estilo del botón. "compact" para paneles laterales, "full" para fila completa. */
  variant?: "compact" | "full";
  /**
   * Email y teléfono del usuario. Si vienen los dos, se ofrece mandar las
   * credenciales por WhatsApp; si no, queda solo el copiar al portapapeles.
   */
  userEmail?: string;
  phone?: string | null;
  /** Nombre de pila, para el saludo del mensaje de WhatsApp. */
  firstName?: string;
}

/**
 * Botón con flujo en 3 pasos:
 * 1. Click → muestra confirmación inline
 * 2. Confirmar → llama al endpoint y muestra la pass temporal
 * 3. Cerrar → vuelve al estado inicial
 *
 * No copia automáticamente al portapapeles para que el admin pueda decidir
 * cuándo y dónde pegarla.
 */
export function ResetPasswordButton({
  applicationUserId,
  userDisplayName,
  variant = "full",
  userEmail,
  phone,
  firstName,
}: ResetPasswordButtonProps) {
  const [step, setStep] = useState<"idle" | "confirm" | "done">("idle");
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = useAdminResetPassword();

  function handleConfirm() {
    reset.mutate(applicationUserId, {
      onSuccess: (data) => {
        setTempPassword(data.tempPassword);
        setStep("done");
      },
    });
  }

  function handleClose() {
    setStep("idle");
    setTempPassword(null);
    setCopied(false);
  }

  async function handleCopy() {
    if (!tempPassword) return;
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // navigator.clipboard puede fallar en contextos no seguros
    }
  }

  // ── Paso 1: botón inicial ────────────────────────────────────────────────
  if (step === "idle") {
    return (
      <button
        onClick={() => setStep("confirm")}
        className={
          variant === "compact"
            ? "w-full flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-bold bg-[#eefcfd] text-[#041627] border border-[#c4c6cd] hover:bg-[#c4c6cd]/30 transition-colors"
            : "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-[#041627] bg-[#eefcfd] border border-[#c4c6cd]/60 hover:bg-[#c4c6cd]/30 transition-colors"
        }
      >
        <KeyRound className="w-3.5 h-3.5" />
        Resetear contraseña
      </button>
    );
  }

  // ── Paso 2: confirmación ─────────────────────────────────────────────────
  if (step === "confirm") {
    return (
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-2">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 leading-relaxed">
            Vas a generar una nueva contraseña temporal para{" "}
            <strong>{userDisplayName}</strong>. La actual dejará de funcionar.
            ¿Confirmás?
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={reset.isPending}
            className="flex-1 py-2 rounded-md text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            {reset.isPending ? "Generando..." : "Sí, resetear"}
          </button>
          <button
            onClick={handleClose}
            disabled={reset.isPending}
            className="flex-1 py-2 rounded-md text-xs font-bold bg-white border border-[#c4c6cd] text-[#041627] hover:bg-[#eefcfd] transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  // ── Paso 3: pass generada ────────────────────────────────────────────────
  return (
    <div className="rounded-lg bg-green-50 border border-green-200 p-3 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
          <p className="text-xs text-green-900 leading-relaxed">
            Nueva contraseña temporal de <strong>{userDisplayName}</strong>:
          </p>
        </div>
        <button
          onClick={handleClose}
          className="p-0.5 rounded text-green-700 hover:bg-green-100 transition-colors shrink-0"
          aria-label="Cerrar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-2 rounded bg-white border border-green-200 px-3 py-2">
        <p className="flex-1 text-sm font-mono font-bold text-[#041627] tracking-widest truncate">
          {tempPassword}
        </p>
        <button
          onClick={handleCopy}
          className="p-1 rounded text-[#44474c] hover:bg-[#eefcfd] transition-colors shrink-0"
          aria-label="Copiar"
          title={copied ? "Copiado" : "Copiar"}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-600" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {userEmail && tempPassword && (
        <SendCredentialsWhatsappButton
          phone={phone}
          firstName={firstName}
          email={userEmail}
          password={tempPassword}
          isReset
          variant={variant}
        />
      )}

      <p className="text-[10px] text-green-700/80">
        Compartila por canal seguro. El usuario debería cambiarla al ingresar.
      </p>
    </div>
  );
}
