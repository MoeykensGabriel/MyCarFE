import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DocumentType, DocumentTypeLabel,
  FuelType, VehicleBodyType, VehicleUseType,
} from "@/lib/enums";
import { BRANDS, getModels } from "@/lib/car-catalog";
import { Combobox } from "@/components/shared/Combobox";
import {
  isDocumentValidForType,
  documentMessageForType,
  optionalPhoneSchema,
} from "@/lib/argentina-validation";
import {
  yearSchema,
  mileageSchema,
  optionalVinSchema,
  licensePlateSchema,
} from "@/lib/form-validation";
import { M } from "@/lib/form-messages";
import { Field, Section, StepNav } from "./ui";
import { DOC_OPTIONS, FUEL_OPTIONS, BODY_OPTIONS, USE_OPTIONS } from "./constants";
import { VehicleDraft } from "./types";

// Schema con todas las validaciones del paso vehículo (incluye titular tipo-aware)
const vehicleDraftSchema = z
  .object({
    brand:           z.string().min(1, M.required),
    model:           z.string().min(1, M.required),
    year:            yearSchema,
    licensePlate:    licensePlateSchema,
    color:           z.string().optional(),
    vin:             optionalVinSchema,
    engineNumber:    z.string().optional(),
    currentMileage:  mileageSchema.optional(),
    fuelType:        z.nativeEnum(FuelType),
    vehicleBodyType: z.nativeEnum(VehicleBodyType),
    vehicleUseType:  z.nativeEnum(VehicleUseType),
    registrationHolderFirstName:      z.string().min(1, M.required),
    registrationHolderLastName:       z.string().min(1, M.required),
    registrationHolderDocumentType:   z.nativeEnum(DocumentType),
    registrationHolderDocumentNumber: z.string().min(1, M.required),
    registrationCertificateNumber:    z.string().optional(),
    customerNote:        z.string().optional(),
    contactPersonName:   z.string().optional(),
    contactPersonPhone:  optionalPhoneSchema,
    serviceReason:       z
      .string()
      .min(1, "Indicá por qué viene el vehículo")
      .max(2000, "Máximo 2000 caracteres"),
  })
  .superRefine((data, ctx) => {
    if (
      !isDocumentValidForType(
        data.registrationHolderDocumentType,
        data.registrationHolderDocumentNumber,
      )
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["registrationHolderDocumentNumber"],
        message: documentMessageForType(data.registrationHolderDocumentType),
      });
    }
  });

interface Props {
  ownerLabel:              string;
  /** Tipo de propietario: en flotas es la empresa, en particulares es el cliente. */
  ownerKind:               "customer" | "company";
  customerDocumentType?:   DocumentType;
  customerDocumentNumber?: string;
  defaultValues?:          VehicleDraft;
  loading?:                boolean;
  onNext: (data: VehicleDraft) => void;
  onBack: () => void;
}

export function StepVehicle({
  ownerLabel,
  ownerKind,
  customerDocumentType,
  customerDocumentNumber,
  defaultValues,
  loading = false,
  onNext,
  onBack,
}: Props) {
  const [sameAsOwner, setSameAsOwner] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } =
    useForm<VehicleDraft>({
      resolver: zodResolver(vehicleDraftSchema) as never,
      defaultValues: defaultValues ?? {
        fuelType:                          FuelType.Gasoline,
        vehicleBodyType:                   VehicleBodyType.Sedan,
        vehicleUseType:                    VehicleUseType.Personal,
        registrationHolderDocumentType:    DocumentType.DNI,
        currentMileage:                    0,
      },
    });

  const currentBrand  = watch("brand")  ?? "";
  const currentModel  = watch("model")  ?? "";
  const modelOptions  = getModels(currentBrand);

  function handleBrandChange(brand: string) {
    setValue("brand", brand, { shouldValidate: true });
    // Si la marca cambia y el modelo actual no pertenece a la nueva lista, lo limpia
    const models = getModels(brand);
    if (models.length > 0 && !models.includes(currentModel)) {
      setValue("model", "");
    }
  }

  function handleSameAsOwner(checked: boolean) {
    setSameAsOwner(checked);
    if (checked) {
      if (ownerKind === "company") {
        // En flotas la entidad jurídica no tiene nombre/apellido: usamos toda la
        // razón social como "firstName" y dejamos lastName vacío. El back valida
        // ambos como required pero acepta strings no vacíos — workaround conocido.
        setValue("registrationHolderFirstName", ownerLabel);
        setValue("registrationHolderLastName",  "—");
      } else {
        const [first, ...rest] = ownerLabel.split(" ");
        setValue("registrationHolderFirstName", first ?? "");
        setValue("registrationHolderLastName",  rest.join(" ") || "");
      }
      if (customerDocumentType !== undefined) {
        setValue("registrationHolderDocumentType", customerDocumentType);
      }
      setValue("registrationHolderDocumentNumber", customerDocumentNumber ?? "");
    } else {
      setValue("registrationHolderFirstName",      "");
      setValue("registrationHolderLastName",       "");
      setValue("registrationHolderDocumentNumber", "");
    }
  }

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      {ownerLabel && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#041627]/5 border border-[#041627]/10">
          <span className="text-xs text-[#44474c]">
            Vehículo para {ownerKind === "company" ? "la empresa" : "el cliente"}
          </span>
          <span className="text-xs font-semibold text-[#041627]">{ownerLabel}</span>
        </div>
      )}

      <Section title="Datos del vehículo">
        {/* Campo oculto para que RHF registre brand y model */}
        <input type="hidden" {...register("brand")} />
        <input type="hidden" {...register("model")} />

        <div className="grid grid-cols-3 gap-4">
          <Field label="Marca" required error={errors.brand?.message}>
            <Combobox
              options={BRANDS}
              value={currentBrand}
              onChange={handleBrandChange}
              placeholder="Toyota, Ford..."
            />
          </Field>
          <Field label="Modelo" required error={errors.model?.message}>
            <Combobox
              options={modelOptions}
              value={currentModel}
              onChange={(v) => setValue("model", v, { shouldValidate: true })}
              placeholder={currentBrand ? "Seleccionar modelo..." : "Primero elegí la marca"}
              disabled={!currentBrand}
            />
          </Field>
          <Field label="Año" required error={errors.year?.message}>
            <Input
              type="number"
              placeholder="2022"
              {...register("year", { valueAsNumber: true })}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Patente" required error={errors.licensePlate?.message}>
            <Input
              placeholder="ABC123 o AF123BK"
              className="uppercase"
              {...register("licensePlate")}
            />
          </Field>
          <Field label="Color">
            <Input placeholder="Blanco" {...register("color")} />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Combustible", key: "fuelType",        options: FUEL_OPTIONS, defaultVal: defaultValues?.fuelType         ?? FuelType.Gasoline       },
            { label: "Carrocería",  key: "vehicleBodyType", options: BODY_OPTIONS, defaultVal: defaultValues?.vehicleBodyType   ?? VehicleBodyType.Sedan    },
            { label: "Uso",         key: "vehicleUseType",  options: USE_OPTIONS,  defaultVal: defaultValues?.vehicleUseType    ?? VehicleUseType.Personal  },
          ].map(({ label, key, options, defaultVal }) => (
            <Field key={key} label={label} required>
              <Select
                defaultValue={String(defaultVal)}
                onValueChange={(v) => setValue(key as keyof VehicleDraft, Number(v) as never)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {options.map((o) => (
                    <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Kilometraje actual" error={errors.currentMileage?.message}>
            <Input
              type="number"
              placeholder="0"
              {...register("currentMileage", { valueAsNumber: true })}
            />
          </Field>
          <Field label="VIN" error={errors.vin?.message}>
            <Input placeholder="17 caracteres (opcional)" {...register("vin")} />
          </Field>
        </div>
      </Section>

      <Section title="Titular registral">
        {/* El checkbox solo se muestra cuando hay datos del propietario completos.
            Sino, en flotas existentes podía aparecer con valores vacíos y romper la validación. */}
        {customerDocumentType !== undefined &&
         customerDocumentNumber &&
         ownerLabel && (
        <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
          <div
            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
              sameAsOwner ? "bg-[#fea520] border-[#fea520]" : "border-[#c4c6cd]"
            }`}
          >
            {sameAsOwner && <Check className="w-2.5 h-2.5 text-[#041627] stroke-[3]" />}
          </div>
          <input
            type="checkbox"
            className="sr-only"
            checked={sameAsOwner}
            onChange={(e) => handleSameAsOwner(e.target.checked)}
          />
          <span className="text-sm text-[#44474c]">
            {ownerKind === "company" ? "Mismo que la empresa" : "Mismo que el cliente"}
          </span>
        </label>
        )}

        {sameAsOwner ? (
          <>
            <input type="hidden" {...register("registrationHolderFirstName")} />
            <input type="hidden" {...register("registrationHolderLastName")} />
            <input type="hidden" {...register("registrationHolderDocumentNumber")} />
            <div className="flex items-center gap-2 rounded-md bg-[#eefcfd] border border-[#c4c6cd]/60 px-4 py-3">
              <Check className="w-4 h-4 text-[#fea520] shrink-0" />
              <p className="text-sm text-[#041627]">
                <span className="font-semibold">{ownerLabel}</span>
                {" — "}
                {customerDocumentType !== undefined && DocumentTypeLabel[customerDocumentType]} {customerDocumentNumber}
              </p>
            </div>
            {/* Mostrar errores aunque los campos sean hidden — sino el usuario
                no entiende por qué el form no avanza al hacer submit. */}
            {(errors.registrationHolderFirstName?.message ||
              errors.registrationHolderLastName?.message ||
              errors.registrationHolderDocumentNumber?.message) && (
              <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 space-y-1">
                <p className="text-xs font-semibold text-red-700">
                  Los datos del propietario tienen un problema:
                </p>
                {errors.registrationHolderDocumentNumber?.message && (
                  <p className="text-xs text-red-600">
                    • {errors.registrationHolderDocumentNumber.message}
                  </p>
                )}
                {errors.registrationHolderFirstName?.message && (
                  <p className="text-xs text-red-600">
                    • Nombre: {errors.registrationHolderFirstName.message}
                  </p>
                )}
                {errors.registrationHolderLastName?.message && (
                  <p className="text-xs text-red-600">
                    • Apellido: {errors.registrationHolderLastName.message}
                  </p>
                )}
                <p className="text-xs text-red-700/80 pt-1">
                  Destildá &ldquo;{ownerKind === "company" ? "Mismo que la empresa" : "Mismo que el cliente"}&rdquo; para corregirlos manualmente.
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nombre" required error={errors.registrationHolderFirstName?.message}>
                <Input
                  placeholder="Nombre del titular"
                  {...register("registrationHolderFirstName")}
                />
              </Field>
              <Field label="Apellido" required error={errors.registrationHolderLastName?.message}>
                <Input
                  placeholder="Apellido del titular"
                  {...register("registrationHolderLastName")}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tipo de documento" required>
                <Select
                  defaultValue={String(defaultValues?.registrationHolderDocumentType ?? DocumentType.DNI)}
                  onValueChange={(v) =>
                    setValue("registrationHolderDocumentType", Number(v) as DocumentType)
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DOC_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Número de documento" required error={errors.registrationHolderDocumentNumber?.message}>
                <Input
                  placeholder="Documento del titular"
                  {...register("registrationHolderDocumentNumber")}
                />
              </Field>
            </div>
            <Field label="N° de cédula verde">
              <Input placeholder="Opcional" {...register("registrationCertificateNumber")} />
            </Field>
          </>
        )}
      </Section>

      <Section title="Motivo de visita">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-[#041627]">
            ¿Por qué trae el vehículo? <span className="text-red-500 normal-case">*</span>
          </label>
          <textarea
            rows={3}
            placeholder="Ej: Escucha un ruido en el motor al arrancar en frío. Pide revisión del tren delantero porque siente vibración a alta velocidad."
            className={`w-full px-3 py-2.5 text-sm rounded-lg border text-[#041627] placeholder:text-[#44474c]/40 focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] resize-none transition-all ${
              errors.serviceReason ? "border-red-400 focus:ring-red-200" : "border-[#c4c6cd]"
            }`}
            {...register("serviceReason")}
          />
          {errors.serviceReason && (
            <p className="text-xs text-red-500">{errors.serviceReason.message}</p>
          )}
          <p className="text-[10px] text-[#44474c]/60">
            Este texto guía a los mecánicos durante la inspección colectiva.
          </p>
        </div>

        <div className="space-y-1.5 mt-4">
          <label className="text-[11px] font-bold uppercase tracking-widest text-[#041627]">
            Nota adicional{" "}
            <span className="font-normal normal-case tracking-normal text-[#44474c]/50">
              (opcional)
            </span>
          </label>
          <textarea
            rows={2}
            placeholder="Comentarios internos, observaciones del cliente, etc."
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#c4c6cd] text-[#041627] placeholder:text-[#44474c]/40 focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] resize-none transition-all"
            {...register("customerNote")}
          />
        </div>
      </Section>

      <Section title="Quién trae el vehículo">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[#041627]">
              Nombre{" "}
              <span className="font-normal normal-case tracking-normal text-[#44474c]/50">
                (opcional)
              </span>
            </label>
            <input
              type="text"
              placeholder="Ej: Juan Pérez"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#c4c6cd] focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all"
              {...register("contactPersonName")}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[#041627]">
              Teléfono{" "}
              <span className="font-normal normal-case tracking-normal text-[#44474c]/50">
                (opcional)
              </span>
            </label>
            <input
              type="tel"
              placeholder="1123456789"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#c4c6cd] focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all"
              {...register("contactPersonPhone")}
            />
            {errors.contactPersonPhone?.message && (
              <p className="text-xs text-red-500 mt-1">{errors.contactPersonPhone.message}</p>
            )}
          </div>
        </div>
      </Section>

      {/* Banner inferior: si hay errores de validación en cualquier campo, lo
          mostramos cerca del botón de submit para que el usuario sepa que el
          form no avanza porque algo falla. Cubre el caso de errores en campos
          cuyo display de error podría estar oculto. */}
      {Object.keys(errors).length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-semibold text-red-700">
            Revisá los campos marcados antes de continuar.
          </p>
          <p className="text-xs text-red-600 mt-0.5">
            {Object.keys(errors).length} campo{Object.keys(errors).length !== 1 ? "s" : ""} con error.
          </p>
        </div>
      )}

      <StepNav onBack={onBack} isSubmit loading={loading} />
    </form>
  );
}
