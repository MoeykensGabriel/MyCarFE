import Link from "next/link";

interface InfoRowProps {
  label: string;
  value?: string | null;
  href?: string;
}

export function InfoRow({ label, value, href }: InfoRowProps) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      {href && value ? (
        <Link href={href} className="font-medium text-blue-600 hover:underline">
          {value}
        </Link>
      ) : (
        <p className="font-medium text-gray-900">{value ?? "—"}</p>
      )}
    </div>
  );
}
