"use client";

import { MessageCircle } from "lucide-react";

interface WhatsappActionButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** "compact" para paneles laterales y modales, "full" para fila completa. */
  variant?: "compact" | "full";
}

/**
 * Botón verde de WhatsApp. Solo presentación: quién arma el mensaje y a qué número
 * va lo decide cada llamador (credenciales, presupuesto, etc.).
 */
export function WhatsappActionButton({
  label,
  onClick,
  disabled,
  variant = "full",
}: WhatsappActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        variant === "compact"
          ? "w-full flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-bold bg-[#25d366] text-white hover:bg-[#1da851] disabled:opacity-40 transition-colors"
          : "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold bg-[#25d366] text-white hover:bg-[#1da851] disabled:opacity-40 transition-colors"
      }
    >
      <MessageCircle className={variant === "compact" ? "w-3.5 h-3.5" : "w-4 h-4"} />
      {label}
    </button>
  );
}
