"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { CreateProductForm } from "@/components/dashboard/create-product-form";
import { ProductsTable } from "@/components/dashboard/products-table";
import { PageHeader } from "@/components/layout/page-header";
import { QueryFeedback } from "@/components/shared/query-feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type ProductRow = {
  id: string;
  name: string;
  price: number | string;
  asset_code: string;
  is_active: boolean;
  image_url: string | null;
};

type ProductsPageContentProps = {
  products: ProductRow[];
};

export function ProductsPageContent({ products }: ProductsPageContentProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <QueryFeedback />
      <PageHeader
        title="Products"
        description="Build a catalog to attach to invoices."
        action={
          <div className="lg:hidden">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger
                render={
                  <Button type="button" size="lg">
                    <Plus data-icon="inline-start" />
                    New product
                  </Button>
                }
              />
              <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-2xl border-border bg-popover">
                <SheetHeader>
                  <SheetTitle>Create product</SheetTitle>
                </SheetHeader>
                <div className="px-4 pb-6">
                  <CreateProductForm idPrefix="mobile-product" />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-[360px_1fr]">
        <Card className="app-panel hidden lg:block">
          <CardHeader>
            <CardTitle>Create product</CardTitle>
            <CardDescription>Products can be reused for payment requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateProductForm idPrefix="desktop-product" />
          </CardContent>
        </Card>

        <Card className="app-panel">
          <CardHeader>
            <CardTitle>Catalog</CardTitle>
            <CardDescription>Only your merchant profile can manage these rows.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProductsTable products={products} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
