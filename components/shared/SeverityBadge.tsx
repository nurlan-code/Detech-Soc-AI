import { cn, severityBadgeClass } from "@/lib/utils";

interface Props {
  severity: string;
  className?: string;
}

export function SeverityBadge({ severity, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
        severityBadgeClass(severity),
        className
      )}
    >
      {severity.toUpperCase()}
    </span>
  );
}
