"use client";

import { useState } from "react";

import { WhatsappActionButton } from "@/components/shared/WhatsappActionButton";
import { useCustomer } from "@/hooks/useCustomers";
import { useFleet } from "@/hooks/useFleets";
import { useQuoteApprovalLink } from "@/hooks/useWorkOrders";
import { buildQuoteMessage, toWhatsappNumber, whatsappUrlTo } from "@/lib/whatsapp";
import { WorkOrder } from "@/types/api.types";

interface Props {
  order: WorkOrder;
  /**
   * "send"   → recién se envió el presupuesto; es la primera vez por este canal.
   * "resend" → el presupuesto ya salió y esto insiste con el mismo link.
   */
  mode: "send" | "resend";
}

/** Destinatario posible del mensaje. */
interface Recipient {
  phone: string;
  /** Cómo se muestra en el selector: "Gabriel Moeykens", "Quien trajo el vehículo". */
  label: string;
  firstName?: string;
}

/**
 * Manda el presupuesto por WhatsApp: avisa que está listo y pasa el link para
 * verlo y aprobarlo. El link es el mismo que viaja en el mail — pedirlo no genera
 * uno nuevo, así que el que el cliente ya tenga sigue funcionando.
 *
 * No manda solo: abre WhatsApp con el mensaje escrito y la persona confirma.
 */
export function SendQuoteWhatsappButton({ order, mode }: Props) {
  const isFleet = !!order.fleetIdAtEntry;

  const { data: customer } = useCustomer(order.customerIdAtEntry ?? "");
  const { data: fleet }    = useFleet(order.fleetIdAtEntry ?? "");
  const { data: link, isLoading, isError } = useQuoteApprovalLink(order.id, true);

  // Titular de la cuenta (cliente o empresa) y, si es otro, quien trajo el auto.
  // En un taller es habitual que lo traiga un tercero, y a veces es el único
  // número por el que se puede contactar al dueño.
  const registered: Recipient | null = isFleet
    ? fleet?.phone
      ? { phone: fleet.phone, label: fleet.companyName }
      : null
    : customer?.phone
      ? {
          phone: customer.phone,
          label: `${customer.firstName} ${customer.lastName}`.trim(),
          firstName: customer.firstName,
        }
      : null;

  const contact: Recipient | null = order.contactPersonPhone
    ? {
        phone: order.contactPersonPhone,
        label: order.contactPersonName?.trim() || "Quien trajo el vehículo",
        firstName: order.contactPersonName?.trim().split(" ")[0],
      }
    : null;

  // Solo números que WhatsApp pueda abrir, y sin repetir el mismo teléfono escrito
  // de dos formas distintas ("0381 15..." y "+54 9 381...").
  const recipients: Recipient[] = [];
  for (const candidate of [registered, contact]) {
    if (!candidate) continue;
    const normalized = toWhatsappNumber(candidate.phone);
    if (!normalized) continue;
    if (recipients.some((r) => toWhatsappNumber(r.phone) === normalized)) continue;
    recipients.push(candidate);
  }

  const [selected, setSelected] = useState(0);
  const recipient = recipients[selected] ?? recipients[0];

  if (isLoading) {
    return <p className="text-[11px] text-muted-foreground">Buscando el link de aprobación...</p>;
  }

  if (isError || !link?.approvalLink) {
    return (
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Esta orden no tiene un link de aprobación activo. Puede que el presupuesto todavía
        no se haya enviado, que haya vencido, o que el cliente ya haya decidido.
      </p>
    );
  }

  if (!recipient) {
    return (
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        No hay un teléfono válido para WhatsApp{isFleet ? " en la empresa" : " en el cliente"}.
        Cargalo en su ficha o pasale el link por otro medio.
      </p>
    );
  }

  // Capturado después de los guards de arriba: acá ya sabemos que existe.
  const approvalLink = link.approvalLink;

  function handleSend() {
    const url = whatsappUrlTo(
      recipient.phone,
      buildQuoteMessage({
        firstName:    recipient.firstName,
        vehicleLabel: [order.vehicleBrand, order.vehicleModel].filter(Boolean).join(" ") || "vehículo",
        licensePlate: order.vehicleLicensePlate,
        approvalLink,
        isResend:     mode === "resend",
        isFleet,
      }),
    );
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-2">
      {/* Selector solo si hay dos números distintos a dónde mandarlo */}
      {recipients.length > 1 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">
            Enviar a
          </p>
          <div className="flex flex-wrap gap-1.5">
            {recipients.map((r, i) => (
              <button
                key={r.phone}
                type="button"
                onClick={() => setSelected(i)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  i === selected
                    ? "bg-[#041627] text-white border-[#041627]"
                    : "bg-white text-[#44474c] border-[#c4c6cd] hover:border-[#041627]"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <WhatsappActionButton
        label={mode === "resend" ? "Reenviar" : "Enviar por WhatsApp"}
        onClick={handleSend}
      />
    </div>
  );
}
