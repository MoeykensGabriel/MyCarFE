"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ChevronRight } from "lucide-react";
import { DocumentType } from "@/lib/enums";
import { Fleet } from "@/types/api.types";
import { useSearchFleets } from "@/hooks/useFleets";
import {
  cuitSchema,
  isDocumentValidForType,
  documentMessageForType,
  phoneSchema,
} from "@/lib/argentina-validation";
import { Field, Section, StepNav, Tag } from "./ui";
import { DOC_OPTIONS } from "./constants";
import { CustomerDraft, FleetAndContactDraft, FleetDraft } from "./types";

const fleetDraftSchema = z.object({
  companyName: z.string().min(1, "Ingresá la razón social"),
  taxId:       cuitSchema,
  phone:       phoneSchema,
  email:       z.string().email("Ingresá un email válido. Ej: empresa@ejemplo.com").optional().or(z.literal("")),
  address:     z.string().optional(),
});

const contactDraftSchema = z
  .object({
    firstName:      z.string().min(1, "Ingresá el nombre"),
    lastName:       z.string().min(1, "Ingresá el apellido"),
    documentType:   z.nativeEnum(DocumentType),
    documentNumber: z.string().min(1, "Ingresá el número de documento"),
    email:          z.string().min(1, "Ingresá el email").email("Ingresá un email válido. Ej: nombre@empresa.com"),
    phone:          phoneSchema,
  })
  .superRefine((data, ctx) => {
    if (!isDocumentValidForType(data.documentType, data.documentNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["documentNumber"],
        message: documentMessageForType(data.documentType),
      });
    }
  });

interface Props {
  defaultValues?: FleetAndContactDraft;
  onNext: (data: FleetAndContactDraft) => void;
  onBack: () => void;
}

export function StepFleet({ defaultValues, onNext, onBack }: Props) {
  const [search,           setSearch]           = useState("");
  const [selectedFleetId,  setSelectedFleetId]  = useState<string | null>(defaultValues?.existingFleetId ?? null);
  const [selectedFleetObj, setSelectedFleetObj] = useState<Fleet | null>(null);
  const [creatingNew,      setCreatingNew]      = useState(!defaultValues?.existingFleetId);

  const { data: searchResults, isFetching } = useSearchFleets(search);

  const fleetForm   = useForm<FleetDraft>({
    resolver: zodResolver(fleetDraftSchema),
    defaultValues: defaultValues?.fleet,
  });
  const contactForm = useForm<CustomerDraft>({
    resolver: zodResolver(contactDraftSchema),
    defaultValues: defaultValues?.contact ?? { documentType: DocumentType.DNI },
  });

  function selectExistingFleet(fleet: Fleet) {
    setSelectedFleetId(fleet.id);
    setSelectedFleetObj(fleet);
    setCreatingNew(false);
    setSearch("");
  }

  function clearSelection() {
    setSelectedFleetId(null);
    setSelectedFleetObj(null);
    setCreatingNew(false);
  }

  function handleSubmit() {
    // Flota existente: no se crea contacto nuevo, el vehículo va directo a la flota
    if (!creatingNew && selectedFleetId) {
      onNext({ existingFleetId: selectedFleetId });
      return;
    }
    // Flota nueva: se requiere datos de flota + contacto
    contactForm.handleSubmit((contact) => {
      fleetForm.handleSubmit((fleet) => onNext({ fleet, contact }))();
    })();
  }

  const fe = fleetForm.formState.errors;
  const ce = contactForm.formState.errors;

  return (
    <div className="space-y-6">
      {/* Búsqueda */}
      <Section title="Empresa">
        <Input
          placeholder="Buscar empresa por nombre o CUIT..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSelectedFleetId(null); setCreatingNew(false); }}
        />

        {search.length >= 2 && (
          <div className="rounded-md border border-[#c4c6cd] bg-white shadow-sm overflow-hidden">
            {isFetching ? (
              <p className="px-3 py-2.5 text-sm text-[#44474c]">Buscando...</p>
            ) : (searchResults?.items.length ?? 0) === 0 ? (
              <p className="px-3 py-2.5 text-sm text-[#44474c]">
                No encontrada.{" "}
                <button
                  className="text-[#865300] font-medium hover:underline"
                  onClick={() => { setCreatingNew(true); setSearch(""); }}
                >
                  Registrar nueva
                </button>
              </p>
            ) : (
              searchResults?.items.map((fleet) => (
                <button
                  key={fleet.id}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-[#eefcfd] text-left border-b last:border-0 transition-colors"
                  onClick={() => selectExistingFleet(fleet)}
                >
                  <div>
                    <p className="font-medium text-[#041627]">{fleet.companyName}</p>
                    {fleet.taxId && <p className="text-xs text-[#44474c]">CUIT {fleet.taxId}</p>}
                  </div>
                  <span className="flex items-center gap-0.5 text-xs font-semibold text-[#865300]">
                    Seleccionar
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              ))
            )}
          </div>
        )}

        {selectedFleetId && selectedFleetObj && (
          <div className="flex items-center justify-between rounded-md border border-l-4 border-[#c4c6cd] border-l-[#fea520] bg-[#eefcfd] px-4 py-3 text-sm">
            <div>
              <Tag variant="amber">Flota existente</Tag>
              <p className="font-semibold text-[#041627] mt-1">{selectedFleetObj.companyName}</p>
              {selectedFleetObj.taxId && (
                <p className="text-xs text-[#44474c]">CUIT {selectedFleetObj.taxId}</p>
              )}
            </div>
            <button
              className="text-xs text-[#44474c] hover:text-[#041627] transition-colors ml-4"
              onClick={clearSelection}
            >
              Cambiar
            </button>
          </div>
        )}

        {!selectedFleetId && !creatingNew && search.length < 2 && (
          <button
            className="text-sm font-medium text-[#865300] hover:text-[#041627] transition-colors"
            onClick={() => setCreatingNew(true)}
          >
            + Registrar flota nueva
          </button>
        )}
      </Section>

      {/* Nueva flota */}
      {creatingNew && !selectedFleetId && (
        <Section title="Nueva empresa">
          <Field label="Razón social" required error={fe.companyName?.message}>
            <Input
              placeholder="Vicente Trapani SA"
              {...fleetForm.register("companyName")}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="CUIT" required error={fe.taxId?.message}>
              <Input placeholder="30-12345678-9" {...fleetForm.register("taxId")} />
            </Field>
            <Field label="Teléfono" required error={fe.phone?.message}>
              <Input placeholder="+54 9 11 1234 5678" {...fleetForm.register("phone")} />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Email">
              <Input type="email" placeholder="empresa@ejemplo.com" {...fleetForm.register("email")} />
            </Field>
            <Field label="Dirección">
              <Input placeholder="Ruta 9, Las Talitas" {...fleetForm.register("address")} />
            </Field>
          </div>
        </Section>
      )}

      {/* Contacto: solo para flotas nuevas */}
      {selectedFleetId && !creatingNew && (
        <div className="flex items-center gap-2.5 rounded-md bg-[#eefcfd] border border-[#c4c6cd]/60 px-4 py-3 text-sm text-[#44474c]">
          <span className="text-[#fea520] text-base">✓</span>
          El vehículo quedará vinculado directamente a <span className="font-semibold text-[#041627] ml-1">{selectedFleetObj?.companyName}</span>.
          No es necesario crear un contacto nuevo.
        </div>
      )}

      {!selectedFleetId && <Section title="Contacto / Conductor">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre" required error={ce.firstName?.message}>
            <Input placeholder="Juan" {...contactForm.register("firstName")} />
          </Field>
          <Field label="Apellido" required error={ce.lastName?.message}>
            <Input placeholder="Pérez" {...contactForm.register("lastName")} />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Tipo de documento" required>
            <Select
              defaultValue={String(defaultValues?.contact?.documentType ?? DocumentType.DNI)}
              onValueChange={(v) => contactForm.setValue("documentType", Number(v) as DocumentType)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DOC_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Número de documento" required error={ce.documentNumber?.message}>
            <Input placeholder="30123456" {...contactForm.register("documentNumber")} />
          </Field>
        </div>
        <Field label="Email" required error={ce.email?.message}>
          <Input
            type="email"
            placeholder="contacto@empresa.com"
            {...contactForm.register("email")}
          />
        </Field>
        <Field label="Teléfono" required error={ce.phone?.message}>
          <Input
            type="tel"
            placeholder="+54 9 11 1234 5678"
            {...contactForm.register("phone")}
          />
        </Field>
      </Section>}

      <StepNav
        onBack={onBack}
        onNext={handleSubmit}
        nextDisabled={!selectedFleetId && !creatingNew}
      />
    </div>
  );
}
