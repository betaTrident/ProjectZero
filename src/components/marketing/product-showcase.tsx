import {
  BadgeCheck,
  Check,
  CircleDollarSign,
  Clock3,
  Copy,
  FileText,
  LayoutDashboard,
  Plus,
  QrCode,
  Search,
  ShieldCheck,
} from "lucide-react";
import QRCode from "react-qr-code";

import { BrandMark } from "@/components/marketing/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const invoices = [
  { id: "ZERO-1048", customer: "Maria's Online Shop", amount: "125.00 XLM", status: "Paid" },
  { id: "ZERO-1047", customer: "Juan Dela Cruz", amount: "82.00 XLM", status: "Pending" },
  { id: "ZERO-1046", customer: "Print & Press", amount: "210.00 XLM", status: "Paid" },
] as const;

const timeline = [
  ["Invoice created", "10:36 AM"],
  ["Customer authorized in Freighter", "10:41 AM"],
  ["Transaction submitted to Stellar", "10:41 AM"],
  ["Settlement verified on-chain", "10:42 AM"],
  ["Invoice marked as paid", "10:42 AM"],
] as const;

export function ProductShowcase() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
      <Card className="marketing-panel gap-0 py-0">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 sm:px-5">
          <div>
            <p className="font-medium">Invoice dashboard</p>
            <p className="mt-1 text-xs text-muted-foreground">Track every payment request in one place.</p>
          </div>
          <Badge className="bg-primary text-primary-foreground"><Plus /> New invoice</Badge>
        </div>
        <div className="grid min-h-[22rem] sm:grid-cols-[9rem_1fr]">
          <aside className="hidden border-r border-border/60 bg-background/30 p-3 sm:block" aria-label="Illustrative dashboard navigation">
            <BrandMark className="mb-6 scale-90 origin-left" />
            <div className="space-y-1 text-xs">
              <span className="flex items-center gap-2 rounded-md px-2 py-2 text-muted-foreground"><LayoutDashboard className="size-3.5" /> Overview</span>
              <span className="flex items-center gap-2 rounded-md bg-primary/10 px-2 py-2 text-primary"><FileText className="size-3.5" /> Invoices</span>
              <span className="flex items-center gap-2 rounded-md px-2 py-2 text-muted-foreground"><CircleDollarSign className="size-3.5" /> Payments</span>
            </div>
          </aside>
          <div className="min-w-0 p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2 rounded-md border border-border/60 bg-background/50 px-3 py-2 text-xs text-muted-foreground">
              <Search className="size-3.5" /> Search invoices…
            </div>
            <div className="overflow-hidden rounded-lg border border-border/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/30 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2.5 font-medium">Invoice</th>
                    <th className="hidden px-3 py-2.5 font-medium md:table-cell">Customer</th>
                    <th className="px-3 py-2.5 font-medium">Amount</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-t border-border/60">
                      <td className="px-3 py-3 font-mono text-[0.68rem]">{invoice.id}</td>
                      <td className="hidden px-3 py-3 md:table-cell">{invoice.customer}</td>
                      <td className="px-3 py-3 font-mono text-[0.68rem]">{invoice.amount}</td>
                      <td className="px-3 py-3">
                        <span className={invoice.status === "Paid" ? "text-primary" : "text-warning"}>{invoice.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[["Pending", "1"], ["Paid", "2"], ["Verified", "100%"]].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-border/60 bg-background/35 p-3">
                  <p className="font-mono text-base font-semibold">{value}</p>
                  <p className="mt-1 text-[0.65rem] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <Card className="marketing-panel gap-0 py-0">
          <div className="border-b border-border/60 px-4 py-3">
            <p className="font-medium">Create and share</p>
            <p className="mt-1 text-xs text-muted-foreground">A payment request in seconds.</p>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-4 p-4">
            <div className="space-y-3 text-xs">
              <PreviewField label="Item" value="Handmade tote bag" />
              <PreviewField label="Amount" value="125.00 XLM" />
              <PreviewField label="Expires" value="30 minutes" icon={<Clock3 className="size-3" />} />
              <div className="flex min-h-8 items-center justify-center rounded-md bg-primary font-medium text-primary-foreground">Create invoice</div>
            </div>
            <div className="flex w-[7.5rem] flex-col items-center justify-center rounded-lg border border-border/60 bg-background/40 p-3">
              <p className="text-center text-[0.6rem] text-muted-foreground">Payment link</p>
              <div className="mt-2 rounded-md bg-[var(--marketing-qr-background)] p-1.5">
                <QRCode value="https://projectzero.example/pay/ZERO-1048" size={64} aria-label="Example invoice QR code" />
              </div>
              <span className="mt-2 flex items-center gap-1 text-[0.6rem] text-primary"><Copy className="size-3" /> Copy link</span>
            </div>
          </div>
        </Card>

        <Card className="marketing-panel gap-0 py-0">
          <div className="border-b border-border/60 px-4 py-3">
            <p className="font-medium">Verification timeline</p>
            <p className="mt-1 text-xs text-muted-foreground">Confirmation without screenshot checking.</p>
          </div>
          <ol className="space-y-0 p-4">
            {timeline.map(([label, time], index) => (
              <li key={label} className="relative grid grid-cols-[1rem_1fr_auto] gap-2 pb-3 text-[0.68rem] last:pb-0">
                {index < timeline.length - 1 && <span aria-hidden="true" className="absolute left-[0.3rem] top-3 h-full w-px bg-primary/35" />}
                <span className="z-10 mt-0.5 flex size-2.5 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="size-2" /></span>
                <span>{label}</span>
                <span className="font-mono text-muted-foreground">{time}</span>
              </li>
            ))}
          </ol>
          <div className="grid grid-cols-3 gap-1 border-t border-border/60 px-4 py-3 text-center text-[0.55rem] text-muted-foreground">
            <span><ShieldCheck className="mx-auto mb-1 size-3.5 text-primary" />Server verified</span>
            <span><QrCode className="mx-auto mb-1 size-3.5 text-primary" />QR ready</span>
            <span><BadgeCheck className="mx-auto mb-1 size-3.5 text-info" />Testnet</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

function PreviewField({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[0.6rem] text-muted-foreground">{label}</p>
      <div className="flex min-h-8 items-center justify-between rounded-md border border-border/60 bg-background/50 px-2.5">
        <span>{value}</span>
        {icon}
      </div>
    </div>
  );
}
