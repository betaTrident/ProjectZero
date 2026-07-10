"use client";

import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type RouteErrorFallbackProps = {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
};

export function RouteErrorFallback({
  error,
  reset,
  title = "Something went wrong",
  description = "We could not load this page. Try again or return later.",
}: RouteErrorFallbackProps) {
  return (
    <main className="app-surface flex min-h-[70vh] w-full items-center justify-center px-4 py-16 md:px-6">
      <div className="w-full max-w-lg">
      <Alert variant="destructive" className="app-panel w-full border-destructive/35 p-4">
        <AlertCircle />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="flex flex-col gap-4">
          <span>{description}</span>
          {error.digest ? <span className="font-mono text-xs text-destructive/80">Reference: {error.digest}</span> : null}
        </AlertDescription>
      </Alert>
      <Button type="button" onClick={reset} className="mt-6 w-full" size="lg">
        Try again
      </Button>
      </div>
    </main>
  );
}
