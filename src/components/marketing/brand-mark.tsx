import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  compact?: boolean;
};

export function BrandMark({ className, compact = false }: BrandMarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        aria-hidden="true"
        viewBox="0 0 40 40"
        className="size-8 shrink-0 text-primary"
        fill="none"
      >
        <path d="M7 6h27L27.5 16H13.5L7 6Z" fill="currentColor" opacity="0.68" />
        <path d="M13.5 16h14L21 26H7l6.5-10Z" fill="currentColor" />
        <path d="M7 26h14l-6.5 8H3L7 26Z" fill="currentColor" opacity="0.78" />
      </svg>
      {!compact && (
        <span className="flex flex-col font-mono text-[0.66rem] font-semibold leading-[0.9rem] tracking-[0.22em] text-foreground">
          <span>PROJECT</span>
          <span>ZERO</span>
        </span>
      )}
    </span>
  );
}
