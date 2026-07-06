import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PaymentPagePlaceholderProps = {
  paymentRequestId: string;
};

export function PaymentPagePlaceholder({
  paymentRequestId,
}: PaymentPagePlaceholderProps) {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto w-full max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Payment request</CardTitle>
              <Badge variant="outline">Pending UI</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-mono text-sm text-muted-foreground">
              {paymentRequestId}
            </p>
            <p className="text-sm text-muted-foreground">
              Loading the public payment request and wallet options.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
