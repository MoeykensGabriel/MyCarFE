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
 * Registro fotográfico FINAL (entrega). Wrapper de {@link VehiclePhotosUploader} fijado en
 * PhotoType.After. Se usa en la ficha de la orden (estado Completed) y en el modal de cambio
 * de estado al pasar a Entregado.
 */
export function AfterPhotosUploader({ workOrderId, allPhotos, onUploaded }: Props) {
  return (
    <VehiclePhotosUploader
      workOrderId={workOrderId}
      allPhotos={allPhotos}
      onUploaded={onUploaded}
      photoType={PhotoType.After}
      title="Registro Fotográfico Final (Entrega)"
      description="Suba las 6 fotografías obligatorias que documentan el estado de salida/entrega del vehículo."
      inputIdPrefix="after-input"
    />
  );
}
