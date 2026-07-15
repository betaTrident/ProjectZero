import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PaymentRequestStatus } from "@/types/payment";

type StatusBadgeProps = {
  status: PaymentRequestStatus;
  className?: string;
};

const statusClassName: Record<PaymentRequestStatus, string> = {
  pending: "border-warning/40 bg-warning/12 text-warning",
  paid: "border-success/40 bg-success/12 text-success",
  expired: "border-destructive/35 bg-destructive/10 text-destructive",
  cancelled: "border-border bg-transparent text-muted-foreground",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn(statusClassName[status], className)}>
      {status}
    </Badge>
  );
}
