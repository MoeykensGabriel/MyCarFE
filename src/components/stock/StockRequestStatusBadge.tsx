import {
  StockRequestStatus,
  StockRequestStatusColor,
  StockRequestStatusLabel,
} from "@/lib/enums";

// Clases hardcodeadas para que Tailwind no las purgue en build.
const colorClasses: Record<string, string> = {
  gray:   "bg-gray-100 text-gray-700 border-gray-200",
  red:    "bg-red-100 text-red-700 border-red-200",
  blue:   "bg-blue-100 text-blue-700 border-blue-200",
  green:  "bg-green-100 text-green-700 border-green-200",
};

interface Props {
  status: StockRequestStatus;
}

export function StockRequestStatusBadge({ status }: Props) {
  const color   = StockRequestStatusColor[status] ?? "gray";
  const classes = colorClasses[color] ?? colorClasses.gray;
  const label   = StockRequestStatusLabel[status] ?? "—";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${classes}`}>
      {label}
    </span>
  );
}
