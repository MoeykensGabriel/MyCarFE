"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { BackButton } from "@/components/shared/BackButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      documentType: DocumentType.DNI,
    },
  });

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

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo cliente</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Completá los datos del cliente para registrarlo en el sistema.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos personales</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Nombre y Apellido */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  placeholder="Ej: Juan"
                  {...register("firstName")}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-500">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  placeholder="Ej: Pérez"
                  {...register("lastName")}
                />
                {errors.lastName && (
                  <p className="text-xs text-red-500">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Tipo y Número de documento */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="documentType">Tipo de documento</Label>
                <Select
                  defaultValue={String(DocumentType.DNI)}
                  onValueChange={(val) =>
                    setValue("documentType", Number(val) as DocumentType)
                  }
                >
                  <SelectTrigger id="documentType">
                    <SelectValue placeholder="Seleccioná un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="documentNumber">Número de documento</Label>
                <Input
                  id="documentNumber"
                  placeholder="Ej: 30123456"
                  {...register("documentNumber")}
                />
                {errors.documentNumber && (
                  <p className="text-xs text-red-500">{errors.documentNumber.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="juan@ejemplo.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Teléfono */}
            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Ej: +54 9 11 1234 5678"
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-xs text-red-500">{errors.phone.message}</p>
              )}
            </div>

            {/* Acciones */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/customers")}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Guardando..." : "Crear cliente"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
