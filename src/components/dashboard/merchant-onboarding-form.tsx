import { createMerchantProfile } from "@/actions/merchants";
import { ShieldCheck, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MerchantOnboardingFormProps = {
  defaultBusinessName?: string;
};

export function MerchantOnboardingForm({
  defaultBusinessName = "",
}: MerchantOnboardingFormProps) {
  return (
    <Card className="app-panel mx-auto max-w-3xl">
      <CardHeader className="border-b border-border/60 pb-5">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary"><UserRound className="size-5" /></span>
          <div>
            <Badge variant="outline" className="mb-3 border-info/30 bg-info/10 text-info">Merchant profile · 1 of 1</Badge>
            <CardTitle className="text-2xl">Welcome to Project ZERO</CardTitle>
          </div>
        </div>
        <CardDescription>
          Add your business details and public Stellar Testnet receiving address to start creating invoices.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={createMerchantProfile} className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business name</Label>
            <Input id="businessName" name="businessName" defaultValue={defaultBusinessName} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Public slug</Label>
            <Input id="slug" name="slug" placeholder="zero-market" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="stellarPublicKey">Stellar Testnet receiving public key</Label>
            <Input
              id="stellarPublicKey"
              name="stellarPublicKey"
              placeholder="G..."
              minLength={56}
              maxLength={56}
              required
            />
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-primary/25 bg-primary/6 p-4 md:col-span-2">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
            <div className="text-sm"><p className="font-medium">Public address only</p><p className="mt-1 text-muted-foreground">Project ZERO will never ask for your secret key or seed phrase.</p></div>
          </div>
          <div className="md:col-span-2">
            <Button type="submit" size="lg" className="w-full">Save profile</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
