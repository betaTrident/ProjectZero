import type { Metadata } from "next";

import { register } from "@/actions/auth";
import { AuthShell, AuthShellLink } from "@/components/forms/auth-shell";
import { SubmitButton } from "@/components/forms/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a merchant account to issue Stellar Testnet payment requests.",
};

type RegisterPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { error } = await searchParams;

  return (
    <AuthShell
      title="Create account"
      description="Start issuing Stellar Testnet payment requests."
      footer={
        <>
          Already registered? <AuthShellLink href="/login">Sign in</AuthShellLink>
        </>
      }
    >
      <form action={register} className="flex flex-col gap-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{decodeURIComponent(error)}</AlertDescription>
          </Alert>
        ) : null}
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="businessName">Business name</FieldLabel>
            <Input id="businessName" name="businessName" autoComplete="organization" minLength={2} required />
          </Field>
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
              autoComplete="new-password"
              minLength={6}
              required
            />
          </Field>
        </FieldGroup>
        <SubmitButton idleLabel="Create account" pendingLabel="Creating account…" />
      </form>
    </AuthShell>
  );
}
