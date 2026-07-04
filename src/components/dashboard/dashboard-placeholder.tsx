import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DashboardPlaceholderProps = {
  title: string;
};

export function DashboardPlaceholder({ title }: DashboardPlaceholderProps) {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Project ZERO</p>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          </div>
          <Badge variant="secondary">Phase 1 placeholder</Badge>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{title} foundation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Protected dashboard data, Supabase Auth, and merchant-owned records
              are implemented in Phase 2.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
