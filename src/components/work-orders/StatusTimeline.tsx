import { MoveRight } from "lucide-react";
import { getWorkOrderStatusConfig, WorkOrderStatus } from "@/lib/enums";
import { WorkOrderTimelineEntry } from "@/types/api.types";

interface StatusTimelineProps {
  timeline: WorkOrderTimelineEntry[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StatusTimeline({ timeline }: StatusTimelineProps) {
  if (!timeline.length) {
    return <p className="text-sm text-muted-foreground">Sin historial.</p>;
  }

  // Más reciente primero
  const sorted = [...timeline].sort(
    (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
  );

  return (
    <ol className="relative border-l border-gray-200 space-y-4 ml-2">
      {sorted.map((entry) => {
        const toConfig = getWorkOrderStatusConfig(entry.toStatus);
        const fromConfig =
          entry.fromStatus !== null
            ? getWorkOrderStatusConfig(entry.fromStatus)
            : null;

        return (
          <li key={entry.id} className="ml-4">
            <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-gray-400" />
            <p className="text-sm font-medium text-gray-900">
              {fromConfig ? (
                <span className="inline-flex items-center gap-1 text-muted-foreground font-normal">
                  {fromConfig.label}
                  <MoveRight className="w-3.5 h-3.5 inline-block" />
                </span>
              ) : null}
              {toConfig.label}
            </p>
            <time className="text-xs text-muted-foreground">
              {formatDate(entry.changedAt)}
            </time>
            {entry.note && (
              <p className="text-xs text-gray-600 mt-0.5 italic">
                "{entry.note}"
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
