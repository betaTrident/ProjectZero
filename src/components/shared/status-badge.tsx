import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PaymentRequestStatus } from "@/types/payment";

type StatusBadgeProps = {
  status: PaymentRequestStatus;
  className?: string;
};

const statusClassName: Record<PaymentRequestStatus, string> = {
  pending: "border-warning/40 bg-warning/15 text-warning-foreground",
  paid: "border-success/40 bg-success text-success-foreground",
  expired: "bg-secondary text-secondary-foreground",
  cancelled: "border-border bg-transparent text-muted-foreground",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn(statusClassName[status], className)}>
      {status}
    </Badge>
  );
}
