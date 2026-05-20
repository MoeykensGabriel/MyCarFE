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
import { Customer } from "@/types/api.types";
import { useSearchCustomers } from "@/hooks/useCustomers";
import {
  isDocumentValidForType,
  documentMessageForType,
  phoneSchema,
} from "@/lib/argentina-validation";
import { Field, Section, StepNav, Tag } from "./ui";
import { DOC_OPTIONS } from "./constants";
import { CustomerDraft } from "./types";

// Schema con validación tipo-aware del documento + teléfono argentino
const customerDraftSchema = z
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
  defaultValues?:    CustomerDraft;
  onNext:            (data: CustomerDraft) => void;
  onSelectExisting:  (customer: Customer) => void;
  onBack:            () => void;
}

export function StepCustomer({ defaultValues, onNext, onSelectExisting, onBack }: Props) {
  const [search,          setSearch]          = useState("");
  const [selected,        setSelected]        = useState<Customer | null>(null);
  const [creatingNew,     setCreatingNew]     = useState(false);

  const { data: results, isFetching } = useSearchCustomers(search);

  const { register, handleSubmit, setValue, formState: { errors } } =
    useForm<CustomerDraft>({
      resolver: zodResolver(customerDraftSchema),
      defaultValues: defaultValues ?? { documentType: DocumentType.DNI },
    });

  function selectExisting(customer: Customer) {
    setSelected(customer);
    setCreatingNew(false);
    setSearch("");
  }

  function clearSelection() {
    setSelected(null);
    setCreatingNew(false);
  }

  function handleNext() {
    if (selected) {
      onSelectExisting(selected);
      return;
    }
    handleSubmit(onNext)();
  }

  return (
    <div className="space-y-6">
      {/* Búsqueda */}
      <Section title="Cliente">
        <Input
          placeholder="Buscar por nombre, apellido, email o documento..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSelected(null); setCreatingNew(false); }}
        />

        {search.length >= 2 && (
          <div className="rounded-md border border-[#c4c6cd] bg-white shadow-sm overflow-hidden">
            {isFetching ? (
              <p className="px-3 py-2.5 text-sm text-[#44474c]">Buscando...</p>
            ) : (results?.items.length ?? 0) === 0 ? (
              <p className="px-3 py-2.5 text-sm text-[#44474c]">
                No encontrado.{" "}
                <button
                  type="button"
                  className="text-[#865300] font-medium hover:underline"
                  onClick={() => { setCreatingNew(true); setSearch(""); }}
                >
                  Registrar nuevo
                </button>
              </p>
            ) : (
              results?.items.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-[#eefcfd] text-left border-b last:border-0 transition-colors"
                  onClick={() => selectExisting(customer)}
                >
                  <div>
                    <p className="font-medium text-[#041627]">
                      {customer.firstName} {customer.lastName}
                    </p>
                    <p className="text-xs text-[#44474c]">{customer.email}</p>
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

        {selected && (
          <div className="flex items-center justify-between rounded-md border border-l-4 border-[#c4c6cd] border-l-[#fea520] bg-[#eefcfd] px-4 py-3 text-sm">
            <div>
              <Tag variant="amber">Cliente existente</Tag>
              <p className="font-semibold text-[#041627] mt-1">
                {selected.firstName} {selected.lastName}
              </p>
              <p className="text-xs text-[#44474c]">{selected.email}</p>
            </div>
            <button
              type="button"
              className="text-xs text-[#44474c] hover:text-[#041627] transition-colors ml-4"
              onClick={clearSelection}
            >
              Cambiar
            </button>
          </div>
        )}

        {!selected && !creatingNew && search.length < 2 && (
          <button
            type="button"
            className="text-sm font-medium text-[#865300] hover:text-[#041627] transition-colors"
            onClick={() => setCreatingNew(true)}
          >
            + Registrar cliente nuevo
          </button>
        )}
      </Section>

      {/* Formulario solo para clientes nuevos */}
      {!selected && creatingNew && (
        <>
          <Section title="Datos personales">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nombre" required error={errors.firstName?.message}>
                <Input placeholder="Juan" {...register("firstName")} />
              </Field>
              <Field label="Apellido" required error={errors.lastName?.message}>
                <Input placeholder="Pérez" {...register("lastName")} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tipo de documento" required>
                <Select
                  defaultValue={String(defaultValues?.documentType ?? DocumentType.DNI)}
                  onValueChange={(v) => setValue("documentType", Number(v) as DocumentType)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DOC_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Número de documento" required error={errors.documentNumber?.message}>
                <Input placeholder="30123456" {...register("documentNumber")} />
              </Field>
            </div>
          </Section>

          <Section title="Contacto">
            <Field label="Email" required error={errors.email?.message}>
              <Input
                type="email"
                placeholder="juan@ejemplo.com"
                {...register("email")}
              />
            </Field>
            <Field label="Teléfono" required error={errors.phone?.message}>
              <Input
                type="tel"
                placeholder="+54 9 11 1234 5678"
                {...register("phone")}
              />
            </Field>
          </Section>
        </>
      )}

      <StepNav
        onBack={onBack}
        onNext={handleNext}
        nextDisabled={!selected && !creatingNew}
      />
    </div>
  );
}
