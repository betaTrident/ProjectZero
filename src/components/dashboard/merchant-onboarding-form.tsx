import { createMerchantProfile } from "@/actions/merchants";
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
    <Card>
      <CardHeader>
        <CardTitle>Set up merchant profile</CardTitle>
        <CardDescription>
          Add the business name and Stellar Testnet receiving wallet for payment requests.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={createMerchantProfile} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business name</Label>
            <Input id="businessName" name="businessName" defaultValue={defaultBusinessName} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Public slug</Label>
            <Input id="slug" name="slug" placeholder="zero-market" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="stellarPublicKey">Stellar public key</Label>
            <Input
              id="stellarPublicKey"
              name="stellarPublicKey"
              placeholder="G..."
              minLength={56}
              maxLength={56}
              required
            />
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Save profile</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
