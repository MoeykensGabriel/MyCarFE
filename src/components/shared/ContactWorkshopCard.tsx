"use client";

import { Phone, Mail, MessageCircle, HeadphonesIcon } from "lucide-react";

import {
  workshop,
  whatsappUrl,
  phoneUrl,
  emailUrl,
  buildOrderInquiryMessage,
} from "@/lib/workshop-contact";

interface ContactWorkshopCardProps {
  /**
   * Si se pasa, el mensaje pre-llenado de WhatsApp menciona la orden.
   * Ej: `{ orderId: "abc-123", vehicleLabel: "Toyota Corolla" }`.
   */
  orderContext?: {
    orderId: string;
    vehicleLabel?: string;
  };
  /** Título visible. Default: "¿Necesitás ayuda?" */
  title?: string;
  /** Subtítulo visible. Default genérico. */
  subtitle?: string;
}

/**
 * Card con botones rápidos de contacto: WhatsApp + Teléfono (+ Email opcional).
 * Cada botón solo aparece si la variable de entorno correspondiente está seteada.
 *
 * Si no hay ningún canal configurado, el componente no renderiza nada.
 */
export function ContactWorkshopCard({
  orderContext,
  title    = "¿Necesitás ayuda?",
  subtitle = "Contactá al taller para cualquier consulta.",
}: ContactWorkshopCardProps) {
  // Si no hay ningún canal configurado, no mostramos nada.
  if (!workshop.hasAnyChannel) return null;

  const message = orderContext
    ? buildOrderInquiryMessage(orderContext.orderId, orderContext.vehicleLabel)
    : `Hola${workshop.name ? ` ${workshop.name}` : ""}, quería hacer una consulta.`;

  const subject = orderContext
    ? `Consulta sobre orden #${orderContext.orderId.slice(0, 8).toUpperCase()}`
    : "Consulta desde la app";

  const waLink   = whatsappUrl(message);
  const telLink  = phoneUrl();
  const mailLink = emailUrl(subject);

  return (
    <section className="bg-white rounded-2xl border border-[#c4c6cd]/60 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 px-4 py-3 border-b border-[#c4c6cd]/40 bg-[#eefcfd]">
        <div className="w-9 h-9 rounded-lg bg-[#041627] text-[#fea520] flex items-center justify-center shrink-0">
          <HeadphonesIcon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#041627]">{title}</p>
          <p className="text-[11px] text-[#44474c] leading-tight mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* Botones de canales */}
      <div className="p-3 space-y-2">
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#25D366] text-white font-semibold text-sm hover:bg-[#1ebe5d] active:scale-[0.98] transition-all"
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span>Escribir por WhatsApp</span>
          </a>
        )}

        {telLink && (
          <a
            href={telLink}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#041627] text-white font-semibold text-sm hover:bg-[#0a2540] active:scale-[0.98] transition-all"
          >
            <Phone className="w-4 h-4 shrink-0" />
            <span>Llamar al taller</span>
            <span className="ml-auto text-[11px] font-normal text-white/70 truncate">
              {workshop.phone}
            </span>
          </a>
        )}

        {mailLink && (
          <a
            href={mailLink}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#eefcfd] border border-[#c4c6cd] text-[#041627] font-semibold text-sm hover:bg-[#c4c6cd]/30 transition-colors"
          >
            <Mail className="w-4 h-4 shrink-0 text-[#44474c]" />
            <span>Enviar email</span>
            <span className="ml-auto text-[11px] font-normal text-[#44474c] truncate">
              {workshop.email}
            </span>
          </a>
        )}
      </div>
    </section>
  );
}
