"use client";

import { RouteErrorFallback } from "@/components/shared/route-error-fallback";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  return (
    <RouteErrorFallback
      error={error}
      reset={reset}
      title="Dashboard unavailable"
      description="We could not load your merchant dashboard. Your data is safe — try refreshing this page."
    />
  );
}
