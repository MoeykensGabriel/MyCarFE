"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  UserPlus, 
  User, 
  CreditCard, 
  Mail, 
  Phone, 
  AlertCircle, 
  X 
} from "lucide-react";

import { BackButton } from "@/components/shared/BackButton";
import { DocumentType, DocumentTypeLabel } from "@/lib/enums";
import {
  isDocumentValidForType,
  documentMessageForType,
  phoneSchema,
} from "@/lib/argentina-validation";
import { emailSchema } from "@/lib/form-validation";
import { M } from "@/lib/form-messages";
import { useCreateCustomer } from "@/hooks/useCustomers";
import { CreateCustomerRequest } from "@/services/customers.service";

// Schema con validación tipo-aware: el formato del DocumentNumber depende del DocumentType.
const customerSchema = z
  .object({
    firstName:      z.string().min(1, "Ingresá el nombre").max(100, M.tooLong(100)),
    lastName:       z.string().min(1, "Ingresá el apellido").max(100, M.tooLong(100)),
    documentType:   z.nativeEnum(DocumentType),
    documentNumber: z.string().min(1, "Ingresá el número de documento"),
    email:          emailSchema,
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

type CustomerFormValues = z.infer<typeof customerSchema>;

const DOCUMENT_TYPE_OPTIONS = (
  Object.values(DocumentType).filter((v) => typeof v === "number") as number[]
).map((value) => ({
  value,
  label: DocumentTypeLabel[value as DocumentType],
}));

export default function NewCustomerPage() {
  const router = useRouter();
  const { mutate: createCustomer, isPending } = useCreateCustomer();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      documentType: DocumentType.DNI,
    },
  });

  const selectedDocType = watch("documentType");

  function onSubmit(data: CustomerFormValues) {
    createCustomer(data as CreateCustomerRequest, {
      onSuccess: () => {
        router.push("/admin/customers");
      },
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <BackButton href="/admin/customers" label="Clientes" />

      {/* Title section */}
      <div>
        <h1 className="text-2xl font-black text-[#041627] tracking-tight">Nuevo cliente</h1>
        <p className="text-sm text-[#44474c]/80 font-medium mt-1">
          Completá la información del cliente para darlo de alta en el sistema.
        </p>
      </div>

      {/* Premium Form Card wrapper */}
      <div className="bg-white rounded-2xl border border-[#c4c6cd] border-t-4 border-t-[#041627] shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        {/* Card Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#c4c6cd]/50 bg-gradient-to-r from-[#eefcfd]/20 to-transparent">
          <div className="w-8 h-8 rounded-lg bg-[#041627] text-white flex items-center justify-center shadow-inner">
            <UserPlus className="w-4 h-4 text-[#fea520]" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#041627] tracking-tight">Datos personales</h3>
            <p className="text-[10px] text-[#44474c]/70 leading-none mt-0.5">Todos los campos son obligatorios.</p>
          </div>
        </div>

        {/* Card Content Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5" noValidate>
          
          {/* Nombre y Apellido */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label 
                htmlFor="firstName" 
                className="text-[11px] font-extrabold uppercase tracking-widest text-[#041627] flex items-center gap-1"
              >
                Nombre <span className="text-[#fea520]">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#44474c]/40" />
                <input
                  id="firstName"
                  type="text"
                  placeholder="Ej: Juan"
                  className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border bg-white text-[#041627] placeholder:text-[#44474c]/30 focus:outline-none focus:ring-2 focus:ring-[#041627]/10 focus:border-[#041627] transition-all ${
                    errors.firstName ? "border-red-400 focus:ring-red-100" : "border-[#c4c6cd]"
                  }`}
                  {...register("firstName")}
                />
              </div>
              {errors.firstName && (
                <p className="text-xs text-red-500 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label 
                htmlFor="lastName" 
                className="text-[11px] font-extrabold uppercase tracking-widest text-[#041627] flex items-center gap-1"
              >
                Apellido <span className="text-[#fea520]">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#44474c]/40" />
                <input
                  id="lastName"
                  type="text"
                  placeholder="Ej: Pérez"
                  className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border bg-white text-[#041627] placeholder:text-[#44474c]/30 focus:outline-none focus:ring-2 focus:ring-[#041627]/10 focus:border-[#041627] transition-all ${
                    errors.lastName ? "border-red-400 focus:ring-red-100" : "border-[#c4c6cd]"
                  }`}
                  {...register("lastName")}
                />
              </div>
              {errors.lastName && (
                <p className="text-xs text-red-500 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          {/* Tipo y Número de documento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label 
                htmlFor="documentType" 
                className="text-[11px] font-extrabold uppercase tracking-widest text-[#041627]"
              >
                Tipo de documento <span className="text-[#fea520]">*</span>
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#44474c]/40 pointer-events-none z-10" />
                <select
                  id="documentType"
                  className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl border border-[#c4c6cd] bg-white text-[#041627] focus:outline-none focus:ring-2 focus:ring-[#041627]/10 focus:border-[#041627] transition-all appearance-none cursor-pointer"
                  defaultValue={String(DocumentType.DNI)}
                  onChange={(e) =>
                    setValue("documentType", Number(e.target.value) as DocumentType)
                  }
                >
                  {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#44474c]/50">
                  ▼
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label 
                htmlFor="documentNumber" 
                className="text-[11px] font-extrabold uppercase tracking-widest text-[#041627] flex items-center gap-1"
              >
                Número de documento <span className="text-[#fea520]">*</span>
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#44474c]/40" />
                <input
                  id="documentNumber"
                  type="text"
                  placeholder="Ej: 30123456"
                  className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border bg-white text-[#041627] placeholder:text-[#44474c]/30 focus:outline-none focus:ring-2 focus:ring-[#041627]/10 focus:border-[#041627] transition-all ${
                    errors.documentNumber ? "border-red-400 focus:ring-red-100" : "border-[#c4c6cd]"
                  }`}
                  {...register("documentNumber")}
                />
              </div>
              {errors.documentNumber ? (
                <p className="text-xs text-red-500 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.documentNumber.message}
                </p>
              ) : (
                <p className="text-[10px] text-[#44474c]/60 font-semibold">
                  {selectedDocType === DocumentType.DNI 
                    ? "Formato: 7 u 8 dígitos numéricos sin puntos."
                    : "Formato CUIL/CUIT: 11 dígitos numéricos sin guiones."}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label 
              htmlFor="email" 
              className="text-[11px] font-extrabold uppercase tracking-widest text-[#041627] flex items-center gap-1"
            >
              Email <span className="text-[#fea520]">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#44474c]/40" />
              <input
                id="email"
                type="email"
                placeholder="juan@ejemplo.com"
                className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border bg-white text-[#041627] placeholder:text-[#44474c]/30 focus:outline-none focus:ring-2 focus:ring-[#041627]/10 focus:border-[#041627] transition-all ${
                  errors.email ? "border-red-400 focus:ring-red-100" : "border-[#c4c6cd]"
                }`}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Teléfono */}
          <div className="space-y-1.5">
            <label 
              htmlFor="phone" 
              className="text-[11px] font-extrabold uppercase tracking-widest text-[#041627] flex items-center gap-1"
            >
              Teléfono <span className="text-[#fea520]">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#44474c]/40" />
              <input
                id="phone"
                type="tel"
                placeholder="Ej: +54 9 11 1234 5678"
                className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border bg-white text-[#041627] placeholder:text-[#44474c]/30 focus:outline-none focus:ring-2 focus:ring-[#041627]/10 focus:border-[#041627] transition-all ${
                  errors.phone ? "border-red-400 focus:ring-red-100" : "border-[#c4c6cd]"
                }`}
                {...register("phone")}
              />
            </div>
            {errors.phone ? (
              <p className="text-xs text-red-500 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.phone.message}
              </p>
            ) : (
              <p className="text-[10px] text-[#44474c]/60 font-semibold">
                Formato sugerido: +54 9 [código de área] [número] (sin espacios).
              </p>
            )}
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-3 pt-3 border-t border-[#c4c6cd]/40">
            <button
              type="button"
              onClick={() => router.push("/admin/customers")}
              disabled={isPending}
              className="px-4 py-2.5 rounded-xl border border-[#c4c6cd] text-sm font-bold text-[#44474c] hover:bg-[#eefcfd]/20 transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl bg-[#fea520] hover:bg-[#865300] text-[#041627] hover:text-white text-sm font-bold shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isPending ? "Guardando..." : "Crear cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
