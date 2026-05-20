import {
  DocumentType, DocumentTypeLabel,
  FuelType, FuelTypeLabel,
  VehicleBodyType, VehicleBodyTypeLabel,
  VehicleUseType, VehicleUseTypeLabel,
} from "@/lib/enums";

function enumOptions<T extends number>(
  enumObj: object,
  labelMap: Record<number, string>
): { value: T; label: string }[] {
  return (Object.values(enumObj).filter((v) => typeof v === "number") as T[]).map(
    (value) => ({ value, label: labelMap[value] })
  );
}

export const DOC_OPTIONS  = enumOptions(DocumentType,    DocumentTypeLabel);
export const FUEL_OPTIONS = enumOptions(FuelType,        FuelTypeLabel);
export const BODY_OPTIONS = enumOptions(VehicleBodyType, VehicleBodyTypeLabel);
export const USE_OPTIONS  = enumOptions(VehicleUseType,  VehicleUseTypeLabel);
