import { Badge } from "@/components/ui/badge";
import { labStatusVariant } from "@/lib/lab/order-status";
import { cn } from "@/lib/utils";

/**
 * The badge of a laboratory order or test status.
 */
export function LabStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <Badge variant={labStatusVariant(status)} className={cn("whitespace-nowrap", className)}>
      {status}
    </Badge>
  );
}

/**
 * The badge of the abnormal flag of a result.
 */
export function LabFlagBadge({
  flag,
  className,
}: {
  flag: string | null | undefined;
  className?: string;
}) {
  const value = (flag ?? "Normal").trim() || "Normal";

  const variant = value.toLowerCase() === "critical"
    ? "destructive"
    : value.toLowerCase() === "abnormal"
      ? "warning"
      : "success";

  return (
    <Badge variant={variant} className={cn("whitespace-nowrap", className)}>
      {value}
    </Badge>
  );
}
