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
        // py-2.5 en mobile y py-2 de sm en adelante: en el bottom-sheet estos botones se
        // tocan con el dedo, y con py-2 el alto quedaba por debajo del área táctil cómoda.
        variant === "compact"
          ? "w-full flex items-center justify-center gap-1.5 py-2.5 sm:py-2 rounded-md text-xs font-bold bg-[#25d366] text-white hover:bg-[#1da851] disabled:opacity-40 transition-colors"
          : "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold bg-[#25d366] text-white hover:bg-[#1da851] disabled:opacity-40 transition-colors"
      }
    >
      <MessageCircle className={variant === "compact" ? "w-3.5 h-3.5" : "w-4 h-4"} />
      {label}
    </button>
  );
}

/**
 * Reemplazo del botón cuando el teléfono guardado no se puede interpretar. Vive acá al lado
 * del botón porque es su otra cara: o se ofrece el envío, o se explica por qué no.
 *
 * Es preferible que el mostrador pase los datos por otro medio antes que abrir un chat con
 * un número equivocado.
 */
export function WhatsappUnavailableNote({ children }: { children?: React.ReactNode }) {
  return (
    <p className="text-[10px] text-[#44474c]/70 leading-relaxed">
      {children ??
        "No hay un teléfono válido para WhatsApp. Copiá los datos y pasáselos por otro medio."}
    </p>
  );
}
