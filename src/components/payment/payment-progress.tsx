import {
  CHECKOUT_STEPS,
  getCheckoutStepIndex,
  type CheckoutFlowStatus,
} from "@/lib/payments/checkout-progress";
import { cn } from "@/lib/utils";

type PaymentProgressProps = {
  status: CheckoutFlowStatus;
  className?: string;
};

export function PaymentProgress({ status, className }: PaymentProgressProps) {
  const currentIndex = getCheckoutStepIndex(status);
  const activeIndex = currentIndex < 0 ? 0 : currentIndex;

  return (
    <nav aria-label="Payment progress" className={cn("w-full", className)}>
      <ol className="flex items-center justify-between gap-1">
        {CHECKOUT_STEPS.map((step, index) => {
          const isComplete = index < activeIndex;
          const isCurrent = index === activeIndex;

          return (
            <li key={step} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <span
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                  isComplete && "border-primary bg-primary text-primary-foreground",
                  isCurrent && !isComplete && "border-primary bg-primary/10 text-primary",
                  !isComplete && !isCurrent && "border-border bg-muted text-muted-foreground",
                )}
              >
                {index + 1}
              </span>
              <span
                className={cn(
                  "truncate text-center text-[10px] font-medium sm:text-xs",
                  isCurrent ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
