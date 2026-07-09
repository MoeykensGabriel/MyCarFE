"use client";

import { PhotoType } from "@/lib/enums";
import type { WorkOrderPhoto } from "@/types/api.types";
import { VehiclePhotosUploader } from "./VehiclePhotosUploader";

interface Props {
  workOrderId: string;
  /** Todas las fotos de la WO (cualquier tipo y target). */
  allPhotos: WorkOrderPhoto[];
  /** Disparado cuando se sube o borra una foto para que el padre invalide la query. */
  onUploaded: () => void;
}

/**
 * Registro fotográfico de INGRESO (Before). Wrapper de {@link VehiclePhotosUploader} fijado en
 * PhotoType.Before. Permite cargar/completar las fotos del estado cosmético de ingreso desde la
 * ficha de la orden cuando se saltó ese paso en el alta (o cargar las que falten).
 */
export function BeforePhotosUploader({ workOrderId, allPhotos, onUploaded }: Props) {
  return (
    <VehiclePhotosUploader
      workOrderId={workOrderId}
      allPhotos={allPhotos}
      onUploaded={onUploaded}
      photoType={PhotoType.Before}
      title="Registro Fotográfico de Ingreso"
      description="Suba las 6 fotografías del estado cosmético con el que el vehículo ingresó al taller. Si se saltó este paso en el alta, podés completarlo acá."
      inputIdPrefix="before-input"
    />
  );
}
