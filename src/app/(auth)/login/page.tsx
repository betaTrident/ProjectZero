import type { Metadata } from "next";

import { login } from "@/actions/auth";
import { AuthShell, AuthShellLink } from "@/components/forms/auth-shell";
import { SubmitButton } from "@/components/forms/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to manage invoices, products, and payment history.",
};

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, next } = await searchParams;

  return (
    <AuthShell
      title="Sign in"
      description="Access invoices, products, and payment history."
      footer={
        <>
          New merchant? <AuthShellLink href="/register">Create an account</AuthShellLink>
        </>
      }
    >
      <form action={login} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next ?? ""} />
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{decodeURIComponent(error)}</AlertDescription>
          </Alert>
        ) : null}
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              minLength={6}
              required
            />
          </Field>
        </FieldGroup>
        <SubmitButton idleLabel="Sign in" pendingLabel="Signing in…" />
      </form>
    </AuthShell>
  );
}
