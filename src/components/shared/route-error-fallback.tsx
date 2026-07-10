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
    <main className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-16 md:px-6">
      <Alert variant="destructive" className="w-full">
        <AlertCircle />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="flex flex-col gap-4">
          <span>{description}</span>
          {error.message ? (
            <span className="font-mono text-xs text-destructive/80">{error.message}</span>
          ) : null}
        </AlertDescription>
      </Alert>
      <Button type="button" onClick={reset} className="mt-6">
        Try again
      </Button>
    </main>
  );
}
