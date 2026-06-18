"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { workOrdersService } from "@/services/work-orders.service";
import { WorkOrder } from "@/types/api.types";
import { IntakeCreatedFlow } from "@/components/intake/IntakeCreatedFlow";

export default function AdminOrderCreatedPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [order, setOrder]     = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await workOrdersService.getById(id, {
          headers: { "X-Skip-Auth-Redirect": "true" }
        });
        if (!cancelled) setOrder(data);
      } catch (err) {
        console.error("No se pudo cargar el detalle de la orden:", err);
        if (!cancelled) {
          setError("No se pudo cargar la orden. Verificá que se haya creado correctamente e intentá de nuevo.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  return (
    <IntakeCreatedFlow 
      order={order} 
      loading={loading} 
      error={error} 
      role="admin" 
    />
  );
}
